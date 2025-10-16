
import React, { useState, useRef, useEffect } from 'react';
import type { User, ChatMessage } from '../types';

interface ContactPageProps {
  user: User;
  messages: ChatMessage[];
  onSendMessage: (messageText: string) => Promise<void>;
  isSending: boolean;
}

const TypingIndicator = () => (
    <div className="flex items-center space-x-1.5">
        <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div>
    </div>
);

const FormattedMessage: React.FC<{ text: string, sender: 'user' | 'bot' }> = ({ text, sender }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part.length > 0);
  const textColor = sender === 'user' ? 'text-white' : 'text-gray-200';
  const boldColor = sender === 'user' ? 'text-white font-bold' : 'font-semibold text-white';

  return (
    <div className={`text-sm ${textColor} whitespace-pre-wrap leading-relaxed`}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className={boldColor}>{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const formatDateSeparator = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return 'Avui';
    if (isSameDay(date, yesterday)) return 'Ahir';
    
    return date.toLocaleDateString('ca-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const ContactPage: React.FC<ContactPageProps> = ({ user, messages, onSendMessage, isSending }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isSending) return;

    const textToSend = inputValue.trim();
    setInputValue('');
    await onSendMessage(textToSend);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 rounded-xl overflow-hidden">
      <div className="chat-container flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showDateSeparator = !prevMessage || !isSameDay(new Date(message.timestamp), new Date(prevMessage.timestamp));
            
            return (
                <React.Fragment key={message.id}>
                    {showDateSeparator && (
                        <div className="flex justify-center my-2">
                            <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                                {formatDateSeparator(new Date(message.timestamp))}
                            </span>
                        </div>
                    )}
                    <div className={`animate-fadeInSlideUp flex items-end gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {message.sender === 'bot' && (
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm self-end">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                  <path d="M10 16.5l-3 -3l3 -3l-3 -3l3 -3l3 3l3 -3l3 3l-3 3l3 3l-3 3l-3 -3z" />
                              </svg>
                          </div>
                      )}
                      <div className="flex flex-col max-w-xs md:max-w-md lg:max-w-lg">
                        <span className={`text-xs text-gray-400 mb-1 ${message.sender === 'user' ? 'self-end mr-2' : 'self-start ml-2'}`}>
                          {message.sender === 'user' ? 'Tu' : 'Assistent'}
                        </span>
                        <div
                          className={`relative px-4 py-3 rounded-xl break-words shadow-md ${
                            message.sender === 'user'
                              ? 'bg-green-600 text-white rounded-br-none'
                              : 'bg-gray-800 text-gray-200 rounded-bl-none'
                          }`}
                        >
                          {message.isLoading && message.text.length === 0 ? (
                              <TypingIndicator />
                          ) : (
                              <div className="flex flex-col">
                                  <FormattedMessage text={message.text} sender={message.sender} />
                                  <div className={`self-end text-xs mt-1.5 ${message.sender === 'user' ? 'text-gray-200/80' : 'text-gray-400/80'}`}>
                                      {new Date(message.timestamp).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                              </div>
                          )}
                        </div>
                      </div>
                      {message.sender === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm self-end">
                              {user.name.charAt(0).toUpperCase()}
                          </div>
                      )}
                    </div>
                </React.Fragment>
            )
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-gray-950 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="group flex items-center space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escriu un missatge..."
            disabled={isSending}
            className="flex-grow w-full bg-gray-800 border-transparent rounded-lg py-3 px-5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isSending || inputValue.trim() === ''}
            className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110 disabled:bg-gray-600 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-green-500"
            aria-label="Envia el missatge"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
      <style>{`
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInSlideUp {
          animation: fadeInSlideUp 0.4s ease-out forwards;
        }
        .chat-container::-webkit-scrollbar {
            width: 6px;
        }
        .chat-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .chat-container::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default ContactPage;