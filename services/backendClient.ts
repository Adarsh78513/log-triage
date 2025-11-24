/**
 * Frontend client for communicating with the Python backend API.
 * This module provides type-safe functions to interact with all backend endpoints.
 */


const API_BASE_URL = '/api';

export interface ValidationRequest {
    userAnswers: Record<string, string>;
    currentDescription: string;
}

export interface ValidationResult {
    isSufficient: boolean;
    clarifyingQuestion: string;
    summary: string;
}

export interface LogFile {
    content: string;
    type: 'bad1' | 'good' | 'bad2';
}

export interface TriageRequest {
    logs: LogFile[];
    userAnswers: Record<string, string>;
}

export interface TriageResult {
    summary: string;
    potentialIssues: string[];
    suggestedActions: string[];
}

export interface TriageStatus {
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
    message: string;
    result?: TriageResult;
}

export interface TaskResponse {
    taskId: string;
}

/**
 * Validate user's issue description
 */
export async function validateDescription(
    userAnswers: Record<string, string>,
    currentDescription: string
): Promise<ValidationResult> {
    const response = await fetch(`${API_BASE_URL}/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_answers: userAnswers,
            current_description: currentDescription,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Validation failed' }));
        throw new Error(error.detail || 'Validation failed');
    }

    const data = await response.json();

    // Convert snake_case to camelCase for frontend
    return {
        isSufficient: data.is_sufficient,
        clarifyingQuestion: data.clarifying_question,
        summary: data.summary,
    };
}

/**
 * Submit a triage request
 */
export async function performTriage(
    logs: LogFile[],
    userAnswers: Record<string, string>
): Promise<TaskResponse> {
    const response = await fetch(`${API_BASE_URL}/triage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            logs: logs,
            user_answers: userAnswers,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Triage submission failed' }));
        throw new Error(error.detail || 'Triage submission failed');
    }

    const data = await response.json();

    return {
        taskId: data.task_id,
    };
}

/**
 * Poll the status of a triage task
 */
export async function pollTriageStatus(taskId: string): Promise<TriageStatus> {
    const response = await fetch(`${API_BASE_URL}/triage/status/${taskId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to get status' }));
        throw new Error(error.detail || 'Failed to get status');
    }

    const data = await response.json();

    // Convert snake_case to camelCase for frontend
    const result: TriageStatus = {
        status: data.status,
        message: data.message,
    };

    if (data.result) {
        result.result = {
            summary: data.result.summary,
            potentialIssues: data.result.potential_issues,
            suggestedActions: data.result.suggested_actions,
        };
    }

    return result;
}

/**
 * Cancel a triage task
 */
export async function cancelTriage(taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/triage/cancel/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to cancel task' }));
        throw new Error(error.detail || 'Failed to cancel task');
    }
}

export interface RAGDocument {
    filename: string;
    content: string;
    size: number;
}

export interface RAGUploadResponse {
    success: boolean;
    processedCount: number;
    message: string;
}

/**
 * Upload documents to RAG system
 */
export async function uploadToRAG(
    documents: RAGDocument[],
    techArea: string
): Promise<RAGUploadResponse> {
    const response = await fetch(`${API_BASE_URL}/rag/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            documents: documents,
            tech_area: techArea,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'RAG upload failed' }));
        throw new Error(error.detail || 'RAG upload failed');
    }

    const data = await response.json();

    return {
        success: data.success,
        processedCount: data.processed_count,
        message: data.message,
    };
}

export interface ChatMessageModel {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    message: string;
    history: ChatMessageModel[];
}

export interface ChatResponse {
    response: string;
}

/**
 * Chat about a completed triage report
 */
export async function chatWithReport(
    taskId: string,
    message: string,
    history: ChatMessageModel[]
): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/${taskId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            history: history,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Chat failed' }));
        throw new Error(error.detail || 'Chat failed');
    }

    const data = await response.json();

    return {
        response: data.response,
    };
}




