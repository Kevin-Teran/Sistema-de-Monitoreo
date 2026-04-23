/**
 * @file AiAssistantButton.tsx
 * @description Implementa el botón flotante y el panel lateral de chat con toda la lógica del asistente de IA.
 * Se fija en la esquina inferior derecha (bottom-6, right-6).
 * @author Kevin Mariano
 * @version 1.0.6 // Versión final de Layout y Control de Ocultamiento
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/context/AuthContext';
import { Bot, Sparkles, Clipboard, Trash2, Send, X, Bot as BotIconComponent } from 'lucide-react'; 
import { clsx } from 'clsx';
import api from '@/config/api'; 
const cn = (...classes: (string | boolean | null | undefined)[]) => classes.filter(Boolean).join(' ');

const XIcon = X; 
const BotIcon = BotIconComponent;

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  command?: any; 
};

const PREGUNTAS_SUGERIDAS: string[] = [
  '¿Cuál es el estado general del sistema?',
  'Analiza los niveles de pH de las últimas 48 horas.',
  '¿Hay alguna recomendación para el oxígeno disuelto?',
];

const UserAvatar = ({ name }: { name: string }) => {
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };
  return (
    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
      {getInitials(name)}
    </div>
  );
};

const processAIResponse = (rawText: string) => {
    let cleanText = rawText;
    let command = null;

    const commandBlockRegex = /[\s\S]*?/g;
    cleanText = cleanText.replace(commandBlockRegex, '').trim();
    cleanText = cleanText.replace(/```[\s\S]*?```/g, '').trim();
    cleanText = cleanText.replace(/'''[\s\S]*?'''/g, '').trim();
    cleanText = cleanText.replace(/\{[\s\S]*?\}/g, '').trim();
    cleanText = cleanText.replace(/`{1,3}[^`]*`{1,3}/g, '').trim();
    cleanText = cleanText.replace(/^\s*(json|type|message|id|respuesta)\s*$/gmi, '').trim();
    cleanText = cleanText.replace(/^\s*\.{2,}\s*$/gm, '').trim();
    cleanText = cleanText.replace(/^["']+|["']+$/g, '').trim();
    
    const lines = cleanText.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('":') || trimmedLine.includes('{"') || trimmedLine.includes('"}')) {
        return false;
      }
      if (/^[\{\}\[\]:,"]*$/.test(trimmedLine)) {
        return false;
      }
      return trimmedLine.length > 0;
    });
    cleanText = filteredLines.join('\n').trim();

    cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();
    cleanText = cleanText.replace(/\s{2,}/g, ' ').trim();

    if (cleanText.length < 10) {
      cleanText = 'Lo siento, no pude procesar tu consulta correctamente. Por favor, intenta reformular tu pregunta.';
    }

    return { cleanText, command };
};

interface AiAssistantButtonProps {
    isOtherPanelOpen: boolean; // Para saber si el AlertsPanel está abierto
    setIsOpen: (isOpen: boolean) => void;
    isOpen: boolean;
}

export const AiAssistantButton: React.FC<AiAssistantButtonProps> = ({ isOtherPanelOpen, setIsOpen, isOpen }) => {
  const { user } = useAuth();
  
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const togglePanel = useCallback(() => {
      setIsOpen(!isOpen);
      if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 100);
      }
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, cargando]);
  
  useEffect(() => {
      if (messages.length === 0 && !cargando && user) {
           setMessages([{
               id: 1,
               text: `Hola ${user.name.split(' ')[0]}, soy asistente de IA. ¿En qué puedo ayudarte con tu sistema hoy?`,
               sender: 'ai'
           }]);
      }
  }, [messages.length, cargando, user]);


  const sendMessage = useCallback(async (pregunta: string) => {
    if (!pregunta.trim() || cargando) return;

    const userMessage: Message = { id: Date.now(), text: pregunta, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const esPreguntaValida = pregunta.trim().length > 3 && /[a-z]/i.test(pregunta) && /[aeiou]/i.test(pregunta);
    if (!esPreguntaValida) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Lo siento, no he entendido tu pregunta. Por favor, intenta ser más específico.',
        sender: 'ai'
      }]);
      return;
    }

    setCargando(true);
    try {
      const response = await api.post('/asistente', { pregunta });
      const rawAiResponseText = response.data.respuesta; 
      const { cleanText, command } = processAIResponse(rawAiResponseText);

      setMessages(prev => [...prev, { id: Date.now() + 1, text: cleanText, sender: 'ai', command }]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al contactar al servidor.';
      setMessages(prev => [...prev, { id: Date.now() + 1, text: `Error: ${errorMsg}. Verifique la API de Groq en el backend.`, sender: 'ai' }]);
    } finally {
      setCargando(false);
      inputRef.current?.focus();
    }
  }, [cargando, isOpen, setIsOpen]);
  
  const handleFormSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleCopy = (text: string, id: number) => { 
      if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
      } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
      }
      setCopiedId(id); 
      setTimeout(() => setCopiedId(null), 2000); 
  };
  const handleClearChat = () => setMessages([]);


  // --- Renderización del Botón Flotante y Panel Lateral ---

  const floatingButtonClasses = clsx(
    // POSICIÓN INFERIOR DERECHA: bottom-6 right-6
    "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all duration-300", 
    "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800",
    "flex items-center justify-center transform hover:scale-105"
  );
  
  return (
    <div className='relative'>
      {/* 1. Botón Flotante para el Asistente IA */}
      <button
        onClick={togglePanel}
        aria-label="Abrir Asistente de IA"
        // Ocultar si el panel de IA está cerrado Y el otro (Alertas) está abierto
        className={clsx(floatingButtonClasses, { 'hidden': isOtherPanelOpen && !isOpen })} 
      >
        <BotIcon size={24} />
      </button>

      {/* 2. Panel de Chat del Asistente IA */}
      
      {/* Overlay para cerrar el panel al hacer clic fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[49]" 
          onClick={togglePanel} 
        ></div>
      )}

      {/* Contenedor del panel deslizable */}
      <div
        className={clsx(
          // FIX CLAVE DE LAYOUT: h-full y flex-col
          'fixed bottom-0 right-0 h-full w-full sm:w-96 shadow-2xl z-50 transition-transform duration-300 transform', 
          'bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col rounded-t-xl',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        
        
          {/* Cabecera del Panel (flex-shrink-0) */}
          <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
             <div className='flex items-center gap-2'>
                <BotIcon size={20} className='text-emerald-600' />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">asistente de (IA)</h2>
             </div>
             <div className="flex space-x-2">
                {messages.length > 0 && (
                    <button onClick={handleClearChat} className="flex items-center gap-1 p-1 text-sm font-medium text-gray-500 dark:text-gray-400 bg-transparent rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-all">
                        <Trash2 size={16} />
                    </button>
                )}
                <button 
                    onClick={togglePanel} 
                    aria-label="Cerrar Asistente"
                    className="p-1 rounded-full text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                    <XIcon size={24} />
                </button>
             </div>
          </header>
        
          {/* Cuerpo del Chat (Mensajes) - USAR flex-grow DIRECTAMENTE */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 h-full flex flex-col justify-center items-center p-4">
                <BotIcon size={48} className="mb-4 text-gray-400" />
                <h2 className="text-lg font-semibold">Bienvenido al Asistente</h2>
                <p className="text-sm max-w-sm mx-auto">Puedes empezar saludando o usando una de las sugerencias.</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={clsx('group flex items-start gap-3 sm:gap-4', { 'justify-end': msg.sender === 'user' })}>
                  {msg.sender === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <BotIcon size={20} className="text-emerald-600 dark:text-emerald-400"/>
                    </div>
                  )}
                  <div className={clsx('relative max-w-xs md:max-w-md rounded-xl px-4 py-3 text-sm', {
                    'bg-emerald-600 text-white': msg.sender === 'user',
                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200': msg.sender === 'ai',
                  })}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.sender === 'ai' && (
                      <button onClick={() => handleCopy(msg.text, msg.id)} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-full text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedId === msg.id ? <span className="text-emerald-500 text-xs">¡Ok!</span> : <Clipboard size={14} />}
                      </button>
                    )}
                  </div>
                  {msg.sender === 'user' && <UserAvatar name={user?.name || 'Usuario'} />}
                </div>
              </div>
            ))}
            {cargando && (
              <div className="flex items-start gap-4 animate-in fade-in">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"> <BotIcon size={24} className='text-emerald-600'/> </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-dot [animation-delay:0s]"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-dot [animation-delay:0.2s] mx-1"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-dot [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (flex-shrink-0) */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="hidden sm:flex flex-wrap gap-2 mb-3">
              {messages.length < 5 && PREGUNTAS_SUGERIDAS.map(sug => (
                <button key={sug} onClick={() => sendMessage(sug)} disabled={cargando} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50">
                  <Sparkles size={12} className="inline mr-1.5" />{sug}
                </button>
              ))}
            </div>
            <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-grow w-full h-12 px-4 rounded-xl border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-base"
                disabled={cargando}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || cargando} 
                className="flex-shrink-0 flex items-center justify-center h-12 w-12 bg-emerald-600 text-white rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
                aria-label="Enviar mensaje"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        
      </div>
    </div>
  );
};