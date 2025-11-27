import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';
import { fileToGenerativePart } from '../services/geminiService';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const attachment = await fileToGenerativePart(file);
          newAttachments.push(attachment);
        } catch (error) {
          console.error("Failed to process file", error);
        }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; 

    const initialText = text;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      const spacer = (initialText && !initialText.endsWith(' ') && initialText.length > 0) ? ' ' : '';
      setText(initialText + spacer + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="w-full bg-gray-900 border-t border-gray-800 p-2 md:p-4 sticky bottom-0 z-20 safe-area-bottom">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group bg-gray-800 border border-gray-700 rounded-lg p-2 min-w-[120px] flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-900/50 rounded flex items-center justify-center text-xs text-blue-300 font-bold uppercase">
                  {att.mimeType.split('/')[1].substring(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{att.name}</p>
                </div>
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className={`relative flex items-end gap-2 bg-gray-800 border rounded-xl p-2 shadow-lg transition-all ${isListening ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-gray-700 focus-within:ring-2 focus-within:ring-blue-600'}`}>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Attach file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          </button>

          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2 transition-all rounded-full ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-gray-400 hover:text-white'}`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple
          />

          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Message MeetAi..."}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 resize-none max-h-32 py-2 focus:outline-none text-base"
            rows={1}
            style={{ minHeight: '44px' }}
          />

          <button 
            onClick={() => handleSubmit()}
            disabled={(!text.trim() && attachments.length === 0) || isLoading}
            className={`p-2 rounded-lg transition-all ${
              (!text.trim() && attachments.length === 0) || isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
            }`}
          >
            {isLoading ? (
               <div className="w-6 h-6 flex items-center justify-center">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
