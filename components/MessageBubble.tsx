import React from 'react';
import type { ChatMessage } from '../types';
import { Loader } from './Loader';
import { TriageResultDisplay } from './TriageResult';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.sender === 'bot';

  const bubbleClasses = isBot
    ? 'bg-white text-gray-800 shadow-md border border-gray-100'
    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg';

  const containerClasses = isBot ? 'justify-start' : 'justify-end';

  const renderContent = () => {
    if (message.isLoading) {
      return message.text ? (
        <div className="flex items-center space-x-3">
          <Loader />
          <span className="text-sm">{message.text}</span>
        </div>
      ) : (
        <Loader />
      );
    }
    if (message.result) {
      return <TriageResultDisplay result={message.result} />;
    }
    return <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>;
  };

  return (
    <div className={`flex items-end gap-2 ${containerClasses} animate-fade-in-up`}>
      <div
        className={`px-5 py-3 rounded-2xl ${bubbleClasses} ${isBot ? 'rounded-bl-sm' : 'rounded-br-sm'} max-w-2xl transition-all duration-200 hover:shadow-xl`}
      >
        {renderContent()}
      </div>
    </div>
  );
};