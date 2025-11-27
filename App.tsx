import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { Message, MessageRole, Attachment, ChatSession } from './types';
import { streamMessageToGemini } from './services/geminiService';
import { MeetAiLogo } from './constants';

const STORAGE_KEY = 'meetai_sessions';
const USER_KEY = 'meetai_username';

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to track the current streaming operation to prevent race conditions or state closures
  const isStreamingRef = useRef(false);

  // Initialize from LocalStorage
  useEffect(() => {
    // Load Sessions
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        // Hydrate timestamps back to Date objects
        const hydrated = parsed.map(s => ({
          ...s,
          messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(hydrated);
        
        if (hydrated.length > 0) {
          setCurrentSessionId(hydrated[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }

    // Load User Profile
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setUserName(savedUser);
    }
  }, []);

  // Save Sessions to LocalStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save User to LocalStorage
  const updateUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem(USER_KEY, name);
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isLoading]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    return newId;
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    // If we deleted the current session, switch to another one
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        // If we deleted the last one, create a new one immediately
        const emptyId = Date.now().toString();
        setSessions([{ id: emptyId, title: 'New Chat', messages: [], createdAt: Date.now() }]);
        setCurrentSessionId(emptyId);
      }
    }
    
    // Update local storage explicitly if array is empty
    if (newSessions.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Helper function to handle the actual generation and streaming process
  const processAIResponse = async (activeSessionId: string, history: Message[]) => {
    setIsLoading(true);
    isStreamingRef.current = true;

    // Create the AI placeholder message
    const thinkingMsgId = (Date.now() + 1).toString();
    const thinkingMsg: Message = {
      id: thinkingMsgId,
      role: MessageRole.MODEL,
      text: '',
      timestamp: new Date(),
      isThinking: true
    };

    // Add thinking message to state
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, thinkingMsg] } : s));

    try {
      const stream = streamMessageToGemini(history, "", []);
      let fullText = "";

      for await (const chunk of stream) {
        if (!isStreamingRef.current) break; // Stop if user navigates away or stops
        fullText += chunk;
        
        // Update the specific message in state with the new chunk
        setSessions(prev => prev.map(session => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              messages: session.messages.map(msg => 
                msg.id === thinkingMsgId 
                  ? { ...msg, text: fullText, isThinking: false } 
                  : msg
              )
            };
          }
          return session;
        }));
      }

    } catch (error) {
       console.error("Stream error", error);
       setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            messages: session.messages.map(msg => 
              msg.id === thinkingMsgId 
                ? { ...msg, text: "Sorry, I encountered an error. Please try again.", isThinking: false } 
                : msg
            )
          };
        }
        return session;
      }));
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!currentSessionId) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text,
      attachments,
      timestamp: new Date()
    };
    
    let updatedHistory: Message[] = [];

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Generate title if it's the first message
        const newTitle = session.messages.length === 0 
          ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) 
          : session.title;
          
        const newMessages = [...session.messages, userMsg];
        updatedHistory = newMessages; // Capture for the API call
        
        return {
          ...session,
          title: newTitle,
          messages: newMessages
        };
      }
      return session;
    }));

    // 2. Trigger AI Response
    await processAIResponse(currentSessionId, updatedHistory);
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!currentSessionId || isLoading) return;

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    const msgIndex = currentSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // Truncate history: keep messages up to the one being edited
    // We remove the edited message and everything after it, then push the NEW version of it.
    const truncatedMessages = currentSession.messages.slice(0, msgIndex);
    
    // Create updated user message (keep ID or new ID? keeping ID is better for react keys but new ID implies new event. Let's keep metadata but update content)
    const oldMsg = currentSession.messages[msgIndex];
    const updatedMsg: Message = {
      ...oldMsg,
      text: newText,
      timestamp: new Date() // Update timestamp to now
    };

    const newHistory = [...truncatedMessages, updatedMsg];

    // Update State
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: newHistory };
      }
      return s;
    }));

    // Trigger AI regeneration
    await processAIResponse(currentSessionId, newHistory);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentMessages = currentSession ? currentSession.messages : [];

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-gray-100 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={userName}
        onUpdateUserName={updateUserName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Header */}
        <header className="flex-none h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <MeetAiLogo className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-tight">MeetAi</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold hidden sm:inline-block">IT Expert</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col">
            
            {/* Empty State */}
            {currentMessages.length === 0 && (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-80 mt-12 md:mt-0">
                  <div className="bg-gray-800/50 p-6 rounded-3xl mb-6 shadow-2xl border border-gray-700/50">
                    <MeetAiLogo className="w-24 h-24 mb-4" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">How can I help you today, {userName}?</h2>
                  <p className="text-gray-400 max-w-md mb-8">
                    I am your expert IT assistant. Fluent in all coding languages.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    <button onClick={() => handleSendMessage("Explain React Hooks", [])} className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-left transition-all">
                      <span className="text-blue-400 text-xs font-bold uppercase block mb-1">Concept</span>
                      <span className="text-sm">Explain React Hooks</span>
                    </button>
                    <button onClick={() => handleSendMessage("Debug this Python code...", [])} className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-left transition-all">
                      <span className="text-green-400 text-xs font-bold uppercase block mb-1">Debug</span>
                      <span className="text-sm">Fix my Python script</span>
                    </button>
                  </div>
               </div>
            )}

            {currentMessages.map(msg => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onEdit={handleEditMessage}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        {/* Input Area */}
        <div className="flex-none">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default App;