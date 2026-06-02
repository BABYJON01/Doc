import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/aiService';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Assalomu alaykum! Men Med-Zukkoo AI yordamchisiman. Sizga qanday tibbiy yordam bera olaman?", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { id: Date.now(), text: userMsg, sender: 'user' }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Pass history excluding the initial greeting for cleaner context
            const history = newMessages.slice(1, -1).map(m => ({ text: m.text, sender: m.sender }));
            const res = await chatWithAI(userMsg, history);
            
            setMessages(prev => [...prev, { 
                id: Date.now(), 
                text: res.success ? res.text : (res.error || res.text), 
                sender: 'ai',
                source: res.source
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now(), text: "Kechirasiz, xatolik yuz berdi.", sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <div className={`transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 mb-4' : 'scale-0 opacity-0 h-0 w-0 overflow-hidden'}`}>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.3)] w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 border-b border-blue-500/30 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/50">
                                <i className="fa-solid fa-comment-medical text-blue-400 text-lg"></i>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Med-Zukkoo AI</h3>
                                <p className="text-emerald-400 text-[10px] font-bold flex items-center gap-1"><i className="fa-solid fa-circle text-[8px] animate-pulse"></i> Online</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 bg-slate-900/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' 
                                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm shadow-md'
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    {msg.source && <p className="text-[9px] text-slate-500 mt-1 italic text-right">M: {msg.source}</p>}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-2 items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-700 bg-slate-800">
                        <form onSubmit={handleSend} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Savolingizni yozing..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim() || isLoading}
                                className="w-11 h-11 shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/25"
                            >
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] z-50 ${isOpen ? 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rotate-90 scale-90' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-110 hover:-translate-y-1'}`}
            >
                <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-comment-medical'} text-2xl`}></i>
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                    </span>
                )}
            </button>
        </div>
    );
};

export default AIChatbot;
