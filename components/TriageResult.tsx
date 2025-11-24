import React from 'react';
import type { TriageResult } from '../types';

interface TriageResultDisplayProps {
  result: TriageResult;
}

const ResultSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/40 p-3 my-2 rounded-lg">
        <h3 className="text-md font-semibold text-[#FC9C44] mb-2 border-b border-[#742F14] pb-1">{title}</h3>
        {children}
    </div>
);


export const TriageResultDisplay: React.FC<TriageResultDisplayProps> = ({ result }) => {
  return (
    <div className="space-y-3 animate-fade-in text-left">
        <p className="font-semibold text-lg text-[#5C3C2C] mb-3">Triage Analysis Complete</p>
        
        <ResultSection title="Executive Summary">
            <p className="text-[#5C3C2C]/90 whitespace-pre-wrap text-sm">{result.summary}</p>
        </ResultSection>
        
        <ResultSection title="Potential Issues Identified">
            {result.potentialIssues.length > 0 ? (
                <ul className="space-y-2 list-disc list-inside text-[#5C3C2C]/90 text-sm">
                    {result.potentialIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-[#5C3C2C]/70 text-sm">No specific issues were automatically identified.</p>
            )}
        </ResultSection>

        <ResultSection title="Suggested Actions">
            {result.suggestedActions.length > 0 ? (
                <ol className="space-y-2 list-decimal list-inside text-[#5C3C2C]/90 text-sm">
                    {result.suggestedActions.map((action, index) => (
                        <li key={index}><span className="font-semibold text-[#742F14]">{action.split(':')[0]}:</span> {action.split(':').slice(1).join(':')}</li>
                    ))}
                </ol>
             ) : (
                <p className="text-[#5C3C2C]/70 text-sm">No specific actions were suggested.</p>
            )}
        </ResultSection>
    </div>
  );
};