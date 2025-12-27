import React, { useState, useEffect } from 'react';
import { UserProfile, Reading } from '../types';
import { consultMetatron, MetatronMode, generateAudioReading } from '../services/geminiService';
import { saveReading } from '../services/storage';
import { soundManager } from '../services/soundService';
import { GetIcon } from './Icons';
import TypingEffect from './TypingEffect';

interface Props {
  user: UserProfile;
  onClose: () => void;
}

// Sacred Geometry SVG Component
const MetatronCube: React.FC<{ className?: string, spinning?: boolean }> = ({ className, spinning }) => (
    <div className={`relative ${className}`}>
        <svg viewBox="0 0 100 100" className={`w-full h-full text-mystic-gold opacity-80 ${spinning ? 'animate-[spin_60s_linear_infinite]' : ''}`}>
            {/* Base Circle */}
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.2" className="opacity-30" />
            
            {/* Hexagon Outline */}
            <path d="M50 5 L93.3 30 V80 L50 95 L6.7 80 V30 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-60" />
            
            {/* Inner Triangles/Star */}
            <path d="M50 5 L50 95 M93.3 30 L6.7 80 M93.3 80 L6.7 30" stroke="currentColor" strokeWidth="0.2" className="opacity-40" />
            <path d="M50 5 L6.7 80 L93.3 80 Z" fill="none" stroke="currentColor" strokeWidth="0.3" className="opacity-50" />
            <path d="M50 95 L6.7 30 L93.3 30 Z" fill="none" stroke="currentColor" strokeWidth="0.3" className="opacity-50" />
            
            {/* Center */}
            <circle cx="50" cy="50" r="2" fill="currentColor" className="animate-pulse" />
            
            {/* Nodes */}
            <circle cx="50" cy="5" r="1" fill="currentColor" />
            <circle cx="93.3" cy="30" r="1" fill="currentColor" />
            <circle cx="93.3" cy="80" r="1" fill="currentColor" />
            <circle cx="50" cy="95" r="1" fill="currentColor" />
            <circle cx="6.7" cy="80" r="1" fill="currentColor" />
            <circle cx="6.7" cy="30" r="1" fill="currentColor" />
        </svg>
        
        {/* Counter-rotating inner element */}
        <div className="absolute inset-[25%] opacity-60">
             <svg viewBox="0 0 100 100" className={`w-full h-full text-mystic-gold ${spinning ? 'animate-[spin_30s_linear_infinite_reverse]' : ''}`}>
                 <path d="M50 10 L85 70 H15 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
             </svg>
        </div>
    </div>
);

