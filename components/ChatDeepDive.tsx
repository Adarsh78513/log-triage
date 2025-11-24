import React, { useState, useRef, useEffect } from 'react';
import { TriageResultDisplay } from './TriageResult';
import { ChatInterface } from './ChatInterface';
import { chatWithReport, ChatMessageModel } from '../services/backendClient';
import type { TriageResult, ChatMessage } from '../types';

interface ChatDeepDiveProps {
    taskId: string;
    initialResult: TriageResult;
    onReset: () => void;
}

export const ChatDeepDive: React.FC<ChatDeepDiveProps> = ({ taskId, initialResult, onReset }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isBotTyping, setIsBotTyping] = useState(false);


    // Convert internal messages to API model
    const getHistoryModel = (): ChatMessageModel[] => {
        return messages
            .filter(m => !m.isLoading && !m.result) // Exclude loading and system messages
            .map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text || ''
            }));
    };

    const handleUserResponse = async (text: string) => {
        // Add user message
        const userMsg: ChatMessage = {
            id: `msg_${Date.now()}_user`,
            sender: 'user',
            text
        };
        setMessages(prev => [...prev, userMsg]);

        // Show typing indicator
        setIsBotTyping(true);

        try {
            // Get history including the new message
            const history = getHistoryModel();

            // Call API
            const result = await chatWithReport(taskId, text, history);

            // Add bot response
            const botMsg: ChatMessage = {
                id: `msg_${Date.now()}_bot`,
                sender: 'bot',
                text: result.response
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat failed:", error);
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}_error`,
                sender: 'bot',
                text: "I'm sorry, I encountered an error while processing your request. Please try again."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsBotTyping(false);
        }
    };

    // Initial greeting
    useEffect(() => {
        const greeting: ChatMessage = {
            id: 'init_greeting',
            sender: 'bot',
            text: "I've analyzed your logs. You can review the report above. Feel free to ask me any questions about the findings or the logs!"
        };
        setMessages([greeting]);
    }, []);

    return (
        <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-50">
            {/* Left Side - Triage Report */}
            <div className="w-full md:w-2/5 border-r border-gray-200 bg-white overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Triage Report</h2>
                        <button
                            onClick={onReset}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-full hover:bg-indigo-50 transition-colors"
                        >
                            New Triage
                        </button>
                    </div>
                    <TriageResultDisplay result={initialResult} />
                </div>
            </div>

            {/* Right Side - Chat Interface */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-lg font-semibold text-gray-800">Chat Deep Dive</h2>
                    <p className="text-sm text-gray-500">Ask questions about the report or logs</p>
                </div>

                <div className="flex-grow overflow-hidden relative">
                    <ChatInterface
                        messages={messages}
                        isBotTyping={isBotTyping}
                        onUserResponse={handleUserResponse}
                        onFileUpload={() => { }} // No uploads in deep dive
                        onReset={onReset}
                        onStop={() => { }} // No stop needed for chat
                        currentQuestion={undefined} // No structured questions
                        processingState="deep_dive"
                        logUploadMode="none"
                        uploadedLogs={[]}
                    />
                </div>
            </div>
        </div>
    );
};
