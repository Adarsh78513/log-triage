import React, { useEffect, useRef } from 'react';
import type { ChatMessage, Question, LogUploadMode, UploadedLog } from '../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isBotTyping: boolean;
  onUserResponse: (response: string) => void;
  onFileUpload: (file: File) => void;
  onReset: () => void;
  onStop: () => void;
  currentQuestion?: Question;
  processingState: 'idle' | 'awaiting_user_input' | 'validating_description' | 'awaiting_confirmation' | 'processing' | 'complete' | 'error' | 'transitioning';
  logUploadMode: LogUploadMode;
  uploadedLogs: UploadedLog[];
  restoredText?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isBotTyping,
  onUserResponse,
  onFileUpload,
  onReset,
  onStop,
  currentQuestion,
  processingState,
  logUploadMode,
  uploadedLogs,
  restoredText,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isBotTyping && <MessageBubble message={{ id: 'typing', sender: 'bot', isLoading: true }} />}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 p-6 border-t border-gray-100 bg-gray-50/50">
        <ChatInput
          onUserResponse={onUserResponse}
          onFileUpload={onFileUpload}
          onReset={onReset}
          onStop={onStop}
          currentQuestion={currentQuestion}
          processingState={processingState}
          logUploadMode={logUploadMode}
          uploadedLogs={uploadedLogs}
          restoredText={restoredText}
        />
      </div>
    </div>
  );
};