"""
API routes for the log triage application.
Defines all REST endpoints for validation, triage submission, and status polling.
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from typing import Annotated

from models.schemas import (
    ValidationRequest,
    ValidationResult,
    TriageRequest,
    TriageStatus,
    TaskResponse,
)
from services import GeminiAIService, TaskManager


router = APIRouter(prefix="/api")

# Service instances (singleton pattern)
_ai_service: GeminiAIService | None = None
_task_manager: TaskManager | None = None


def get_ai_service() -> GeminiAIService:
    """Dependency to get AI service instance."""
    global _ai_service
    if _ai_service is None:
        _ai_service = GeminiAIService()
    return _ai_service


def get_task_manager(
    ai_service: Annotated[GeminiAIService, Depends(get_ai_service)]
) -> TaskManager:
    """Dependency to get task manager instance."""
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager(ai_service)
    return _task_manager


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "log-triage-backend"}


@router.post("/validate", response_model=ValidationResult)
async def validate_description(
    request: ValidationRequest,
    ai_service: Annotated[GeminiAIService, Depends(get_ai_service)]
) -> ValidationResult:
    """
    Validate if the user's issue description is sufficient.
    
    Args:
        request: Validation request with user answers and current description
        ai_service: AI service dependency
        
    Returns:
        ValidationResult with sufficiency status and clarifying question or summary
    """
    try:
        result = await ai_service.validate_description(
            user_answers=request.user_answers,
            current_description=request.current_description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/triage", response_model=TaskResponse)
async def submit_triage(
    request: TriageRequest,
    background_tasks: BackgroundTasks,
    task_manager: Annotated[TaskManager, Depends(get_task_manager)]
) -> TaskResponse:
    """
    Submit a triage request and get a task ID.
    The actual processing happens in the background.
    
    Args:
        request: Triage request with logs and user answers
        background_tasks: FastAPI background tasks
        task_manager: Task manager dependency
        
    Returns:
        TaskResponse with task ID for polling
    """
    try:
        # Create task
        task_id = task_manager.create_task(
            logs=request.logs,
            user_answers=request.user_answers
        )
        
        # Schedule background processing
        background_tasks.add_task(task_manager.process_task, task_id)
        
        return TaskResponse(task_id=task_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit triage: {str(e)}")


@router.get("/triage/status/{task_id}", response_model=TriageStatus)
async def get_triage_status(
    task_id: str,
    task_manager: Annotated[TaskManager, Depends(get_task_manager)]
) -> TriageStatus:
    """
    Poll the status of a triage task.
    
    Args:
        task_id: The task ID to check
        task_manager: Task manager dependency
        
    Returns:
        TriageStatus with current status and result if complete
    """
    status, message, result = task_manager.get_task_status(task_id)
    
    return TriageStatus(
        status=status,
        message=message,
        result=result
    )


@router.post("/triage/cancel/{task_id}")
async def cancel_triage(
    task_id: str,
    task_manager: Annotated[TaskManager, Depends(get_task_manager)]
) -> dict:
    """
    Cancel a pending or processing triage task.
    
    Args:
        task_id: The task ID to cancel
        task_manager: Task manager dependency
        
    Returns:
        Success status
    """
    cancelled = task_manager.cancel_task(task_id)
    
    if cancelled:
        return {"success": True, "message": "Task cancelled successfully"}
    else:
        return {"success": False, "message": "Task not found or already completed"}