const MetatronView: React.FC<Props> = ({ user, onClose }) => {
  const [status, setStatus] = useState<'IDLE' | 'ANALYZING' | 'REVEALED'>('IDLE');
  const [response, setResponse] = useState('');
  const [activeMode, setActiveMode] = useState<MetatronMode | null>(null);
  
  // Audio
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => soundManager.stopTTS();
  }, []);

  const handleConsult = async (mode: MetatronMode) => {
    soundManager.playClick();
    setActiveMode(mode);
    setStatus('ANALYZING');
    setResponse('');
    setAudioBase64(null);
    soundManager.stopTTS();
    setIsPlaying(false);

    // Structural Delay
    await new Promise(resolve => setTimeout(resolve, 4000));

    const result = await consultMetatron(user, mode);
    
    // Save
    const reading: Reading = {
        id: crypto.randomUUID(),
        portalId: 'metatron',
        portalName: 'METATRON',
        timestamp: Date.now(),
        userInput: `[MODO: ${mode}]`,
        response: result
    };
    saveReading(reading);

    setResponse(result);
    setStatus('REVEALED');
    soundManager.playReveal();
  };

  const toggleAudio = async () => {
    soundManager.playClick();
    if (isPlaying) {
        soundManager.stopTTS();
        setIsPlaying(false);
        return;
    }
    if (audioBase64) {
        setIsPlaying(true);
        soundManager.playTTS(audioBase64, () => setIsPlaying(false));
        return;
    }
    if (!response || generatingAudio) return;
    setGeneratingAudio(true);
    const rawBase64 = await generateAudioReading(response);
    if (rawBase64) {
        setAudioBase64(rawBase64);
        setIsPlaying(true);
        soundManager.playTTS(rawBase64, () => setIsPlaying(false));
    }
    setGeneratingAudio(false);
  };

  const handleBack = () => {
    soundManager.playClick();
    if (status === 'REVEALED') {
        setStatus('IDLE');
        setActiveMode(null);
    } else {
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-mystic-gold flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Background Geometry Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center">
          <MetatronCube className="w-[150vw] h-[150vw] md:w-[800px] md:h-[800px] text-[#1a1a1a]" spinning />
      </div>

      {/* Header Buttons */}
      <div className="absolute top-6 left-6 z-50">
         <button onClick={handleBack} className="p-2 rounded-full border border-mystic-gold/20 text-mystic-gold/50 hover:text-mystic-gold hover:bg-mystic-gold/10 transition-colors">
            <GetIcon name="ChevronLeft" className="w-6 h-6" />
         </button>
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        
        {/* TITLE BLOCK */}
        <div className={`transition-all duration-1000 flex flex-col items-center ${status === 'IDLE' ? 'mb-16' : 'mb-8 scale-75'}`}>
             <div className="w-20 h-20 mb-6 relative">
                 <MetatronCube className="w-full h-full" spinning={status === 'ANALYZING'} />
             </div>
             <h1 className="font-serif text-2xl md:text-3xl tracking-[0.4em] uppercase text-mystic-gold text-center">
                 METATRON
             </h1>
             <div className="w-32 h-[1px] bg-mystic-gold/30 mt-4 mb-2"></div>
             <p className="font-sans text-[9px] tracking-[0.5em] uppercase text-mystic-gold/50">
                 O Arquiteto
             </p>
        </div>

        {/* IDLE STATE: MENU */}
        {status === 'IDLE' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <button onClick={() => handleConsult('ORDER')} className="group p-6 border border-mystic-gold/20 bg-black/40 backdrop-blur-sm hover:bg-mystic-gold/5 transition-all duration-500 flex flex-col items-center gap-4 hover:border-mystic-gold/50">
                    <GetIcon name="BoxSelect" className="w-8 h-8 text-mystic-gold/60 group-hover:text-mystic-gold transition-colors" />
                    <div className="text-center">
                        <span className="block font-serif text-sm tracking-[0.2em] uppercase text-mystic-ethereal">Ordem</span>
                        <span className="block text-[9px] font-sans tracking-widest text-gray-500 mt-2">Diagnóstico de Estrutura</span>
                    </div>
                </button>

                <button onClick={() => handleConsult('DOSSIER')} className="group p-6 border border-mystic-gold/20 bg-black/40 backdrop-blur-sm hover:bg-mystic-gold/5 transition-all duration-500 flex flex-col items-center gap-4 hover:border-mystic-gold/50">
                    <GetIcon name="History" className="w-8 h-8 text-mystic-gold/60 group-hover:text-mystic-gold transition-colors" />
                    <div className="text-center">
                        <span className="block font-serif text-sm tracking-[0.2em] uppercase text-mystic-ethereal">Dossiê</span>
                        <span className="block text-[9px] font-sans tracking-widest text-gray-500 mt-2">Análise de Padrões</span>
                    </div>
                </button>

                <button onClick={() => handleConsult('GEOMETRY')} className="group p-6 border border-mystic-gold/20 bg-black/40 backdrop-blur-sm hover:bg-mystic-gold/5 transition-all duration-500 flex flex-col items-center gap-4 hover:border-mystic-gold/50">
                    <GetIcon name="Hexagon" className="w-8 h-8 text-mystic-gold/60 group-hover:text-mystic-gold transition-colors" />
                    <div className="text-center">
                        <span className="block font-serif text-sm tracking-[0.2em] uppercase text-mystic-ethereal">Geometria</span>
                        <span className="block text-[9px] font-sans tracking-widest text-gray-500 mt-2">Forma da Vida Atual</span>
                    </div>
                </button>

                <button onClick={() => handleConsult('ALIGNMENT')} className="group p-6 border border-mystic-gold/20 bg-black/40 backdrop-blur-sm hover:bg-mystic-gold/5 transition-all duration-500 flex flex-col items-center gap-4 hover:border-mystic-gold/50">
                    <GetIcon name="Triangle" className="w-8 h-8 text-mystic-gold/60 group-hover:text-mystic-gold transition-colors" />
                    <div className="text-center">
                        <span className="block font-serif text-sm tracking-[0.2em] uppercase text-mystic-ethereal">Alinhamento</span>
                        <span className="block text-[9px] font-sans tracking-widest text-gray-500 mt-2">Síntese de Portais</span>
                    </div>
                </button>
            </div>
        )}

        {/* ANALYZING STATE */}
        {status === 'ANALYZING' && (
            <div className="flex flex-col items-center justify-center animate-pulse-slow mt-10">
                <div className="text-[10px] font-sans tracking-[0.5em] uppercase text-mystic-gold mb-8">Acessando a Matriz...</div>
                <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-mystic-gold to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/50 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
        )}

        {/* REVEALED STATE */}
        {status === 'REVEALED' && (
            <div className="w-full h-[65vh] overflow-y-auto custom-scrollbar border-t border-b border-mystic-gold/10 bg-black/40 backdrop-blur-md p-8 animate-fade-in relative">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-mystic-gold/40"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-mystic-gold/40"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-mystic-gold/40"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-mystic-gold/40"></div>

                <TypingEffect text={response} speed={30} className="text-justify" />

                <div className="flex justify-center mt-12 mb-4">
                    <button 
                        onClick={toggleAudio}
                        disabled={generatingAudio}
                        className={`flex items-center gap-3 px-6 py-2 border border-mystic-gold/30 rounded-none transition-all text-[10px] font-sans tracking-[0.3em] uppercase
                            ${isPlaying ? 'bg-mystic-gold/10 text-mystic-gold animate-pulse' : 'text-mystic-gold/60 hover:text-mystic-gold hover:bg-mystic-gold/5'}
                        `}
                    >
                        {generatingAudio ? (
                            <GetIcon name="RefreshCw" className="w-3 h-3 animate-spin" />
                        ) : (
                            <GetIcon name={isPlaying ? "VolumeX" : "Volume2"} className="w-3 h-3" />
                        )}
                        <span>{isPlaying ? 'Silenciar Frequência' : 'Voz da Estrutura'}</span>
                    </button>
                </div>
                
                <div className="text-center mt-6">
                    <p className="text-[9px] font-serif italic text-mystic-gold/30">"Tudo já está escrito. Mas nem tudo precisa ser lido agora."</p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default MetatronView;