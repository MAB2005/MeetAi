import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { MeetAiLogo, Spinner } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';
import { generateFile } from '../utils/fileGenerator';

interface ChatMessageProps {
  message: Message;
  onEdit: (messageId: string, newText: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEdit }) => {
  const isUser = message.role === MessageRole.USER;
  const isSystem = message.role === MessageRole.SYSTEM;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State for file download
  const [downloadInfo, setDownloadInfo] = useState<{format: string, filename: string, content: string} | null>(null);
  const [displayContent, setDisplayContent] = useState(message.text);

  useEffect(() => {
    // Check for Export Tag in the message text
    // Regex: [[EXPORT:FORMAT:FILENAME]]
    // We look at the END of the message.
    
    const exportRegex = /\[\[EXPORT:(PDF|DOCX|PPTX|TXT):(.*?)\]\]$/;
    const match = message.text.match(exportRegex);

    if (match) {
      const fullTag = match[0];
      const format = match[1];
      const filename = match[2];
      
      // Remove the tag from the displayed text
      const cleanContent = message.text.replace(fullTag, '').trim();
      
      setDisplayContent(cleanContent);
      setDownloadInfo({
        format,
        filename,
        content: cleanContent
      });
    } else {
      setDisplayContent(message.text);
      setDownloadInfo(null);
    }
  }, [message.text]);

  useEffect(() => {
    // Stop speaking if component unmounts
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Cancel any existing speech first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(displayContent);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      // Attempt to pick a decent voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() !== message.text) {
      onEdit(message.id, editText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isSystem) return null;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
              U
            </div>
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center shadow-lg overflow-hidden p-1">
               <MeetAiLogo className="w-full h-full" />
            </div>
          )}
        </div>

        {/* Bubble */}
        <div className="flex flex-col items-start gap-1 w-full min-w-0">
          <div 
            className={`relative px-5 py-3 rounded-2xl shadow-md w-full ${
              isUser 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none'
            }`}
          >
            {/* Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="bg-black/30 rounded p-2 text-xs flex items-center gap-2 border border-white/10">
                    <span className="uppercase font-bold text-blue-300">{att.mimeType.split('/')[1]}</span>
                    <span className="truncate max-w-[150px]">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Content Area */}
            {isEditing ? (
              <div className="w-full">
                <textarea
                  ref={textareaRef}
                  value={editText}
                  onChange={(e) => {
                    setEditText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white/10 text-white rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                  rows={1}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    onClick={handleCancelEdit}
                    className="text-xs px-3 py-1 bg-black/20 hover:bg-black/30 rounded text-white/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="text-xs px-3 py-1 bg-white text-blue-600 font-bold rounded hover:bg-gray-100 transition-colors"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.isThinking && !displayContent ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Spinner />
                    <span className="text-sm animate-pulse">Analyzing...</span>
                  </div>
                ) : (
                  <MarkdownRenderer content={displayContent} />
                )}

                {/* File Download Card */}
                {downloadInfo && (
                  <div className="mt-4 p-3 bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs uppercase border border-blue-500/30">
                          {downloadInfo.format}
                       </div>
                       <div className="min-w-0">
                         <div className="text-sm font-semibold text-gray-200 truncate max-w-[150px] sm:max-w-xs">{downloadInfo.filename}</div>
                         <div className="text-xs text-gray-400">Ready to download</div>
                       </div>
                    </div>
                    <button 
                      onClick={() => generateFile(downloadInfo.format, downloadInfo.filename, downloadInfo.content)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3.3-3.3m0 0l-3.3 3.3m3.3-3.3v7.5M12 21h0" />
                      </svg>
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* Timestamp */}
            <div className={`text-[10px] mt-1 opacity-50 text-right`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center gap-1 mt-1 ${isUser ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
            {/* Read Aloud (Model only) */}
            {!isUser && !message.isThinking && (
              <button 
                onClick={toggleSpeech}
                className={`p-1.5 rounded-full transition-colors ${isSpeaking ? 'bg-blue-600 text-white animate-pulse' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                title={isSpeaking ? "Stop reading" : "Read aloud"}
              >
                {isSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                  </svg>
                )}
              </button>
            )}

            {/* Edit Button (User only) */}
            {isUser && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Edit message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;