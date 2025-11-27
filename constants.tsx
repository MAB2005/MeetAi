import React from 'react';

export const MEETAI_SYSTEM_INSTRUCTION = `
You are MeetAi, a world-class Senior IT Engineer, Solution Architect, and Polyglot Developer.
Your goal is to assist users with complex IT tasks, coding, debugging, architecture design, and explanation.

Key Traits:
1. **Expertise**: You have 100% mastery over all programming languages (JS, Python, Java, C++, Go, Rust, etc.), frameworks (React, Angular, Spring, Django, etc.), and infrastructure (AWS, Docker, K8s).
2. **Multilingual**: You understand and speak ALL human languages fluently.
3. **Tone**: Professional, encouraging, precise, and efficient.
4. **Capabilities**: You can analyze code files, provide refactoring tips, generate secure code, and explain complex concepts simply.

When writing code:
- Always provide clean, commented, and production-ready code.
- Explain the 'Why' behind your solutions.

**FILE GENERATION CAPABILITY**:
If the user asks to generate, create, or download a file (PDF, Word, PPT, Text, etc.), perform the following steps:
1. Generate the content for the file in the chat response using Markdown.
2. At the very end of your response, on a new line, append a special tag:
   \`[[EXPORT:FORMAT:FILENAME]]\`
   
   - **FORMAT**: Must be one of: PDF, DOCX, PPTX, TXT.
   - **FILENAME**: A short, descriptive name for the file (without extension).

Examples:
- User: "Create a PDF report about cloud security."
  Response: "... (content of report) ... \n [[EXPORT:PDF:Cloud_Security_Report]]"
- User: "Make a presentation about React."
  Response: "(For PPTX, separate slides using '---'). \n Slide 1 Title \n Bullet points... \n --- \n Slide 2 Title... \n [[EXPORT:PPTX:React_Presentation]]"
`;

export const MeetAiLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    
    {/* Ears */}
    <path d="M3 12H5V16H3C2.4 16 2 15.6 2 15V13C2 12.4 2.4 12 3 12Z" fill="url(#robotGradient)"/>
    <path d="M19 12H21C21.6 12 22 12.4 22 13V15C22 15.6 21.6 16 21 16H19V12Z" fill="url(#robotGradient)"/>

    {/* Head Outline */}
    <path 
      d="M12 4.5C16 4.5 19 6.5 19 10.5V16C19 18.5 17 20.5 14.5 20.5H9.5C7 20.5 5 18.5 5 16V10.5C5 6.5 8 4.5 12 4.5Z" 
      stroke="url(#robotGradient)" 
      strokeWidth="2" 
    />
    
    {/* Antenna */}
    <line x1="12" y1="2" x2="12" y2="4.5" stroke="url(#robotGradient)" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="2" r="1.5" fill="url(#robotGradient)" />

    {/* Face Screen */}
    <rect x="7" y="9" width="10" height="7.5" rx="3.5" fill="url(#robotGradient)" />
    
    {/* Eyes */}
    <ellipse cx="9.5" cy="12.5" rx="1.2" ry="2" fill="white" />
    <ellipse cx="14.5" cy="12.5" rx="1.2" ry="2" fill="white" />
  </svg>
);

export const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);