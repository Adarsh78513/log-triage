"""
Gemini AI service implementation.
This is the concrete implementation of BaseAIService using Google's Gemini API.
"""
import json
from google import genai
from google.genai.types import GenerateContentConfig, Schema, Type

from .base import BaseAIService
from models.schemas import ValidationResult, TriageResult, LogFile
from config import settings


class GeminiAIService(BaseAIService):
    """Gemini AI service implementation."""
    
    def __init__(self):
        """Initialize the Gemini AI client."""
        self.client = genai.Client(api_key=settings.api_key)
        self.model_name = settings.model_name
    
    async def validate_description(
        self,
        user_answers: dict[str, str],
        current_description: str
    ) -> ValidationResult:
        """
        Validate if the user's issue description is sufficient using Gemini.
        
        Args:
            user_answers: Dictionary of user's answers to questions
            current_description: The current issue description
            
        Returns:
            ValidationResult with sufficiency status and clarifying question or summary
        """
        # Build context from user answers
        context = "\n".join(
            f"- {key.replace('_', ' ')}: {value}"
            for key, value in user_answers.items()
        )
        
        prompt = f"""
You are a helpful Senior Site Reliability Engineer (SRE) helping a user describe their technical issue.
The user has provided some initial context and a description of their problem.
Your task is to determine if their description is sufficient for a technical investigation, and if so, summarize it for confirmation.
A good description includes three key elements:
1.  **Action:** What the user was trying to do.
2.  **Observation:** What actually happened (e.g., error message, unexpected behavior).
3.  **Expectation:** What the user expected to happen.

## User Context
{context}

## User's Problem Description
"{current_description}"

Analyze the "User's Problem Description".
- If it clearly contains all three elements (Action, Observation, Expectation), then the description is sufficient. In this case, you MUST create a concise summary of your understanding for the user to confirm.
- If one or more elements are missing or unclear, ask a single, simple, and direct question to get the missing information. For example, if the expectation is missing, ask "What did you expect to happen?".

Please respond in a structured JSON format.
The JSON object must contain three keys:
1.  "isSufficient": A boolean, true if the description is sufficient, false otherwise.
2.  "clarifyingQuestion": A string. If the description is NOT sufficient, this should contain the question to ask the user. If it IS sufficient, this should be an empty string.
3.  "summary": A string. If the description IS sufficient, this should contain your summary. Phrase it as a confirmation, for example: "Okay, let me confirm my understanding. You were trying to update a user's profile, but you observed a '500 Internal Server Error', and you expected to see a success message. Is this correct?". If the description is NOT sufficient, this should be an empty string.
"""
        
        # Define response schema
        response_schema = Schema(
            type=Type.OBJECT,
            properties={
                "isSufficient": Schema(type=Type.BOOLEAN),
                "clarifyingQuestion": Schema(type=Type.STRING),
                "summary": Schema(type=Type.STRING)
            },
            required=["isSufficient", "clarifyingQuestion", "summary"]
        )
        
        # Generate content with structured output
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        
        # Parse JSON response
        result_data = json.loads(response.text)
        
        return ValidationResult(
            is_sufficient=result_data["isSufficient"],
            clarifying_question=result_data["clarifyingQuestion"],
            summary=result_data["summary"]
        )
    
    async def perform_triage(
        self,
        logs: list[LogFile],
        user_answers: dict[str, str]
    ) -> TriageResult:
        """
        Perform log triage analysis using Gemini.
        
        Args:
            logs: List of log files to analyze
            user_answers: Dictionary of user's answers to questions
            
        Returns:
            TriageResult with analysis summary, issues, and suggested actions
        """
        # Extract description and other context
        description = user_answers.get("usecase_description", "Not provided.")
        other_context = "\n".join(
            f"- {key.replace('_', ' ')}: {value}"
            for key, value in user_answers.items()
            if key != "usecase_description"
        )
        
        # Build log section based on number of logs
        if len(logs) == 1:
            log_section = f"""
## Log File Content
```
{logs[0].content}
```
"""
        else:
            bad_log1 = next((log for log in logs if log.type == "bad1"), None)
            good_log = next((log for log in logs if log.type == "good"), None)
            bad_log2 = next((log for log in logs if log.type == "bad2"), None)
            
            log_section = "## Log Files for Comparison\n\n"
            
            if bad_log1:
                log_section += f"### Log File A (Bad Log)\n```\n{bad_log1.content}\n```\n"
            if good_log:
                log_section += f"### Log File B (Good Log - for comparison)\n```\n{good_log.content}\n```\n"
            if bad_log2:
                log_section += f"### Log File B (Second Bad Log - for comparison)\n```\n{bad_log2.content}\n```\n"
        
        comparison_note = ""
        if len(logs) > 1:
            comparison_note = """
**IMPORTANT**: Two log files have been provided for comparison. Your primary goal is to identify the key differences between them that explain the issue. Focus on new errors, missing success messages, different timings, or changes in behavior between the 'good' and 'bad' logs (or between the two 'bad' logs). Your summary should highlight the findings from this comparison.
"""
        
        prompt = f"""
You are an expert Senior Site Reliability Engineer (SRE) performing a log triage.
A user has provided a description of their issue, some context, and one or two log files.
Your task is to analyze the log file(s), identify the root cause, and suggest actionable steps.
{comparison_note}

## User's Description of the Issue
{description}

## Additional Context
{other_context}

{log_section}

Please provide your analysis in a structured JSON format.
The JSON object should contain three keys:
1. "summary": A brief, one-paragraph executive summary of the problem. If a comparison was done, this summary MUST explain the key differences found.
2. "potentialIssues": An array of strings, where each string is a specific error or issue you identified.
3. "suggestedActions": An array of strings, where each string is a clear, actionable step for a developer to take. Prioritize the most likely solutions first. Each action should be a concise instruction.
"""
        
        # Define response schema
        response_schema = Schema(
            type=Type.OBJECT,
            properties={
                "summary": Schema(type=Type.STRING),
                "potentialIssues": Schema(
                    type=Type.ARRAY,
                    items=Schema(type=Type.STRING)
                ),
                "suggestedActions": Schema(
                    type=Type.ARRAY,
                    items=Schema(type=Type.STRING)
                )
            },
            required=["summary", "potentialIssues", "suggestedActions"]
        )
        
        # Generate content with structured output
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        
        # Parse JSON response
        result_data = json.loads(response.text)
        
        return TriageResult(
            summary=result_data["summary"],
            potential_issues=result_data["potentialIssues"],
            suggested_actions=result_data["suggestedActions"]
        )
    
    async def chat_about_report(
        self,
        user_message: str,
        triage_result: TriageResult,
        logs: list[LogFile],
        user_answers: dict[str, str],
        conversation_history: list[dict[str, str]]
    ) -> str:
        """
        Chat about the triage report with context.
        
        Args:
            user_message: The user's question
            triage_result: The original triage analysis result
            logs: The original log files
            user_answers: The user's original answers
            conversation_history: Previous chat messages
            
        Returns:
            AI's response to the user's question
        """
        # Build log section
        if len(logs) == 1:
            log_section = f"""
## Original Log File
```
{logs[0].content}
```
"""
        else:
            log_section = "## Original Log Files\n\n"
            for i, log in enumerate(logs, 1):
                log_type = log.type.replace('1', '').replace('2', '')
                log_section += f"### Log {i} ({log_type} log)\n```\n{log.content}\n```\n\n"
        
        # Build conversation context
        conversation_context = ""
        if conversation_history:
            conversation_context = "\n## Previous Conversation\n"
            for msg in conversation_history:
                role_label = "User" if msg["role"] == "user" else "Assistant"
                conversation_context += f"**{role_label}**: {msg['content']}\n\n"
        
        # Build the complete context prompt
        description = user_answers.get("usecase_description", "Not provided.")
        
        prompt = f"""
You are an expert Senior Site Reliability Engineer (SRE) helping a user understand a log triage report.
The user has already received a triage analysis and now has follow-up questions.

## Original Issue Description
{description}

## Triage Report Summary
{triage_result.summary}

## Identified Issues
{chr(10).join(f"{i+1}. {issue}" for i, issue in enumerate(triage_result.potential_issues))}

## Suggested Actions
{chr(10).join(f"{i+1}. {action}" for i, action in enumerate(triage_result.suggested_actions))}

{log_section}
{conversation_context}

## User's Current Question
{user_message}

Please provide a helpful, detailed response to the user's question. You can reference:
- Specific parts of the logs (quote relevant lines)
- The issues identified in the triage report
- The suggested actions
- Technical details about the errors or problems

Be conversational but technically accurate. If the user asks about something not in the logs or report, acknowledge the limitation but provide useful context where possible.
"""
        
        # Generate response
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=GenerateContentConfig(
                temperature=0.7  # Slightly more creative for conversational responses
            )
        )
        
        return response.text
