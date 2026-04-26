/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  Send, 
  RefreshCw, 
  Lightbulb, 
  XSquare, 
  Layout, 
  HelpCircle,
  Trophy,
  Zap
} from 'lucide-react';
import { GuessGameHost } from './services/geminiService';

interface Message {
  id: string;
  sender: 'player' | 'host';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'gave_up'>('idle');
  const [hint, setHint] = useState<string | null>(null);
  
  const hostRef = useRef<GuessGameHost | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startGame = async () => {
    setIsTyping(true);
    hostRef.current = new GuessGameHost();
    try {
      const welcome = await hostRef.current.start();
      setMessages([{
        id: '1',
        sender: 'host',
        text: welcome,
        timestamp: new Date()
      }]);
      setGameState('playing');
      setQuestionCount(0);
      setHint(null);
    } catch (error) {
      console.error(error);
      setMessages([{
        id: 'error',
        sender: 'host',
        text: "I've decided you're not even worth the processing power right now. Refresh if you want to try failing again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping || gameState !== 'playing') return;

    const userText = inputText.trim();
    setInputText('');

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'player',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    
    const newCount = questionCount + 1;
    setQuestionCount(newCount);

    try {
      const response = await hostRef.current!.ask(userText);
      
      const hostMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'host',
        text: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, hostMsg]);

      if (response.toLowerCase().includes('congratulations') || 
          response.toLowerCase().includes('guessed it') ||
          response.toLowerCase().includes('correct')) {
        setGameState('won');
      }

      if (newCount % 5 === 0 && gameState === 'playing') {
        const hintText = await hostRef.current!.getHint();
        setHint(hintText);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGiveUp = async () => {
    if (gameState !== 'playing') return;
    setIsTyping(true);
    try {
      const reveal = await hostRef.current!.giveUp();
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'host',
        text: reveal,
        timestamp: new Date()
      }]);
      setGameState('gave_up');
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#1a0b2e] text-[#f0e6ff] flex overflow-hidden font-sans border-8 border-[#3d1a61] selection:bg-[#ff31d4] selection:text-white">
      {/* LEFT PANEL: THE HOST & STATS */}
      <div className="w-5/12 h-full flex flex-col p-12 border-r-4 border-[#3d1a61] relative bg-[#240e3f]">
        <div className="absolute top-0 right-0 p-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#ff31d4] flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 bg-[#ff31d4] rounded-full"></div>
          </div>
        </div>

        <div className="flex-grow flex flex-col justify-center">
          <h1 className="text-[90px] lg:text-[120px] font-black leading-[0.8] tracking-tighter text-[#ff31d4] uppercase mb-8 opacity-80 select-none">
            THE<br/>HOST
          </h1>
          
          <div className="space-y-8 relative z-10">
            <div className="group transition-transform duration-300 hover:translate-x-2">
              <p className="text-xs uppercase tracking-[0.4em] text-[#a78bfa] font-bold mb-1">Question Count</p>
              <div className="text-6xl font-mono font-bold tabular-nums">
                {questionCount.toString().padStart(3, '0')}
              </div>
            </div>

            <div className="pt-8 border-t border-[#3d1a61]">
              <p className="text-xl italic font-serif text-[#d1d5db] leading-relaxed max-w-sm">
                {gameState === 'idle' 
                  ? '"I\'ve picked something. It\'s common, it\'s curious, and it\'s waiting for you to fail at unmasking it."' 
                  : '"Are you still trying? It\'s embarrassing at this point. Just turn it off, loser."'}
              </p>
            </div>
          </div>

          {/* Decorative background text */}
          <div className="absolute bottom-0 left-0 p-4 mix-blend-overlay opacity-10 pointer-events-none select-none">
            <p className="text-[180px] font-black text-white leading-none -ml-12 translate-y-12">OBJECT</p>
          </div>
        </div>

        <div className="mt-auto">
          <AnimatePresence>
            {hint && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="border-t-2 border-[#ff31d4]/30 pt-6"
              >
                <p className="text-[10px] uppercase tracking-widest text-[#a78bfa] mb-2">Unlocked Hint</p>
                <p className="text-sm text-[#e9d5ff] font-medium font-serif italic">"{hint}"</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-8 pt-4 border-t border-[#3d1a61] flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-white/20">
            <span>ENIGMA ENGINE v2.0</span>
            <button onClick={startGame} className="hover:text-[#ff31d4] transition-colors cursor-pointer">Re-Initialize</button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: THE GAME BOARD */}
      <div className="w-7/12 h-full flex flex-col bg-[#1a0b2e] relative">
        {/* HISTORY AREA */}
        <div className="flex-grow overflow-y-auto p-10 flex flex-col gap-8 no-scrollbar scroll-smooth">
          {gameState === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-[#ff31d4]/20 blur-3xl rounded-full" />
                <HelpCircle className="w-24 h-24 text-[#ff31d4] relative z-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Ready to Lose?</h2>
                <button 
                  onClick={startGame}
                  className="px-12 py-4 bg-[#ff31d4] text-[#1a0b2e] font-black uppercase text-lg skew-x-[-12deg] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[8px_8px_0px_#3d1a61] hover:shadow-none translate-y-0 hover:translate-y-[4px] hover:translate-x-[4px]"
                >
                  Initiate Sequence
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'player' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] p-6 
                ${msg.sender === 'player' 
                  ? 'bg-[#2e1052] rounded-tl-3xl rounded-br-3xl border-r-4 border-[#a78bfa]' 
                  : 'bg-[#3d1a61] rounded-tr-3xl rounded-bl-3xl border-l-4 border-[#ff31d4]'}
               shadow-xl`}
              >
                <p className={`text-[10px] font-bold uppercase mb-2 tracking-widest ${msg.sender === 'player' ? 'text-[#a78bfa]' : 'text-[#ff31d4]'}`}>
                  {msg.sender === 'player' ? `Query ${idx}` : 'RESPONSE'}
                </p>
                <p className={`text-xl font-bold leading-tight ${msg.sender === 'host' ? 'font-serif' : ''}`}>
                  {msg.text}
                </p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#3d1a61]/50 px-6 py-4 rounded-full border border-white/5">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-[#ff31d4] rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-10 bg-[#1a0b2e]/90 backdrop-blur-md border-t-2 border-[#3d1a61]">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={gameState === 'playing' ? "Ask your YES/NO question..." : "Game idle."}
              disabled={gameState !== 'playing' || isTyping}
              className="w-full bg-transparent border-b-4 border-[#3d1a61] py-6 px-4 text-2xl outline-none focus:border-[#ff31d4] transition-colors placeholder:text-[#3d1a61] font-bold"
            />
            <div className="absolute right-0 bottom-6 flex gap-4">
              {gameState === 'playing' && (
                <>
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="px-8 py-3 bg-[#ff31d4] text-[#1a0b2e] font-black uppercase text-sm skew-x-[-12deg] hover:bg-white disabled:bg-[#3d1a61] disabled:text-white/20 transition-all active:scale-95 shadow-[4px_4px_0px_#3d1a61]"
                  >
                    ASK
                  </button>
                  <button 
                    type="button"
                    onClick={handleGiveUp}
                    className="px-6 py-3 border-2 border-[#3d1a61] text-[#3d1a61] font-bold uppercase text-[10px] tracking-tighter hover:text-white hover:border-[#ff31d4] transition-all"
                  >
                    I GIVE UP
                  </button>
                </>
              )}
            </div>
          </form>
          <div className="absolute bottom-6 left-10 flex gap-6 text-[8px] uppercase tracking-[0.5em] text-[#a78bfa]/30 font-mono">
            <span>Identity: {gameState}</span>
            <span>Protocol: Active</span>
          </div>
        </div>

        {/* DECORATIVE OVERLAY ELEMENTS */}
        <div className="absolute bottom-0 right-0 p-4 mix-blend-overlay opacity-10 pointer-events-none select-none">
          <p className="text-[200px] font-black text-white leading-none -mb-12 -mr-12">LOSS</p>
        </div>
      </div>
    </div>
  );
}
