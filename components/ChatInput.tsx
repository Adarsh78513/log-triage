import React, { useState, useRef, useEffect } from 'react';
import type { Question, LogUploadMode, UploadedLog } from '../types';
import { SendIcon } from './icons/SendIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ChatInputProps {
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

export const ChatInput: React.FC<ChatInputProps> = ({
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
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (restoredText !== undefined) {
      setText(restoredText);
    }
  }, [restoredText]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onUserResponse(text.trim());
      setText('');
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileUpload(event.target.files[0]);
    }
  };

  const renderInput = () => {
    // States that show a specific UI regardless of question type
    if (processingState === 'complete' || processingState === 'error') {
      return (
        <button
          onClick={onReset}
          className="w-full px-6 py-2 bg-[#5A84AC] hover:bg-[#4e769b] rounded-md font-semibold transition-colors text-white"
        >
          Start New Triage
        </button>
      );
    }

    if (processingState === 'awaiting_confirmation') {
      return (
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => onUserResponse('Yes, proceed')}
            className="w-full sm:w-auto flex-grow px-6 py-2 bg-[#5A84AC] hover:bg-[#4e769b] rounded-md font-semibold transition-colors text-white"
          >
            Yes, proceed
          </button>
          <button
            onClick={() => onUserResponse('No, refine')}
            className="w-full sm:w-auto flex-grow px-6 py-2 bg-[#FC9C44] hover:bg-[#e68b3d] rounded-md font-semibold transition-colors text-[#5C3C2C]"
          >
            No, I need to refine this
          </button>
        </div>
      );
    }

    if (processingState === 'processing' || processingState === 'validating_description') {
      return (
        <div className="flex items-center justify-center gap-4">
          <p className="text-center text-[#5C3C2C]/80 text-sm">Please wait while the analysis is in progress...</p>
          <button
            onClick={onStop}
            className="px-4 py-1 border border-[#742F14] text-[#742F14] hover:bg-[#FC9C44]/20 rounded-md font-semibold transition-colors text-sm"
          >
            Stop
          </button>
        </div>
      );
    }

    // This is the key state. Only show inputs if we are awaiting user input.
    if (processingState === 'awaiting_user_input') {
      // Check for multiple-choice questions
      if (currentQuestion?.options) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentQuestion.options.map(option => (
              <button
                key={option}
                onClick={() => onUserResponse(option)}
                className="w-full text-center p-2 bg-[#5C3C2C]/10 hover:bg-[#FC9C44]/20 border border-[#742F14]/40 hover:border-[#FC9C44] rounded-lg transition-all duration-300"
              >
                {option}
              </button>
            ))}
          </div>
        );
      }
      
      // Check for text area questions
      if (currentQuestion?.type === 'textarea') {
        return (
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit(e);
                  }
              }}
              placeholder={currentQuestion?.placeholder || 'Type your response...'}
              className="w-full flex-grow p-2 bg-white/50 border border-[#742F14]/50 rounded-lg text-[#5C3C2C] placeholder:text-[#5C3C2C]/60 focus:outline-none focus:ring-1 focus:ring-[#5A84AC] transition-colors resize-none"
              rows={2}
              autoFocus
            />
            <button type="submit" disabled={!text.trim()} className="p-2 bg-[#5A84AC] rounded-full text-white hover:bg-[#4e769b] disabled:bg-gray-600 transition-colors">
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
        );
      }
      
      // Check for file upload phase (after all questions are answered)
      if (!currentQuestion) {
          let uploadButtonText = 'Upload Log File';
          if (logUploadMode === 'compare_good') {
              uploadButtonText = uploadedLogs.length === 0 ? "Upload 'Bad' Log" : "Upload 'Good' Log";
          } else if (logUploadMode === 'compare_bad') {
              uploadButtonText = uploadedLogs.length === 0 ? "Upload First 'Bad' Log" : "Upload Second 'Bad' Log";
          }
  
          return (
               <>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".log, .txt, text/plain"
                  />
                  <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-[#FC9C44] hover:bg-[#e68b3d] text-[#5C3C2C] rounded-md font-semibold transition-colors"
                  >
                      <UploadIcon className="w-5 h-5" />
                      {uploadButtonText}
                  </button>
              </>
          )
      }
    }

    return null;
  };

  return <div className="w-full px-4 sm:px-6">{renderInput()}</div>;
};