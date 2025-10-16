import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { BeatLoader } from 'react-spinners';
import type { ChatMessage, User } from '../types';

interface ContactPageProps {
  user: User;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
}

const ContactPage: React.FC<ContactPageProps> = ({ user, messages, onSendMessage, isSending }) => {
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isSending) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const formatTimestamp = (date: Date): string => {
    return new Date(date).toLocaleTimeString('ca-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
  };

  // This function will safely render markdown-like bold text.
  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*{2}.*?\*{2})/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
        } 
        return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center">
        <div className="text-cyan-400 mr-3 text-2xl">
          <FiMessageSquare />
        </div>
        <h2 className="text-xl font-bold">Contacta amb nosaltres</h2>
      </div>

      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto chat-container">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 animate-fadeInSlideUp ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0"></div>}
              <div className={`px-4 py-2 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg ${msg.sender === 'user' ? 'bg-blue-600/50 rounded-br-none' : 'bg-white/10 rounded-bl-none'}`}>
                <p className="text-white whitespace-pre-line">
                    {msg.sender === 'bot' && msg.text.includes("un moment") 
                        ? <BeatLoader color="#82aebb" size={8} /> 
                        : renderMessageText(msg.text)}
                </p>
                <span className="text-xs text-white/50 mt-1 block text-right">{formatTimestamp(msg.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input Footer */}
      <div className="flex-shrink-0 p-4 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escriu el teu missatge aquí..."
            disabled={isSending}
            className="flex-grow px-4 py-2 bg-white/5 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
          />
          <button type="submit" disabled={isSending || !inputValue.trim()} className="p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
