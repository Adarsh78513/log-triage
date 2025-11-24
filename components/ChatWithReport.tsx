import React, { useState, useRef, useEffect } from 'react';
import type { TriageResult, ChatMessageType } from '../types';
import { chatAboutReport } from '../services/backendClient';

interface ChatWithReportProps {
    result: TriageResult;
    taskId: string;
}

export function ChatWithReport({ result, taskId }: ChatWithReportProps) {
    const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [currentMessage]);

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        const userMessage = currentMessage.trim();
        setCurrentMessage('');

        // Add user message to chat
        const newUserMessage: ChatMessageType = {
            role: 'user',
            content: userMessage
        };
        setChatHistory(prev => [...prev, newUserMessage]);

        // Call API
        setIsLoading(true);
        try {
            const response = await chatAboutReport(taskId, userMessage, chatHistory);

            const assistantMessage: ChatMessageType = {
                role: 'assistant',
                content: response.response
            };
            setChatHistory(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessageType = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex h-full bg-gradient-to-b from-[#F5F1E8] to-[#FAF8F3]">
            {/* Left Side - Triage Report */}
            <div className="w-2/5 border-r border-[#5C3C2C]/10 bg-white/40 backdrop-blur-sm overflow-y-auto">
                <div className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-[#5A84AC] mb-4">Triage Report</h2>

                    <div className="space-y-6">
                        <div className="bg-white/60 rounded-lg p-4 border border-[#5C3C2C]/10">
                            <h3 className="font-semibold text-[#5C3C2C] mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Summary
                            </h3>
                            <p className="text-sm text-[#5C3C2C]/80 leading-relaxed">{result.summary}</p>
                        </div>

                        <div className="bg-white/60 rounded-lg p-4 border border-[#5C3C2C]/10">
                            <h3 className="font-semibold text-[#5C3C2C] mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Potential Issues
                            </h3>
                            <ul className="space-y-2">
                                {result.potentialIssues.map((issue, idx) => (
                                    <li key={idx} className="flex gap-2 text-sm text-[#5C3C2C]/80">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="flex-1">{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/60 rounded-lg p-4 border border-[#5C3C2C]/10">
                            <h3 className="font-semibold text-[#5C3C2C] mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Suggested Actions
                            </h3>
                            <ol className="space-y-2">
                                {result.suggestedActions.map((action, idx) => (
                                    <li key={idx} className="flex gap-2 text-sm text-[#5C3C2C]/80">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="flex-1">{action}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Chat Interface */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-[#5C3C2C]/10 bg-white/40 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-[#5A84AC]">Ask Questions About the Report</h2>
                    <p className="text-sm text-[#5C3C2C]/60 mt-1">I can help you understand the logs and suggested actions in detail</p>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {chatHistory.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-[#5C3C2C]/60 text-sm mb-4">
                                Ask me anything about the triage report or the logs!
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <button
                                    onClick={() => setCurrentMessage("Can you explain the first issue in more detail?")}
                                    className="px-3 py-1.5 text-xs rounded-full bg-white/60 hover:bg-white/80 text-[#5C3C2C] border border-[#5C3C2C]/10 transition-colors"
                                >
                                    Explain first issue
                                </button>
                                <button
                                    onClick={() => setCurrentMessage("What should I prioritize?")}
                                    className="px-3 py-1.5 text-xs rounded-full bg-white/60 hover:bg-white/80 text-[#5C3C2C] border border-[#5C3C2C]/10 transition-colors"
                                >
                                    What to prioritize?
                                </button>
                                <button
                                    onClick={() => setCurrentMessage("Show me the relevant log entries")}
                                    className="px-3 py-1.5 text-xs rounded-full bg-white/60 hover:bg-white/80 text-[#5C3C2C] border border-[#5C3C2C]/10 transition-colors"
                                >
                                    Show log entries
                                </button>
                            </div>
                        </div>
                    )}

                    {chatHistory.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-[#5A84AC] text-white'
                                    : 'bg-white/60 text-[#5C3C2C] border border-[#5C3C2C]/10'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white/60 border border-[#5C3C2C]/10">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-[#5C3C2C]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#5C3C2C]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#5C3C2C]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input Section */}
                <div className="flex-shrink-0 border-t border-[#5C3C2C]/10 bg-white/40 backdrop-blur-sm p-4">
                    <div className="flex gap-3 items-end">
                        <textarea
                            ref={textareaRef}
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about the report or logs..."
                            className="flex-1 px-4 py-3 rounded-xl border border-[#5C3C2C]/20 focus:border-[#5A84AC] focus:outline-none focus:ring-2 focus:ring-[#5A84AC]/20 bg-white/80 text-[#5C3C2C] placeholder-[#5C3C2C]/40 resize-none min-h-[48px] max-h-[120px]"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim() || isLoading}
                            className="px-6 py-3 rounded-xl bg-[#5A84AC] text-white font-medium hover:bg-[#4A7098] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-xs text-[#5C3C2C]/40 mt-2">Press Enter to send, Shift+Enter for new line</p>
                </div>
            </div>
        </div>
    );
}
