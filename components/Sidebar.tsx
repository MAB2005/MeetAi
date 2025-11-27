import React, { useState } from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
  userName,
  onUpdateUserName,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleSaveProfile = () => {
    if (tempName.trim()) {
      onUpdateUserName(tempName.trim());
    } else {
      setTempName(userName); // Revert if empty
    }
    setIsEditingProfile(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveProfile();
    if (e.key === 'Escape') {
      setTempName(userName);
      setIsEditingProfile(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
        `}
      >
        {/* Header / New Chat */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-2">
           <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Chat</span>
          </button>
          
          <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm mt-10 px-4">
              No chat history.<br/>Start a new conversation!
            </div>
          ) : (
            sessions.slice().sort((a, b) => b.createdAt - a.createdAt).map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                  ${session.id === currentSessionId ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title}
                  </p>
                  <p className="text-[10px] opacity-60">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                  title="Delete chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Profile</div>
          {isEditingProfile ? (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <input 
                 type="text" 
                 value={tempName}
                 onChange={(e) => setTempName(e.target.value)}
                 onKeyDown={handleKeyDown}
                 className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-gray-500"
                 placeholder="Your Name"
                 autoFocus
               />
               <div className="flex gap-2 text-xs">
                 <button 
                  onClick={handleSaveProfile} 
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-md font-medium transition-colors"
                 >
                   Save
                 </button>
                 <button 
                  onClick={() => {
                    setTempName(userName);
                    setIsEditingProfile(false);
                  }} 
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded-md font-medium transition-colors"
                 >
                   Cancel
                 </button>
               </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 group cursor-pointer p-1 rounded-lg hover:bg-gray-800 transition-all" 
              onClick={() => { setTempName(userName); setIsEditingProfile(true); }}
              title="Click to edit profile"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/10">
                {getInitials(userName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                  {userName}
                </p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Online
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                   <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                   <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                 </svg>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-800 text-[10px] text-center text-gray-600">
           MeetAi &copy; 2025
        </div>
      </aside>
    </>
  );
};

export default Sidebar;