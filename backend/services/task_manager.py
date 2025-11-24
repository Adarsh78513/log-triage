"""
Task manager for handling triage tasks.
Manages task storage, status tracking, and background processing.
Can be easily replaced with Redis or database-backed storage.
"""
import asyncio
import time
import random
import string
from typing import Optional, Literal
from threading import Lock

from models.schemas import TriageResult, LogFile
from .base import BaseAIService


class Task:
    """Represents a triage task."""
    
    def __init__(
        self,
        task_id: str,
        logs: list[LogFile],
        user_answers: dict[str, str]
    ):
        self.task_id = task_id
        self.logs = logs
        self.user_answers = user_answers
        self.status: Literal["PENDING", "PROCESSING", "SUCCESS", "FAILED"] = "PENDING"
        self.result: Optional[TriageResult] = None
        self.message: str = "Task submitted"


class TaskManager:
    """
    Manages triage tasks with in-memory storage.
    
    This can be easily replaced with Redis, database, or other storage solutions
    by implementing the same interface.
    """
    
    def __init__(self, ai_service: BaseAIService):
        """
        Initialize task manager.
        
        Args:
            ai_service: The AI service to use for processing tasks
        """
        self.ai_service = ai_service
        self.tasks: dict[str, Task] = {}
        self.lock = Lock()
    
    def create_task(
        self,
        logs: list[LogFile],
        user_answers: dict[str, str]
    ) -> str:
        """
        Create a new triage task.
        
        Args:
            logs: List of log files to analyze
            user_answers: User's answers to questions
            
        Returns:
            Task ID
        """
        # Generate unique task ID
        timestamp = str(int(time.time() * 1000))
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))
        task_id = f"task_{timestamp}_{random_suffix}"
        
        # Create and store task
        task = Task(task_id, logs, user_answers)
        
        with self.lock:
            self.tasks[task_id] = task
        
        return task_id
    
    def get_task_status(self, task_id: str) -> tuple[
        Literal["PENDING", "PROCESSING", "SUCCESS", "FAILED"],
        str,
        Optional[TriageResult]
    ]:
        """
        Get the status of a task.
        
        Args:
            task_id: The task ID
            
        Returns:
            Tuple of (status, message, result)
        """
        with self.lock:
            task = self.tasks.get(task_id)
        
        if not task:
            return ("FAILED", "Task not found.", None)
        
        return (task.status, task.message, task.result)
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a task if it's pending or processing.
        
        Args:
            task_id: The task ID
            
        Returns:
            True if task was cancelled, False otherwise
        """
        with self.lock:
            task = self.tasks.get(task_id)
            if task and task.status in ["PENDING", "PROCESSING"]:
                task.status = "FAILED"
                task.message = "Task cancelled by user."
                return True
        
        return False
    
    async def process_task(self, task_id: str) -> None:
        """
        Process a task by calling the AI service.
        This is meant to be called as a background task.
        
        Args:
            task_id: The task ID
        """
        with self.lock:
            task = self.tasks.get(task_id)
            if not task or task.status != "PENDING":
                return
            
            # Mark as processing
            task.status = "PROCESSING"
            task.message = "AI is reviewing the logs..."
        
        try:
            # Call AI service to perform triage
            result = await self.ai_service.perform_triage(
                logs=task.logs,
                user_answers=task.user_answers
            )
            
            # Update task with result
            with self.lock:
                # Check if task was cancelled while we were processing
                if task.status == "PROCESSING":
                    task.status = "SUCCESS"
                    task.message = "Complete"
                    task.result = result
        
        except Exception as e:
            # Handle errors
            print(f"Error processing task {task_id}: {e}")
            with self.lock:
                if task.status == "PROCESSING":
                    task.status = "FAILED"
                    task.message = f"Analysis failed: {str(e)}"
