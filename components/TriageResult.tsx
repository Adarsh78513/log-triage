import React from 'react';
import type { TriageResult } from '../types';

interface TriageResultDisplayProps {
    result: TriageResult;
}

const ResultSection: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
    <div className="bg-gradient-to-r from-gray-50 to-white p-5 my-3 rounded-xl shadow-sm border border-gray-100">
        <h3 className={`text-base font-bold ${color} mb-3 flex items-center gap-2`}>
            <span className="w-1.5 h-6 rounded-full bg-current"></span>
            {title}
        </h3>
        {children}
    </div>
);


export const TriageResultDisplay: React.FC<TriageResultDisplayProps> = ({ result }) => {
    return (
        <div className="space-y-2 animate-fade-in text-left">
            <p className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">✓</span>
                Triage Analysis Complete
            </p>

            <ResultSection title="Executive Summary" color="text-indigo-600">
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{result.summary}</p>
            </ResultSection>

            <ResultSection title="Potential Issues Identified" color="text-red-600">
                {result.potentialIssues.length > 0 ? (
                    <ul className="space-y-2 text-gray-700 text-sm">
                        {result.potentialIssues.map((issue, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{issue}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm italic">No specific issues were automatically identified.</p>
                )}
            </ResultSection>

            <ResultSection title="Suggested Actions" color="text-emerald-600">
                {result.suggestedActions.length > 0 ? (
                    <ol className="space-y-3 text-gray-700 text-sm">
                        {result.suggestedActions.map((action, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </span>
                                <span className="flex-1 pt-0.5">{action}</span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-gray-500 text-sm italic">No specific actions were suggested.</p>
                )}
            </ResultSection>
        </div>
    );
};