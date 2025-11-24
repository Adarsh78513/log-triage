export interface Question {
  id: string;
  text: string;
  type?: 'multiple-choice' | 'textarea';
  options?: string[];
  placeholder?: string;
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

export type MessageSender = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text?: string;
  options?: string[];
  requiresFileUpload?: boolean;
  result?: TriageResult;
  isLoading?: boolean;
}

export interface ValidationResult {
  isSufficient: boolean;
  clarifyingQuestion: string;
  summary: string;
}

export type LogUploadMode = 'none' | 'single' | 'compare_good' | 'compare_bad';

export interface UploadedLog {
  file: File;
  type: 'bad1' | 'good' | 'bad2';
}