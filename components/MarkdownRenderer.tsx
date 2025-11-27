import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator.clipboard) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400 lowercase">{language || 'code'}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-gray-300">
          {code}
        </pre>
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple custom parser to handle code blocks and basic formatting
  // Splitting by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-sm md:text-base leading-relaxed space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // It's a code block
          const lines = part.split('\n');
          const language = lines[0].replace('```', '').trim();
          const code = lines.slice(1, -1).join('\n');
          
          return <CodeBlock key={index} language={language} code={code} />;
        } else {
          // Regular text, handle bolding and newlines
          // Simple bold parser: **text**
          return (
             <div key={index} className="whitespace-pre-wrap">
               {part.split(/(\*\*.*?\*\*)/g).map((subPart, i) => {
                 if (subPart.startsWith('**') && subPart.endsWith('**')) {
                   return <strong key={i} className="text-white font-semibold">{subPart.slice(2, -2)}</strong>;
                 }
                 return <span key={i}>{subPart}</span>;
               })}
             </div>
          );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;