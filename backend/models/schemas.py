"""
Pydantic models for request/response validation.
These models define the API contract and ensure type safety.
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional


class ValidationRequest(BaseModel):
    """Request model for validating user's issue description."""
    user_answers: dict[str, str] = Field(..., description="User's answers to questions")
    current_description: str = Field(..., description="Current issue description")


class ValidationResult(BaseModel):
    """Response model for validation results."""
    is_sufficient: bool = Field(..., description="Whether description is sufficient")
    clarifying_question: str = Field(default="", description="Question to ask if insufficient")
    summary: str = Field(default="", description="Summary if sufficient")


class LogFile(BaseModel):
    """Model for uploaded log file."""
    content: str = Field(..., description="Log file content")
    type: Literal["bad1", "good", "bad2"] = Field(..., description="Type of log file")


class TriageRequest(BaseModel):
    """Request model for submitting a triage task."""
    logs: list[LogFile] = Field(..., description="List of log files to analyze")
    user_answers: dict[str, str] = Field(..., description="User's answers to questions")


class TriageResult(BaseModel):
    """Model for triage analysis results."""
    summary: str = Field(..., description="Executive summary of the problem")
    potential_issues: list[str] = Field(..., description="List of identified issues")
    suggested_actions: list[str] = Field(..., description="List of actionable steps")


class TriageStatus(BaseModel):
    """Response model for triage status polling."""
    status: Literal["PENDING", "PROCESSING", "SUCCESS", "FAILED"] = Field(
        ..., description="Current task status"
    )
    message: str = Field(..., description="Status message")
    result: Optional[TriageResult] = Field(None, description="Results if completed")


class TaskResponse(BaseModel):
    """Response model when submitting a triage task."""
    task_id: str = Field(..., description="Unique task identifier")


class ChatMessageModel(BaseModel):
    """Model for a single chat message."""
    role: Literal["user", "assistant"] = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    """Request model for chat about triage report."""
    message: str = Field(..., description="User's question about the report")
    history: list[ChatMessageModel] = Field(default_factory=list, description="Previous conversation history")


class ChatResponse(BaseModel):
    """Response model for chat interactions."""
    response: str = Field(..., description="AI's response to the user's question")


class RAGDocument(BaseModel):
    """Model for a single document to be uploaded to RAG."""
    filename: str = Field(..., description="Name of the file")
    content: str = Field(..., description="Text content of the file")
    size: int = Field(..., description="Size of the file in bytes")


class RAGUploadRequest(BaseModel):
    """Request model for uploading documents to RAG."""
    documents: list[RAGDocument] = Field(..., description="List of documents to upload")
    tech_area: str = Field(..., description="Technical area/category for the documents")


class RAGUploadResponse(BaseModel):
    """Response model for RAG upload operation."""
    success: bool = Field(..., description="Whether the upload was successful")
    processed_count: int = Field(..., description="Number of documents processed")
    message: str = Field(..., description="Status message")
