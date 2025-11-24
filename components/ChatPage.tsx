import React, { useState, useCallback, useEffect, useRef } from 'react';
import { performTriage, pollTriageStatus, validateDescription, cancelTriage } from '../services/backendClient';
import type { TriageResult, ChatMessage, MessageSender, UploadedLog, LogUploadMode, ProcessingState } from '../types';
import { TRIAGE_QUESTIONS } from '../constants';
import { ChatInterface } from './ChatInterface';
import { ChatDeepDive } from './ChatDeepDive';


const BOT_TYPING_DELAY = 500;
const POLLING_INTERVAL = 2000;

export function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [processingState, setProcessingState] = useState<ProcessingState>('idle');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isInClarificationLoop, setIsInClarificationLoop] = useState(false);
    const [logUploadMode, setLogUploadMode] = useState<LogUploadMode>('none');
    const [uploadedLogs, setUploadedLogs] = useState<UploadedLog[]>([]);
    const [restoredText, setRestoredText] = useState<string | undefined>();

    const [completedResult, setCompletedResult] = useState<TriageResult | null>(null);
    const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);

    const currentQuestionIndexRef = useRef(0);
    const descriptionRef = useRef('');
    const triageTaskIdRef = useRef<string | null>(null);
    const pollingTimeoutIdRef = useRef<number | null>(null);

    const processingStateRef = useRef(processingState);
    useEffect(() => {
        processingStateRef.current = processingState;
    }, [processingState]);

    const addMessage = (sender: MessageSender, text?: string, options?: string[], requiresFileUpload?: boolean, result?: TriageResult, isLoading?: boolean) => {
        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            sender,
            text,
            options,
            requiresFileUpload,
            result,
            isLoading,
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const askQuestion = useCallback(() => {
        setIsBotTyping(true);
        setTimeout(() => {
            const questionIndex = currentQuestionIndexRef.current;
            if (questionIndex < TRIAGE_QUESTIONS.length) {
                const question = TRIAGE_QUESTIONS[questionIndex];
                addMessage('bot', question.text, question.options);
            } else {
                // Log uploading phase
                if (logUploadMode === 'single') {
                    addMessage('bot', "Great. Now, please upload the relevant log file for analysis.", undefined, true);
                } else if (logUploadMode === 'compare_good') {
                    if (uploadedLogs.length === 0) {
                        addMessage('bot', "Understood. First, please upload the 'bad' log file from when the issue occurred.", undefined, true);
                    } else {
                        addMessage('bot', "Got it. Now, please upload the 'good' log file from when things were working correctly.", undefined, true);
                    }
                } else if (logUploadMode === 'compare_bad') {
                    if (uploadedLogs.length === 0) {
                        addMessage('bot', "Okay. Please upload the first 'bad' log file.", undefined, true);
                    } else {
                        addMessage('bot', "Thanks. Now, please upload the second 'bad' log file for comparison.", undefined, true);
                    }
                }
            }
            setIsBotTyping(false);

            // Delay showing input to make it feel more natural
            setTimeout(() => {
                setProcessingState('awaiting_user_input');
            }, 400);

        }, BOT_TYPING_DELAY);
    }, [logUploadMode, uploadedLogs.length]);

    // Initial greeting
    useEffect(() => {
        if (processingState === 'idle') {
            setIsBotTyping(true);
            setTimeout(() => {
                addMessage('bot', "Hello! I'm here to help you triage your log files. Let's start with a few questions to understand the context.");
                setIsBotTyping(false);
                setTimeout(askQuestion, 100);
            }, BOT_TYPING_DELAY);
        }
    }, [processingState, askQuestion]);

    const validateFullDescription = async () => {
        setProcessingState('validating_description');
        addMessage('bot', 'Analyzing description...', undefined, false, undefined, true);

        try {
            const validationResult = await validateDescription(userAnswers, descriptionRef.current);

            if (processingStateRef.current !== 'validating_description') return;

            setMessages(prev => prev.filter(m => !m.isLoading));

            if (validationResult.isSufficient) {
                setIsInClarificationLoop(false);
                addMessage('bot', validationResult.summary);
                setProcessingState('awaiting_confirmation');
            } else {
                addMessage('bot', validationResult.clarifyingQuestion);
                setProcessingState('awaiting_user_input');
            }
        } catch (error) {
            if (processingStateRef.current !== 'validating_description') return;
            console.error("Validation failed", error);
            setMessages(prev => prev.filter(m => !m.isLoading));
            addMessage('bot', "There was an issue validating the description. Let's proceed for now.");
            setUserAnswers(prev => ({ ...prev, usecase_description: descriptionRef.current.trim() }));
            currentQuestionIndexRef.current += 1;
            askQuestion();
        }
    };

    const handleUserResponse = (response: string) => {
        setProcessingState('transitioning');
        setRestoredText(undefined);
        addMessage('user', response);

        if (processingStateRef.current === 'awaiting_confirmation') {
            if (response === 'Yes, proceed') {
                setUserAnswers(prev => ({ ...prev, usecase_description: descriptionRef.current.trim() }));
                currentQuestionIndexRef.current += 1;
                askQuestion();
            } else { // "No, refine"
                addMessage('bot', "My apologies. Please provide more details or correct my understanding.");
                setIsInClarificationLoop(true);
                setProcessingState('awaiting_user_input');
            }
            return;
        }

        const questionIndex = currentQuestionIndexRef.current;
        if (questionIndex >= TRIAGE_QUESTIONS.length) return;

        const currentQuestion = TRIAGE_QUESTIONS[questionIndex];

        if (currentQuestion.id === 'usecase_description' || isInClarificationLoop) {
            if (!isInClarificationLoop) {
                descriptionRef.current = response;
                setIsInClarificationLoop(true);
            } else {
                descriptionRef.current += `\n\nUser refinement: ${response}`;
            }
            validateFullDescription();
        } else if (currentQuestion.id === 'comparison_choice') {
            if (response.includes('"good" log')) {
                setLogUploadMode('compare_good');
            } else if (response.includes('another "bad" log')) {
                setLogUploadMode('compare_bad');
            } else {
                setLogUploadMode('single');
            }
            currentQuestionIndexRef.current += 1;
            askQuestion();
        } else { // Handle other multiple choice questions
            const newAnswers = { ...userAnswers, [currentQuestion.id]: response };
            setUserAnswers(newAnswers);
            currentQuestionIndexRef.current += 1;
            askQuestion();
        }
    };

    const handleFileUpload = useCallback(async (file: File) => {
        let logType: UploadedLog['type'] = 'bad1';
        if (logUploadMode === 'compare_good') {
            logType = uploadedLogs.length === 0 ? 'bad1' : 'good';
        } else if (logUploadMode === 'compare_bad') {
            logType = uploadedLogs.length === 0 ? 'bad1' : 'bad2';
        }

        addMessage('user', `Uploaded file: ${file.name} (as ${logType.replace('1', '').replace('2', '')} log)`);

        const newLog = { file, type: logType };
        const updatedLogs = [...uploadedLogs, newLog];
        setUploadedLogs(updatedLogs);

        const expectedLogCount = logUploadMode === 'single' ? 1 : 2;

        if (updatedLogs.length < expectedLogCount) {
            askQuestion();
        } else {
            setProcessingState('processing');
            addMessage('bot', 'Submitting logs for analysis...', undefined, false, undefined, true);

            try {
                const logsToTriage = await Promise.all(
                    updatedLogs.map(async (log) => ({
                        content: await log.file.text(),
                        type: log.type,
                    }))
                );

                const { taskId } = await performTriage(logsToTriage, userAnswers);
                triageTaskIdRef.current = taskId;

                const poll = async () => {
                    if (!triageTaskIdRef.current) return;
                    try {
                        const statusResult = await pollTriageStatus(triageTaskIdRef.current);

                        if (processingStateRef.current !== 'processing') return;

                        setMessages(prev => prev.map(m => m.isLoading ? { ...m, text: statusResult.message } : m));

                        if (statusResult.status === 'SUCCESS' && statusResult.result) {
                            setMessages(prev => prev.filter(m => !m.isLoading));
                            addMessage('bot', undefined, undefined, false, statusResult.result);
                            setProcessingState('complete');
                            if (pollingTimeoutIdRef.current) clearTimeout(pollingTimeoutIdRef.current);

                            // Switch to chat mode immediately
                            setCompletedResult(statusResult.result);
                            setCompletedTaskId(triageTaskIdRef.current);
                        } else if (statusResult.status === 'FAILED') {
                            setMessages(prev => prev.filter(m => !m.isLoading));
                            addMessage('bot', `Analysis failed: ${statusResult.message || 'Please try again.'}`);
                            setProcessingState('error');
                            if (pollingTimeoutIdRef.current) clearTimeout(pollingTimeoutIdRef.current);
                        } else {
                            pollingTimeoutIdRef.current = window.setTimeout(poll, POLLING_INTERVAL);
                        }
                    } catch (pollError) {
                        if (processingStateRef.current !== 'processing') return;
                        console.error('Polling error:', pollError);
                        addMessage('bot', 'An error occurred while checking the analysis status.');
                        setProcessingState('error');
                        if (pollingTimeoutIdRef.current) clearTimeout(pollingTimeoutIdRef.current);
                    }
                };
                pollingTimeoutIdRef.current = window.setTimeout(poll, POLLING_INTERVAL);

            } catch (error) {
                if (processingStateRef.current !== 'processing') return;
                console.error('Triage start error:', error);
                const message = error instanceof Error ? error.message : 'An unknown error occurred.';
                addMessage('bot', `Failed to start triage: ${message}`);
                setProcessingState('error');
            }
        }
    }, [userAnswers, askQuestion, logUploadMode, uploadedLogs]);

    const handleStop = () => {
        if (pollingTimeoutIdRef.current) {
            clearTimeout(pollingTimeoutIdRef.current);
            pollingTimeoutIdRef.current = null;
        }

        const currentProcessingState = processingStateRef.current;

        if (currentProcessingState === 'validating_description') {
            const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');

            let messageToRemoveId: string | null = null;
            if (lastUserMessage) {
                const lastQuestion = TRIAGE_QUESTIONS[currentQuestionIndexRef.current];
                if (lastQuestion?.id === 'usecase_description' || isInClarificationLoop) {
                    setRestoredText(lastUserMessage.text);
                    messageToRemoveId = lastUserMessage.id;
                }
            }

            setMessages(prev => prev.filter(m => !m.isLoading && m.id !== messageToRemoveId));
            setProcessingState('awaiting_user_input');

        } else if (currentProcessingState === 'processing') {
            if (triageTaskIdRef.current) {
                cancelTriage(triageTaskIdRef.current);
                triageTaskIdRef.current = null;
            }
            setMessages(prev => prev.filter(m => !m.isLoading));
            addMessage('bot', 'Analysis stopped by user.');
            setProcessingState('error');
        }
    };

    const handleReset = () => {
        if (pollingTimeoutIdRef.current) {
            clearTimeout(pollingTimeoutIdRef.current);
            pollingTimeoutIdRef.current = null;
        }
        setMessages([]);
        setUserAnswers({});
        currentQuestionIndexRef.current = 0;
        triageTaskIdRef.current = null;
        descriptionRef.current = '';
        setIsInClarificationLoop(false);
        setLogUploadMode('none');
        setUploadedLogs([]);
        setRestoredText(undefined);
        setProcessingState('idle');
    };

    const currentQuestion = TRIAGE_QUESTIONS[currentQuestionIndexRef.current];

    if (processingState === 'complete' && triageTaskIdRef.current && messages.find(m => m.result)?.result) {
        const result = messages.find(m => m.result)?.result;
        if (result) {
            return (
                <ChatDeepDive
                    taskId={triageTaskIdRef.current}
                    initialResult={result}
                    onReset={handleReset}
                />
            );
        }
    }

    // Otherwise render the normal triage flow
    return (
        <ChatInterface
            messages={messages}
            isBotTyping={isBotTyping}
            onUserResponse={handleUserResponse}
            onFileUpload={handleFileUpload}
            onReset={handleReset}
            onStop={handleStop}
            currentQuestion={currentQuestion}
            processingState={processingState}
            logUploadMode={logUploadMode}
            uploadedLogs={uploadedLogs}
            restoredText={restoredText}
        />
    );
}
