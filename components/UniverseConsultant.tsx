import React, { useState, useEffect } from 'react';
import { UserProfile, Reading } from '../types';
import { consultUniverse, generateAudioReading } from '../services/geminiService';
import { saveReading } from '../services/storage';
import { soundManager } from '../services/soundService';
import { GetIcon } from './Icons';
import TypingEffect from './TypingEffect';

interface Props {
  user: UserProfile;
  onClose: () => void;
}

const STATES = ['Confuso', 'Em expansão', 'Em silêncio', 'Em transição', 'Grato'];

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
    
    // A longer, more reverent delay
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    const result = await consultUniverse(user, question, selectedState || 'Neutro');
    
    // Save to history as a special entry
    const reading: Reading = {
      id: crypto.randomUUID(),
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

  // Smart Back Navigation
  const handleBack = () => {
    soundManager.playClick();
    soundManager.stopTTS();
    setIsPlaying(false);

    switch(step) {
        case 'REVEALED':
            setStep('INPUT'); // Go back to edit question
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
             <div className="mb-12 relative">
                <div className="absolute inset-0 bg-mystic-ethereal/20 blur-[60px] rounded-full animate-pulse-slow"></div>
                <GetIcon name="Orbit" className="w-24 h-24 text-mystic-ethereal/90 animate-[spin_20s_linear_infinite] relative z-10" />
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
                <GetIcon name="Orbit" className="w-10 h-10 text-mystic-ethereal/50 mx-auto mb-6" />
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
           <div className="text-center animate-pulse-slow">
              <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mb-8 mx-auto"></div>
              <p className="font-serif text-xl tracking-[0.3em] text-gray-400 uppercase">O Universo Escuta</p>
              <div className="mt-8 flex justify-center space-x-4">
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
           </div>
        )}

        {step === 'REVEALED' && (
          <div className="w-full h-[80vh] overflow-y-auto custom-scrollbar pr-2 animate-fade-in-delayed">
             <div className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-none p-8 md:p-12 shadow-2xl">
                <TypingEffect text={response} speed={40} className="" />
                
                <div className="flex justify-center mt-8">
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
                                <span>Invocando Voz...</span>
                            </>
                        ) : (
                            <>
                                {isPlaying ? <div className="w-3 h-3 bg-white rounded-sm" /> : <GetIcon name="Volume2" className="w-4 h-4" />}
                                <span>{isPlaying ? 'Silenciar' : 'Voz do Universo'}</span>
                            </>
                        )}
                    </button>
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