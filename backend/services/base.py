"""
Abstract base class for AI services.
This defines the interface that all AI service implementations must follow,
enabling easy swapping between different AI providers (Gemini, OpenAI, etc.).
"""
from abc import ABC, abstractmethod
from models.schemas import ValidationResult, TriageResult, LogFile


class BaseAIService(ABC):
    """
    Abstract base class for AI services.
    
    Any AI provider (Gemini, OpenAI, Anthropic, etc.) should implement this interface
    to ensure compatibility with the application.
    """
    
    @abstractmethod
    async def validate_description(
        self,
        user_answers: dict[str, str],
        current_description: str
    ) -> ValidationResult:
        """
        Validate if the user's issue description is sufficient.
        
        Args:
            user_answers: Dictionary of user's answers to questions
            current_description: The current issue description
            
        Returns:
            ValidationResult with sufficiency status and clarifying question or summary
        """
        pass
    
    @abstractmethod
    async def perform_triage(
        self,
        logs: list[LogFile],
        user_answers: dict[str, str]
    ) -> TriageResult:
        """
        Perform log triage analysis.
        
        Args:
            logs: List of log files to analyze
            user_answers: Dictionary of user's answers to questions
            
        Returns:
            TriageResult with analysis summary, issues, and suggested actions
        """
        pass
