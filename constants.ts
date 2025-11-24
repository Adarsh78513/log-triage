import type { Question } from './types';

export const TRIAGE_QUESTIONS: Question[] = [
  {
    id: 'tech_area',
    text: 'First, which technical area does this issue belong to?',
    type: 'multiple-choice',
    options: ['Frontend', 'Backend', 'Database', 'Infrastructure/DevOps'],
  },
  {
    id: 'environment',
    text: 'In which environment did the issue occur?',
    type: 'multiple-choice',
    options: ['Local Development', 'Staging/QA', 'Production', 'Other'],
  },
  {
    id: 'impact',
    text: 'What is the impact of this issue?',
    type: 'multiple-choice',
    options: ['Single User', 'Multiple Users', 'System Wide Outage', 'Performance Degradation'],
  },
  {
    id: 'usecase_description',
    text: 'Please describe what you were doing, what you observed, and what you expected to happen.',
    type: 'textarea',
    placeholder: 'e.g., I was trying to update a user profile. I clicked the "Save" button, but I saw a "500 Internal Server Error" message. I expected to see a success confirmation message.'
  },
  {
    id: 'comparison_choice',
    text: 'To help with the analysis, would you like to compare the logs from the incident with another log file?',
    type: 'multiple-choice',
    options: [
        'Yes, I have a "good" log file to compare against.', 
        'Yes, I have another "bad" log file to compare.', 
        'No, I only have one log file.'
    ],
  }
];