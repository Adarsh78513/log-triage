import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
    </div>
  );
};
