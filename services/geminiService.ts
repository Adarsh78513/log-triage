import { GoogleGenAI, Type } from "@google/genai";
import type { TriageResult, TriageStatus, ValidationResult, UploadedLog } from '../types';

type LogForTriage = { content: string, type: UploadedLog['type'] };

// This is a mock in-memory store for our "tasks".
// In a real app, this would be managed by a backend (e.g., Redis, database).
const taskStore: Record<string, { status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'; result?: TriageResult; logs: LogForTriage[]; userAnswers: Record<string, string> }> = {};

/**
 * Calls Gemini to validate the user's issue description.
 */
export const validateDescription = async (
  userAnswers: Record<string, string>,
  currentDescription: string
): Promise<ValidationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const context = Object.entries(userAnswers)
    .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
    .join('\n');

  const prompt = `
    You are a helpful Senior Site Reliability Engineer (SRE) helping a user describe their technical issue.
    The user has provided some initial context and a description of their problem.
    Your task is to determine if their description is sufficient for a technical investigation, and if so, summarize it for confirmation.
    A good description includes three key elements:
    1.  **Action:** What the user was trying to do.
    2.  **Observation:** What actually happened (e.g., error message, unexpected behavior).
    3.  **Expectation:** What the user expected to happen.

    ## User Context
    ${context}

    ## User's Problem Description
    "${currentDescription}"

    Analyze the "User's Problem Description".
    - If it clearly contains all three elements (Action, Observation, Expectation), then the description is sufficient. In this case, you MUST create a concise summary of your understanding for the user to confirm.
    - If one or more elements are missing or unclear, ask a single, simple, and direct question to get the missing information. For example, if the expectation is missing, ask "What did you expect to happen?".

    Please respond in a structured JSON format.
    The JSON object must contain three keys:
    1.  "isSufficient": A boolean, true if the description is sufficient, false otherwise.
    2.  "clarifyingQuestion": A string. If the description is NOT sufficient, this should contain the question to ask the user. If it IS sufficient, this should be an empty string.
    3.  "summary": A string. If the description IS sufficient, this should contain your summary. Phrase it as a confirmation, for example: "Okay, let me confirm my understanding. You were trying to update a user's profile, but you observed a '500 Internal Server Error', and you expected to see a success message. Is this correct?". If the description is NOT sufficient, this should be an empty string.
  `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isSufficient: { type: Type.BOOLEAN },
                    clarifyingQuestion: { type: Type.STRING },
                    summary: { type: Type.STRING }
                },
                required: ['isSufficient', 'clarifyingQuestion', 'summary']
            }
        }
    });

    const jsonText = response.text.trim();
    const result: ValidationResult = JSON.parse(jsonText);
    return result;
};


/**
 * Simulates submitting a triage request to a backend.
 * It creates a task ID and stores the data for later processing.
 */
export const performTriage = (logs: LogForTriage[], userAnswers: Record<string, string>): Promise<{ taskId: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      taskStore[taskId] = { status: 'PENDING', logs, userAnswers };
      resolve({ taskId });
    }, 500); // Simulate network latency for task submission
  });
};

/**
 * Simulates cancelling a triage request.
 */
export const cancelTriage = (taskId: string): Promise<void> => {
  return new Promise((resolve) => {
    const task = taskStore[taskId];
    if (task && (task.status === 'PENDING' || task.status === 'PROCESSING')) {
      task.status = 'FAILED';
    }
    resolve();
  });
};


/**
 * Simulates polling a backend for the status of a triage task.
 * The first time it's polled for a 'PENDING' task, it triggers the actual Gemini API call.
 */
export const pollTriageStatus = async (taskId: string): Promise<TriageStatus> => {
  const task = taskStore[taskId];

  if (!task) {
    return { status: 'FAILED', message: 'Task not found.' };
  }

  if (task.status === 'SUCCESS' || task.status === 'FAILED') {
    return { status: task.status, message: task.status === 'FAILED' ? 'Analysis failed or was cancelled.' : 'Complete', result: task.result };
  }

  if (task.status === 'PENDING') {
    // Transition to PROCESSING and start the real work
    task.status = 'PROCESSING';
    
    // Fire off the Gemini call but don't wait for it here. 
    // The next poll will pick up the result.
    callGeminiApi(taskId, task.logs, task.userAnswers).catch(err => {
        console.error("Gemini API call failed", err);
        task.status = 'FAILED';
    });
    
    return { status: 'PROCESSING', message: 'AI is reviewing the logs...' };
  }

  // If still processing, just return the current status
  return { status: 'PROCESSING', message: 'Generating summary and actions...' };
};


/**
 * The actual function that calls the Gemini API for final triage.
 */
const callGeminiApi = async (taskId: string, logs: LogForTriage[], userAnswers: Record<string, string>) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const description = userAnswers.usecase_description || 'Not provided.';
    const otherContext = Object.entries(userAnswers)
      .filter(([key]) => key !== 'usecase_description')
      .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
      .join('\n');

    let logSection = '';
    if (logs.length === 1) {
        logSection = `
## Log File Content
\`\`\`
${logs[0].content}
\`\`\`
`;
    } else {
        const badLog1 = logs.find(l => l.type === 'bad1');
        const goodLog = logs.find(l => l.type === 'good');
        const badLog2 = logs.find(l => l.type === 'bad2');
        
        logSection = '## Log Files for Comparison\n\n';

        if (badLog1) {
            logSection += `### Log File A (Bad Log)\n\`\`\`\n${badLog1.content}\n\`\`\`\n`;
        }
        if (goodLog) {
            logSection += `### Log File B (Good Log - for comparison)\n\`\`\`\n${goodLog.content}\n\`\`\`\n`;
        }
        if (badLog2) {
            logSection += `### Log File B (Second Bad Log - for comparison)\n\`\`\`\n${badLog2.content}\n\`\`\`\n`;
        }
    }

    const prompt = `
      You are an expert Senior Site Reliability Engineer (SRE) performing a log triage.
      A user has provided a description of their issue, some context, and one or two log files.
      Your task is to analyze the log file(s), identify the root cause, and suggest actionable steps.
      ${logs.length > 1 ? `
      **IMPORTANT**: Two log files have been provided for comparison. Your primary goal is to identify the key differences between them that explain the issue. Focus on new errors, missing success messages, different timings, or changes in behavior between the 'good' and 'bad' logs (or between the two 'bad' logs). Your summary should highlight the findings from this comparison.
      ` : ''}
      
      ## User's Description of the Issue
      ${description}
      
      ## Additional Context
      ${otherContext}
      
      ${logSection}
      
      Please provide your analysis in a structured JSON format.
      The JSON object should contain three keys:
      1. "summary": A brief, one-paragraph executive summary of the problem. If a comparison was done, this summary MUST explain the key differences found.
      2. "potentialIssues": An array of strings, where each string is a specific error or issue you identified.
      3. "suggestedActions": An array of strings, where each string is a clear, actionable step for a developer to take. Prioritize the most likely solutions first. Each action should be a concise instruction.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    potentialIssues: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    suggestedActions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const jsonText = response.text;
    const result: TriageResult = JSON.parse(jsonText);
    
    // Check if task was cancelled while we were waiting for the API
    if (taskStore[taskId].status === 'PROCESSING') {
        taskStore[taskId].status = 'SUCCESS';
        taskStore[taskId].result = result;
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if(taskStore[taskId]) {
        taskStore[taskId].status = 'FAILED';
    }
  }
};