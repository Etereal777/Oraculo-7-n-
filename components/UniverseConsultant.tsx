import React, { useState, useEffect } from 'react';
import { UserProfile, Reading } from '../types';
import { consultUniverse, generateAudioReading } from '../services/geminiService';
import { saveReading } from '../services/storage';
import { soundManager } from '../services/soundService';
import { GetIcon } from './Icons';

interface Props {
  user: UserProfile;
  onClose: () => void;
}

const STATES = ['Confuso', 'Em expansão', 'Em silêncio', 'Em transição', 'Grato'];

// --- VISUAL COMPONENTS ---

const AudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-8">
            <div className={`flex items-center gap-1.5 h-16 ${isPlaying ? '' : 'opacity-30 grayscale'}`}>
                 {[...Array(9)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 bg-mystic-ethereal rounded-full transition-all duration-300 ${isPlaying ? 'animate-[pulse_1s_ease-in-out_infinite]' : 'h-1'}`}
                        style={{ 
                            height: isPlaying ? `${Math.random() * 40 + 10}px` : '4px',
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: `${0.6 + Math.random() * 0.5}s`
                        }}
                    ></div>
                 ))}
            </div>
            
            <p className="text-[10px] font-serif tracking-[0.3em] uppercase text-mystic-ethereal/80 animate-pulse">
                {isPlaying ? "O Universo Fala..." : "Sintonizando Voz..."}
            </p>
        </div>
    );
};

// New Singularity Component (The Black Hole)
const Singularity: React.FC<{ mode: 'IDLE' | 'ACTIVE' | 'THINKING' }> = ({ mode }) => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* The Event Horizon (Void Core) */}
            <div className={`absolute z-20 w-24 h-24 bg-black rounded-full shadow-[0_0_50px_rgba(0,0,0,1)] transition-transform duration-1000 ${mode === 'THINKING' ? 'scale-90' : 'scale-100'}`}></div>

            {/* The Accretion Disk (Spinning Gold) */}
            <div className={`
                absolute z-10 w-full h-full rounded-full 
                bg-[conic-gradient(from_0deg,transparent,transparent,rgba(212,175,55,0.1),rgba(212,175,55,0.8),transparent)] 
                blur-sm opacity-80 mix-blend-screen
                transition-all duration-[2000ms]
                ${mode === 'THINKING' ? 'animate-[spin_0.5s_linear_infinite]' : 'animate-[spin_10s_linear_infinite]'}
            `}></div>
            
            {/* Secondary Disk (Offset) */}
             <div className={`
                absolute z-10 w-[90%] h-[90%] rounded-full 
                bg-[conic-gradient(from_180deg,transparent,transparent,rgba(232,232,227,0.1),rgba(255,255,255,0.4),transparent)] 
                blur-md opacity-50 mix-blend-overlay
                ${mode === 'THINKING' ? 'animate-[spin_1s_linear_infinite_reverse]' : 'animate-[spin_15s_linear_infinite_reverse]'}
            `}></div>

            {/* Gravity Lens Effect (Outer distortion) */}
            <div className={`absolute z-0 w-[120%] h-[120%] border border-white/5 rounded-full opacity-30 ${mode === 'THINKING' ? 'scale-110' : 'scale-100 animate-pulse-slow'}`}></div>
        </div>
    );
};

// -------------------------

const UniverseConsultant: React.FC<Props> = ({ user, onClose }) => {
  const [step, setStep] = useState<'ENTRY' | 'INPUT' | 'CONNECTING' | 'REVEALED'>('ENTRY');
  const [question, setQuestion] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [response, setResponse] = useState('');
  
  // Audio State
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      soundManager.stopTTS();
    };
  }, []);

  // Manage Stars only
  useEffect(() => {
    const container = document.getElementById('universe-container');
    if (container) {
      for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.opacity = `${Math.random() * 0.7}`;
        star.style.animation = `float ${Math.random() * 10 + 10}s infinite`;
        container.appendChild(star);
      }
    }
  }, []);

  const handleEntry = () => {
    soundManager.playClick();
    setStep('INPUT');
  };

  const handleConsult = async () => {
    if (!question) return;
    setStep('CONNECTING');
    soundManager.playTransition();
    setAudioBase64(null);
    soundManager.stopTTS();
    setIsPlaying(false);
    setGeneratingAudio(true); // Start generating logic
    
    // A longer, more reverent delay
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    try {
        const result = await consultUniverse(user, question, selectedState || 'Neutro');
        
        // CRITICAL FIX: Safe ID generation for all environments
        const safeId = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : `uni-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const reading: Reading = {
          id: safeId,
          portalId: 'consultor_universo',
          portalName: 'Consultor do Universo',
          timestamp: Date.now(),
          userInput: `${question} [${selectedState}]`,
          response: result
        };
        saveReading(reading);
        
        setResponse(result);
        setStep('REVEALED');
        soundManager.playReveal(); // Chime for the universe

        // Auto Play Audio
        const audio = await generateAudioReading(result);
        if (audio) {
            setAudioBase64(audio);
            setIsPlaying(true);
            soundManager.playTTS(audio, () => setIsPlaying(false));
        }
    } catch (e) {
        console.error("Consultation failed", e);
        setStep('INPUT');
        alert("Ocorreu um erro na comunicação. Tente novamente.");
    } finally {
        setGeneratingAudio(false);
    }
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

  const handleDownloadAudio = () => {
      if (!audioBase64) return;
      soundManager.playClick();
      try {
          const blob = soundManager.createWavBlob(audioBase64);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Universo_Voz_${Date.now()}.wav`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Download failed", e);
      }
  };

  // Smart Back Navigation
  const handleBack = () => {
    soundManager.playClick();
    soundManager.stopTTS();
    setIsPlaying(false);

    switch(step) {
        case 'REVEALED':
            setStep('INPUT'); // Go back to edit question
            break;
        case 'CONNECTING':
            // If user cancels connecting, just return to input, don't close app
            setStep('INPUT');
            break;
        case 'INPUT':
            setStep('ENTRY'); // Go back to start screen
            break;
        case 'ENTRY':
            onClose(); // Exit to dashboard
            break;
        default:
            onClose();
    }
  };

  return (
    <div id="universe-container" className="fixed inset-0 z-50 bg-mystic-void text-white overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Dynamic Star Field handled by useEffect */}
      <div className="star-field absolute inset-0 z-0 opacity-50"></div>
      
      {/* Top Left Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <button onClick={handleBack} className="p-2 rounded-full hover:bg-white/5 text-mystic-ethereal/50 hover:text-white transition-colors">
          <GetIcon name="ChevronLeft" className="w-8 h-8" />
        </button>
      </div>

      {/* Top Right Close Button */}
      <div className="absolute top-6 right-6 z-50">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-mystic-ethereal/50 hover:text-white transition-colors">
          <GetIcon name="X" className="w-8 h-8" />
        </button>
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        
        {step === 'ENTRY' && (
          <div className="text-center animate-fade-in flex flex-col items-center">
             <div className="mb-12 relative scale-125">
                <Singularity mode="IDLE" />
             </div>
             
             <h2 className="text-4xl md:text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-mystic-ethereal to-gray-400 mb-6 tracking-[0.2em] drop-shadow-2xl">
               CONSULTOR DO UNIVERSO
             </h2>
             
             <p className="text-sm md:text-base font-sans font-light tracking-[0.4em] text-gray-400 mb-16 animate-pulse-slow uppercase">
               "Aqui, a pergunta molda a resposta."
             </p>

             <button 
               onClick={handleEntry}
               onMouseEnter={() => soundManager.playHover()}
               className="group relative px-12 py-4 border border-white/10 rounded-full overflow-hidden transition-all duration-1000 hover:border-white/40 hover:bg-white/5"
             >
               <span className="relative z-10 font-serif text-sm tracking-[0.25em] text-mystic-ethereal">ENTRAR NO CONSELHO</span>
               <div className="absolute inset-0 bg-white/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             </button>
          </div>
        )}

        {step === 'INPUT' && (
          <div className="w-full animate-fade-in space-y-12">
             <div className="text-center">
                <div className="mb-6 relative scale-50 h-24 flex items-center justify-center">
                    <Singularity mode="ACTIVE" />
                </div>
                <h3 className="font-serif text-3xl text-mystic-ethereal tracking-wide">O que você deseja compreender?</h3>
             </div>

             <div className="space-y-6">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Escreva sua inquietação..."
                  className="w-full bg-transparent border-b border-white/20 p-4 text-center text-2xl md:text-3xl font-reading italic text-white placeholder-white/20 focus:outline-none focus:border-white/60 transition-all resize-none min-h-[100px]"
                  autoFocus
                />
                
                <div className="flex flex-wrap justify-center gap-3">
                  {STATES.map(s => (
                    <button
                      key={s}
                      onClick={() => { setSelectedState(s === selectedState ? '' : s); soundManager.playClick(); }}
                      className={`px-4 py-2 rounded-full text-xs font-sans tracking-[0.15em] border transition-all duration-500 uppercase
                        ${selectedState === s 
                          ? 'bg-white/10 border-white/60 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                          : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
             </div>

             <div className="flex justify-center pt-8">
               <button 
                 onClick={handleConsult}
                 onMouseEnter={() => soundManager.playHover()}
                 disabled={!question}
                 className={`p-4 rounded-full border transition-all duration-700
                   ${question 
                     ? 'border-white/50 text-white hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                     : 'border-white/5 text-gray-700 cursor-not-allowed'}`}
               >
                 <GetIcon name="ArrowRight" className="w-6 h-6" />
               </button>
             </div>
          </div>
        )}

        {step === 'CONNECTING' && (
           <div className="text-center animate-pulse-slow flex flex-col items-center">
              <div className="mb-12 relative scale-110">
                 {/* SINGULARITY PULSING FAST */}
                 <Singularity mode="THINKING" />
              </div>
              
              <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mb-8 mx-auto"></div>
              <p className="font-serif text-xl tracking-[0.3em] text-gray-400 uppercase">O Universo Escuta</p>
           </div>
        )}

        {step === 'REVEALED' && (
          <div className="w-full h-[80vh] overflow-y-auto custom-scrollbar pr-2 animate-fade-in-delayed flex flex-col items-center justify-center">
             <div className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-none p-8 md:p-12 shadow-2xl w-full">
                
                {/* Audio Visualizer replaced text */}
                <div className="py-8 flex flex-col items-center">
                    {generatingAudio ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <GetIcon name="RefreshCw" className="w-8 h-8 text-mystic-ethereal/50 animate-spin" />
                            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-mystic-ethereal/50">Decifrando Sinal...</span>
                        </div>
                    ) : (
                        <AudioVisualizer isPlaying={isPlaying} />
                    )}
                </div>
                
                <div className="flex justify-center mt-8 gap-4">
                    <button 
                        onClick={toggleAudio}
                        disabled={generatingAudio}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all text-xs font-sans tracking-[0.2em] uppercase
                            ${isPlaying 
                                ? 'bg-mystic-ethereal/20 border-white text-white animate-pulse'
                                : 'border-white/30 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                         {generatingAudio ? (
                            <>
                                <GetIcon name="RefreshCw" className="w-4 h-4 animate-spin" />
                                <span>Gerando...</span>
                            </>
                        ) : (
                            <>
                                {isPlaying ? <div className="w-3 h-3 bg-white rounded-sm" /> : <GetIcon name="Volume2" className="w-4 h-4" />}
                                <span>{isPlaying ? 'Silenciar' : 'Ouvir Novamente'}</span>
                            </>
                        )}
                    </button>

                    <button onClick={handleDownloadAudio} disabled={!audioBase64 || generatingAudio} className={`flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-sans tracking-[0.2em] uppercase ${!audioBase64 ? 'opacity-50 cursor-not-allowed' : ''}`}><GetIcon name="Download" className="w-4 h-4" /><span>Baixar Voz</span></button>
                </div>
             </div>
             
             <div className="text-center mt-12 mb-6">
                <button onClick={onClose} className="text-[10px] font-sans tracking-[0.3em] text-gray-600 hover:text-gray-300 transition-colors uppercase">
                  Voltar ao plano material
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniverseConsultant;