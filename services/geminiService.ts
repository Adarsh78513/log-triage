/**
 * Gemini Service - Now delegates to Python backend
 * 
 * This file has been updated to communicate with the Python FastAPI backend
 * instead of directly calling the Gemini API from the frontend.
 * All logic now resides in the backend for better security and modularity.
 */

import type { TriageResult, TriageStatus, ValidationResult, UploadedLog } from '../types';
import * as backendClient from './backendClient';

type LogForTriage = { content: string, type: UploadedLog['type'] };

/**
 * Calls the Python backend to validate the user's issue description.
 */
export const validateDescription = async (
  userAnswers: Record<string, string>,
  currentDescription: string
): Promise<ValidationResult> => {
  return await backendClient.validateDescription(userAnswers, currentDescription);
};

/**
 * Submits a triage request to the Python backend.
 * Returns a task ID for polling.
 */
export const performTriage = (
  logs: LogForTriage[],
  userAnswers: Record<string, string>
): Promise<{ taskId: string }> => {
  // Convert logs to backend format
  const backendLogs = logs.map(log => ({
    content: log.content,
    type: log.type
  }));

  return backendClient.performTriage(backendLogs, userAnswers);
};

/**
 * Cancels a triage request.
 */
export const cancelTriage = (taskId: string): Promise<void> => {
  return backendClient.cancelTriage(taskId);
};

/**
 * Polls the Python backend for the status of a triage task.
 */
export const pollTriageStatus = async (taskId: string): Promise<TriageStatus> => {
  return await backendClient.pollTriageStatus(taskId);
};