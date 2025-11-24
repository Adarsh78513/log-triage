import React, { useState } from 'react';
import { ChatPage } from './components/ChatPage';
import { RAGUploadPage } from './components/RAGUploadPage';
import { DocumentIcon } from './components/icons/DocumentIcon';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';

export default function App() {
  const [page, setPage] = useState<'chat' | 'rag'>('chat');

  const headerTitle = "AI Log Triage Assistant";
  const headerSubtitle = page === 'chat'
    ? "Guided issue analysis powered by Gemini."
    : "Manage Knowledge Documents for RAG";

  return (
    <div className="h-screen flex flex-col font-sans">
      <header className="text-center p-4 flex-shrink-0 relative border-b border-[#5C3C2C]/10 bg-white/20">
        <div className="absolute top-0 left-0 h-full flex items-center px-4">
          {page === 'chat' ? (
            <button
              onClick={() => setPage('rag')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#5C3C2C]/10 transition-colors text-sm font-medium text-[#5C3C2C]"
              aria-label="Manage Documents"
              title="Manage Documents"
            >
              <DocumentIcon className="w-5 h-5" />
              <span>Manage Documents</span>
            </button>
          ) : (
            <button
              onClick={() => setPage('chat')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#5C3C2C]/10 transition-colors text-sm font-medium text-[#5C3C2C]"
              aria-label="Back to Chat"
              title="Back to Chat"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span>Back to Chat</span>
            </button>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#5A84AC] mb-2">
          {headerTitle}
        </h1>
        <p className="text-[#5C3C2C]/80 text-sm">
          {headerSubtitle}
        </p>
      </header>
      <main className="flex-grow flex flex-col overflow-hidden">
        {page === 'chat' ? <ChatPage /> : <RAGUploadPage />}
      </main>
    </div>
  );
}