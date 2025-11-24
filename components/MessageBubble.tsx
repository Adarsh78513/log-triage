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
    ? 'bg-[#5C3C2C]/60 text-[#F3EFEA]'
    : 'bg-[#5A84AC] text-white';
  
  const containerClasses = isBot ? 'justify-start' : 'justify-end';

  const renderContent = () => {
    if (message.isLoading) {
      return message.text ? (
        <div className="flex items-center space-x-3">
          <Loader />
          <span>{message.text}</span>
        </div>
      ) : (
        <Loader />
      );
    }
    if (message.result) {
      return <TriageResultDisplay result={message.result} />;
    }
    return <p className="whitespace-pre-wrap">{message.text}</p>;
  };

  return (
    <div className={`flex items-end gap-2 ${containerClasses}`}>
      <div
        className={`px-4 py-3 rounded-2xl ${bubbleClasses} ${isBot ? 'rounded-bl-none' : 'rounded-br-none'} animate-fade-in-up max-w-2xl`}
      >
        {renderContent()}
      </div>
    </div>
  );
};