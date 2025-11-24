import React, { useState, useRef, useEffect } from 'react';
import type { Question, LogUploadMode, UploadedLog, ProcessingState } from '../types';
import { SendIcon } from './icons/SendIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ChatInputProps {
  onUserResponse: (response: string) => void;
  onFileUpload: (file: File) => void;
  onReset: () => void;
  onStop: () => void;
  currentQuestion?: Question;
  processingState: ProcessingState;
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
          className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl font-semibold transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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
            className="w-full sm:w-auto flex-grow px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl font-semibold transition-all duration-200 text-white shadow-md hover:shadow-lg"
          >
            Yes, proceed
          </button>
          <button
            onClick={() => onUserResponse('No, refine')}
            className="w-full sm:w-auto flex-grow px-6 py-3 bg-white hover:bg-gray-50 border-2 border-indigo-500 text-indigo-600 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            No, I need to refine this
          </button>
        </div>
      );
    }

    if (processingState === 'processing' || processingState === 'validating_description') {
      return (
        <div className="flex items-center justify-center gap-4">
          <p className="text-center text-gray-600 text-sm font-medium">Please wait while the analysis is in progress...</p>
          <button
            onClick={onStop}
            className="px-4 py-2 border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-all duration-200 text-sm shadow-sm"
          >
            Stop
          </button>
        </div>
      );
    }

    // This is the key state. Only show inputs if we are awaiting user input or in deep dive.
    if (processingState === 'awaiting_user_input' || processingState === 'deep_dive') {
      // Check for multiple-choice questions (only if not deep dive)
      if (currentQuestion?.options && processingState !== 'deep_dive') {
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentQuestion.options.map(option => (
              <button
                key={option}
                onClick={() => onUserResponse(option)}
                className="w-full text-center p-3 bg-white hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-500 rounded-xl transition-all duration-200 font-medium text-gray-700 hover:text-indigo-600 shadow-sm hover:shadow-md"
              >
                {option}
              </button>
            ))}
          </div>
        );
      }

      // Check for text area questions or deep dive chat
      if (currentQuestion?.type === 'textarea' || processingState === 'deep_dive') {
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
              placeholder={currentQuestion?.placeholder || 'Type your message...'}
              className="w-full flex-grow p-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none shadow-sm"
              rows={1}
              autoFocus
            />
            <button type="submit" disabled={!text.trim()} className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed">
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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