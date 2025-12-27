import React, { useState, useEffect, useRef } from 'react';
import { PortalConfig, InputType, UserProfile, Reading } from '../types';
import { GetIcon } from './Icons';
import { generateOracleResponse, generateAudioReading, generateMysticImage } from '../services/geminiService';
import { saveReading } from '../services/storage';
import { soundManager } from '../services/soundService';
import TypingEffect from './TypingEffect';
import { TAROT_DECK } from '../data/tarotData';
import html2canvas from 'html2canvas';

interface Props {
  portal: PortalConfig;
  user: UserProfile;
  onClose: () => void;
  initialInput?: string; 
}

// --- BREATHWORK COMPONENT ---
const RitualBreath: React.FC<{ variant?: 'gold' | 'shadow' }> = ({ variant = 'gold' }) => {
    const [text, setText] = useState("Inspire...");
    const [scale, setScale] = useState(1);
    
    useEffect(() => {
        const cycle = () => {
            setText("Inspire...");
            setScale(1.3); // Expand
            
            setTimeout(() => {
                setText("Segure...");
                setScale(1.35);
                
                setTimeout(() => {
                    setText("Expire...");
                    setScale(1); // Contract
                }, 3500);
            }, 3500);
        };

        cycle();
        const interval = setInterval(cycle, 11000); 
        return () => clearInterval(interval);
    }, []);

    if (variant === 'shadow') {
        return (
            <div className="flex flex-col items-center justify-center animate-fade-in">
                <div 
                    className="w-48 h-48 rounded-full flex items-center justify-center relative transition-transform duration-[3500ms] ease-in-out"
                    style={{ transform: `scale(${scale})` }}
                >
                    {/* Shadow Core */}
                    <div className="absolute inset-0 bg-black rounded-full blur-2xl opacity-80"></div>
                    <div className="absolute inset-4 bg-[#1a1a1a] rounded-full blur-md border border-gray-800/30"></div>
                    
                    {/* Subtle Eclipse Ring */}
                    <div className="w-40 h-40 rounded-full border border-gray-600/20 opacity-40 animate-[spin_20s_linear_infinite_reverse]"></div>
                    
                    <div className="absolute text-gray-400 font-serif tracking-[0.3em] text-sm uppercase opacity-60 mix-blend-screen">
                        {text}
                    </div>
                </div>
                <p className="mt-8 text-xs text-gray-500 font-sans tracking-[0.2em] uppercase animate-pulse">Revelando o Oculto...</p>
            </div>
        );
    }

    // Default Gold Variant
    return (
        <div className="flex flex-col items-center justify-center animate-fade-in">
            <div 
                className="w-48 h-48 rounded-full border border-mystic-gold/20 flex items-center justify-center relative transition-transform duration-[3500ms] ease-in-out"
                style={{ transform: `scale(${scale})` }}
            >
                <div className="absolute inset-0 bg-mystic-gold/5 rounded-full blur-xl"></div>
                <div className="w-40 h-40 rounded-full border border-mystic-gold/40 opacity-50 animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute text-mystic-gold font-serif tracking-[0.3em] text-sm uppercase opacity-80">
                    {text}
                </div>
            </div>
            <p className="mt-8 text-xs text-mystic-ethereal/40 font-sans tracking-[0.2em] uppercase">Sintonizando Frequência...</p>
        </div>
    );
}

// --- INTEGRATION TIMER COMPONENT ---
const IntegrationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [timeLeft, setTimeLeft] = useState(60);
    const [phase, setPhase] = useState("Respire");
    const totalTime = 60;
    
    // Circle Math
    const radius = 120;
    const circumference = 2 * Math.PI * radius; // approx 754

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    soundManager.playReveal(); // End chime
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Breathing cycle text
        const textTimer = setInterval(() => {
            setPhase(prev => prev === "Respire" ? "Integre" : "Respire");
        }, 5000);

        return () => { clearInterval(timer); clearInterval(textTimer); }
    }, [onClose]);

    // Calculate offset: Start at 0 (Full), End at circumference (Empty)
    const strokeDashoffset = circumference * (1 - (timeLeft / totalTime));

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-fade-in">
             <div className="relative w-72 h-72 flex items-center justify-center">
                 {/* Glow behind */}
                 <div className="absolute inset-0 bg-mystic-gold/5 rounded-full blur-3xl animate-pulse-slow"></div>
                 
                 {/* Timer Text */}
                 <div className="absolute z-10 text-4xl font-serif text-mystic-gold tracking-widest">{timeLeft}</div>

                 <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
                     {/* Background Track */}
                     <circle 
                        cx="130" 
                        cy="130" 
                        r={radius} 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none" 
                        className="text-white/10" 
                     />
                     {/* Progress Bar */}
                     <circle 
                        cx="130" 
                        cy="130" 
                        r={radius} 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none" 
                        className="text-mystic-gold transition-all duration-1000 ease-linear" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                     />
                 </svg>
             </div>
             
             <h3 className="mt-12 text-2xl font-serif text-mystic-ethereal tracking-[0.4em] uppercase animate-pulse">{phase}</h3>
             <p className="mt-4 text-xs font-sans text-gray-500 tracking-[0.3em] uppercase">Permita que a verdade assente</p>
             
             <button onClick={onClose} className="mt-12 px-6 py-2 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/30 transition-colors">Encerrar Ritual</button>
        </div>
    );
};

// ---------------------------

const PortalView: React.FC<Props> = ({ portal, user, onClose, initialInput }) => {
  const [status, setStatus] = useState<'IDLE' | 'THINKING' | 'REVEALED'>('IDLE');
  const [inputVal, setInputVal] = useState('');
  const [imageVal, setImageVal] = useState<string | null>(null);
  const [locationVal, setLocationVal] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [response, setResponse] = useState('');
  
  // Follow Up State (Specific for Semente Estelar)
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFollowingUp, setIsFollowingUp] = useState(false);

  // Generated Image for Tarot and Visual Portals
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  
  // Audio State
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Integration Mode
  const [showIntegration, setShowIntegration] = useState(false);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null); // Ref for capturing image

  useEffect(() => {
    return () => {
      soundManager.stopTTS();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
            setInputVal(transcript);
        };
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (initialInput) {
        executeConsult(initialInput);
    } else if (portal.inputType === InputType.NONE) {
        handleConsult();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
      soundManager.playClick();
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          if (!recognitionRef.current) return alert("Seu navegador não suporta reconhecimento de voz.");
          setInputVal('');
          recognitionRef.current.start();
          setIsListening(true);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageVal(reader.result as string);
        soundManager.playReveal(); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationRequest = () => {
    soundManager.playClick();
    if (!navigator.geolocation) return alert("Geolocalização não suportada.");
    setStatus('THINKING');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
            setLocationVal(loc);
            executeConsult(undefined, undefined, loc);
        },
        (error) => {
            setStatus('IDLE');
            alert("Erro ao obter localização.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConsult = async () => executeConsult(inputVal || undefined, imageVal || undefined, locationVal);

  const executeConsult = async (text?: string, image?: string, loc?: {lat: number, lng: number}) => {
    setStatus('THINKING');
    soundManager.playClick();
    setAudioBase64(null);
    setGeneratedVisual(null);
    soundManager.stopTTS();
    setIsPlaying(false);
    setShowFollowUp(false);
    setFollowUpInput('');
    
    // RITUAL DELAY: Forced breathing time
    await new Promise(resolve => setTimeout(resolve, 8000));

    // --- PREPARATION LOGIC ---
    let finalText = initialInput ? initialInput : text;
    let visualSubject: string | null = null;

    // 1. TAROT LOGIC: Card Selection or Randomization
    if (portal.id === 'tarot') {
        if (!finalText || finalText === "Sorteio Aleatório") {
            // Flatten the deck and pick a random card if none provided or random selected
            const allCards = TAROT_DECK.flatMap(group => group.cards);
            const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
            finalText = `Carta sorteada: ${randomCard}`;
            visualSubject = `The Tarot card: ${randomCard}, mystical illustration, detailed, arcane`;
        } else {
            // Uses the provided card name (e.g. from Grimoire or User Selection)
            const cardName = finalText.replace('Carta escolhida: ', '').replace('Carta sorteada: ', '');
            visualSubject = `The Tarot card: ${cardName}, mystical illustration, detailed, arcane`;
        }
    }
    
    // 2. OTHER VISUAL PORTALS LOGIC
    else if (portal.id === 'semente_estelar' && finalText) {
        visualSubject = `Mystical cosmic art of ${finalText} starseed energy, nebula, space, divine light`;
    }
    else if (portal.id === 'elemento' && finalText) {
        visualSubject = `Mystical art representing the element ${finalText}, alchemy, ethereal nature`;
    }
    else if (portal.id === 'chakra' && finalText) {
        visualSubject = `Spiritual glowing energy of the ${finalText} chakra, sacred geometry`;
    }
    else if (portal.id === 'sonhos' && finalText) {
         visualSubject = `Surreal dreamscape interpreting: ${finalText.substring(0, 100)}, salvador dali style, ethereal`;
    }
    else if (portal.id === 'intencao' && finalText) {
         visualSubject = `Visual manifestation of the intention: ${finalText.substring(0, 100)}, glowing light, magic`;
    }
    else if (portal.id === 'sombra') {
         visualSubject = `The integration of shadow and light, jungian psychology art, eclipse, ethereal`;
    }

    // Parallel Execution
    const promises: Promise<any>[] = [
        generateOracleResponse(portal.promptContext, user, finalText, portal.title, image, loc)
    ];

    if (visualSubject) {
        promises.push(generateMysticImage(visualSubject));
    }

    const results = await Promise.all(promises);
    const resultText = results[0];
    const resultImage = visualSubject ? results[1] : null;

    if (resultImage) setGeneratedVisual(resultImage);

    const reading: Reading = {
      id: crypto.randomUUID(),
      portalId: portal.id,
      portalName: portal.title,
      timestamp: Date.now(),
      userInput: image ? '[Imagem enviada]' : loc ? `[Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}]` : finalText,
      response: resultText
    };

    saveReading(reading);
    setResponse(resultText);
    setStatus('REVEALED');
    soundManager.playReveal(); 
  };

  const handleFollowUpSubmit = async () => {
    if (!followUpInput) return;
    soundManager.playClick();
    setIsFollowingUp(true);
    soundManager.stopTTS();
    setIsPlaying(false);

    // Call API with context
    const followUpResponse = await generateOracleResponse(
        portal.promptContext,
        user,
        followUpInput, // New specific question
        portal.title,
        undefined,
        undefined,
        response // Pass previous reading as context
    );

    // Update response with the new part
    const newFullResponse = `${response}\n\n---\n\n## 🔮 Aprofundamento\n\n${followUpResponse}`;
    
    // Update local state
    setResponse(newFullResponse);
    
    // Save new reading history
    saveReading({
        id: crypto.randomUUID(),
        portalId: portal.id,
        portalName: portal.title,
        timestamp: Date.now(),
        userInput: `[Aprofundamento]: ${followUpInput}`,
        response: followUpResponse
    });

    setIsFollowingUp(false);
    setShowFollowUp(false);
    setFollowUpInput('');
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

  // --- MATERIALIZE CARD FEATURE ---
  const handleMaterialize = async () => {
      soundManager.playClick();
      if (!captureRef.current) return;

      try {
          const element = captureRef.current;
          // IMPORTANT: Do NOT use display:none. Use opacity or position fixed off-screen.
          // html2canvas cannot render display:none elements.
          // The element is already mounted but positioned off-screen via styles below.
          
          const canvas = await html2canvas(element, {
              backgroundColor: '#050406',
              scale: 2, // High res
              useCORS: true, // Needed for external images
              logging: false
          });
          
          const link = document.createElement('a');
          link.download = `Oraculo7_Insight_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          soundManager.playReveal(); // Success sound
      } catch (e) {
          console.error("Error materializing:", e);
          alert("Não foi possível materializar a lâmina. Tente novamente.");
      }
  };

  const handleCopy = () => {
    soundManager.playClick();
    const shareText = `ORÁCULO 7\nPortal: ${portal.title}\n\n"${response}"\n\nConsulte o oráculo.`;
    navigator.clipboard.writeText(shareText);
  };

  const handleBack = () => {
    soundManager.playClick();
    soundManager.stopTTS();
    setIsPlaying(false);
    if (status === 'REVEALED') {
      if (initialInput) onClose();
      else {
          setStatus('IDLE');
          setResponse('');
          setLocationVal(undefined); 
      }
    } else onClose();
  };

  const renderInput = () => {
    if (portal.inputType === InputType.SELECTION && portal.options) {
      // Tarot Grid Special Layout if options > 8
      if (portal.id === 'tarot') {
          return (
            <div className="w-full animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 mb-4">
                     {portal.options.map(opt => (
                        <button key={opt} onClick={() => { setInputVal(opt); soundManager.playHover(); }} className={`p-3 rounded-lg border text-xs transition-all duration-300 font-sans tracking-[0.1em] font-medium ${inputVal === opt ? 'bg-mystic-gold/10 border-mystic-gold/60 text-mystic-gold shadow-glow-gold' : 'bg-black/20 border-white/5 text-mystic-ethereal/60 hover:bg-white/5 hover:border-white/20'}`}>{opt}</button>
                    ))}
                </div>
                <button onClick={handleConsult} disabled={!inputVal} className={`w-full py-4 rounded-lg bg-mystic-gold text-mystic-dark font-serif font-bold tracking-[0.25em] hover:shadow-glow-gold transition-all duration-500 hover:scale-[1.01] ${!inputVal ? 'opacity-50 cursor-not-allowed' : ''}`}>CONFIRMAR</button>
            </div>
          );
      }
      
      return (
        <div className="grid grid-cols-2 gap-3 mt-8 animate-fade-in w-full">
          {portal.options.map(opt => (
            <button key={opt} onClick={() => { setInputVal(opt); soundManager.playHover(); }} className={`p-4 rounded-lg border text-sm transition-all duration-300 font-sans tracking-[0.1em] font-medium ${inputVal === opt ? 'bg-mystic-gold/10 border-mystic-gold/60 text-mystic-gold shadow-glow-gold' : 'bg-black/20 border-white/5 text-mystic-ethereal/60 hover:bg-white/5 hover:border-white/20'}`}>{opt}</button>
          ))}
          {inputVal && <button onClick={handleConsult} className="col-span-2 mt-6 py-4 rounded-lg bg-mystic-gold text-mystic-dark font-serif font-bold tracking-[0.25em] hover:shadow-glow-gold transition-all duration-500 hover:scale-[1.01]">CONFIRMAR</button>}
        </div>
      );
    }
    if (portal.inputType === InputType.TEXT) {
      const placeholderText = portal.id === 'intencao' ? "Descreva aqui sua intenção" : portal.id === 'sonhos' ? "Descreva seu sonho..." : "Escreva aqui sua inquietação...";
      return (
        <div className="mt-6 w-full animate-fade-in flex flex-col items-center">
          <div className="w-full relative group">
            <div className={`absolute inset-0 bg-gradient-to-b from-mystic-indigo/20 to-transparent transition-opacity duration-700 rounded-xl pointer-events-none ${isListening ? 'opacity-100 border border-mystic-gold/30' : 'opacity-0 group-hover:opacity-100'}`}></div>
            <textarea value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder={isListening ? "Ouvindo sua voz..." : placeholderText} className={`w-full bg-input-gradient border rounded-xl p-8 text-mystic-ethereal text-2xl font-reading italic leading-relaxed focus:outline-none focus:border-mystic-gold/40 focus:shadow-glow-gold transition-all duration-500 mb-6 min-h-[160px] placeholder-mystic-ethereal/20 resize-none shadow-inner-light ${isListening ? 'border-mystic-gold/50 shadow-glow-gold bg-mystic-gold/5' : 'border-white/10'}`}/>
            <div className="absolute bottom-10 right-4 z-20"><button onClick={toggleListening} className={`p-3 rounded-full transition-all duration-300 shadow-lg border backdrop-blur-md ${isListening ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse' : 'bg-black/40 border-white/10 text-mystic-gold/70 hover:text-mystic-gold hover:border-mystic-gold/40 hover:bg-mystic-gold/10'}`}><GetIcon name={isListening ? "MicOff" : "Mic"} className="w-5 h-5" /></button></div>
          </div>
          <button onClick={handleConsult} disabled={!inputVal} className={`w-full py-4 rounded-lg font-serif font-bold tracking-[0.25em] text-sm transition-all duration-500 ${inputVal ? 'bg-mystic-gold text-mystic-dark shadow-glow-gold hover:scale-[1.01]' : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'}`}>REFLETIR</button>
        </div>
      );
    }
    if (portal.inputType === InputType.DATE) {
        return (
            <div className="mt-8 w-full animate-fade-in flex flex-col items-center">
                 <label className="text-mystic-ethereal/50 font-sans tracking-[0.2em] uppercase text-xs mb-4">Selecione uma data para o cálculo</label>
                 <input 
                    type="date" 
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl py-6 px-4 text-center text-mystic-gold text-2xl font-reading focus:outline-none focus:border-mystic-gold/30 focus:shadow-glow-gold transition-all duration-500 [color-scheme:dark] uppercase tracking-widest cursor-pointer hover:bg-[#151515]"
                 />
                 <button onClick={handleConsult} disabled={!inputVal} className={`w-full mt-6 py-4 rounded-lg font-serif font-bold tracking-[0.25em] text-sm transition-all duration-500 ${inputVal ? 'bg-mystic-gold text-mystic-dark shadow-glow-gold hover:scale-[1.01]' : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'}`}>CALCULAR KIN</button>
            </div>
        );
    }
    if (portal.inputType === InputType.IMAGE) {
        return (
            <div className="mt-8 w-full animate-fade-in flex flex-col items-center">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                {!imageVal ? (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full h-56 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-mystic-ethereal/40 hover:border-mystic-gold/40 hover:bg-white/5 hover:text-mystic-gold transition-all group duration-500 bg-black/20"><GetIcon name="Camera" className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform opacity-70" /><span className="text-xs font-sans tracking-[0.2em] uppercase">Carregar Imagem</span></button>
                ) : (
                    <div className="relative w-full rounded-xl overflow-hidden border border-mystic-gold/20 shadow-glow-gold"><img src={imageVal} alt="Uploaded" className="w-full h-auto max-h-72 object-cover opacity-90" /><button onClick={() => setImageVal(null)} className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-red-900/80 transition-colors backdrop-blur-sm"><GetIcon name="X" className="w-4 h-4" /></button></div>
                )}
                <button onClick={handleConsult} disabled={!imageVal} className={`w-full mt-6 py-4 rounded-lg font-serif font-bold tracking-[0.25em] text-sm transition-all duration-500 ${imageVal ? 'bg-mystic-gold text-mystic-dark shadow-glow-gold hover:scale-[1.01]' : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'}`}>ANALISAR VISÃO</button>
            </div>
        );
    }
    if (portal.inputType === InputType.LOCATION) {
        return (
            <div className="mt-8 w-full animate-fade-in flex flex-col items-center">
                <button onClick={handleLocationRequest} className="group relative w-full py-8 rounded-xl border border-white/10 bg-input-gradient overflow-hidden transition-all duration-500 hover:shadow-glow-gold hover:border-mystic-gold/40">
                     <div className="absolute inset-0 bg-mystic-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="relative z-10 flex flex-col items-center gap-4"><div className="p-4 rounded-full bg-white/5 text-mystic-gold group-hover:scale-110 transition-transform border border-white/10"><GetIcon name="Compass" className="w-8 h-8" /></div><div className="flex flex-col items-center gap-1"><span className="font-serif tracking-[0.2em] text-mystic-ethereal text-sm group-hover:text-white transition-colors">SINTONIZAR LOCAL</span><span className="text-[10px] text-mystic-ethereal/40 font-sans uppercase">Requer GPS</span></div></div>
                </button>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {showIntegration && <IntegrationModal onClose={() => setShowIntegration(false)} />}
      
      <div className="absolute inset-0 bg-[#03000a]/95 backdrop-blur-3xl transition-opacity duration-1000"></div>
      
      <div className="absolute top-6 left-6 z-50">
        <button onClick={handleBack} className="p-3 rounded-full hover:bg-white/5 text-mystic-ethereal/40 hover:text-white transition-colors"><span className="sr-only">Voltar</span><GetIcon name="ChevronLeft" className="w-6 h-6" /></button>
      </div>

      <div className="absolute top-6 right-6 z-50">
        <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-mystic-ethereal/40 hover:text-white transition-colors"><span className="sr-only">Fechar</span><GetIcon name="X" className="w-6 h-6" /></button>
      </div>

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
        
        <div className={`mb-6 transition-all duration-1000 transform ${status === 'THINKING' ? 'scale-110 mb-10' : 'scale-100'}`}>
          {status === 'THINKING' ? (
               <RitualBreath variant={portal.id === 'sombra' ? 'shadow' : 'gold'} />
          ) : (
             <div className="p-5 rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-[0_0_30px_rgba(0,0,0,0.5)] relative">
               <GetIcon name={portal.icon} className="w-10 h-10 text-mystic-gold relative z-10 opacity-90" />
             </div>
          )}
        </div>

        {status !== 'REVEALED' && status !== 'THINKING' && (
            <>
                <h2 className="text-3xl font-serif text-mystic-ethereal tracking-[0.25em] mb-3 text-center drop-shadow-md">{portal.title}</h2>
                <p className="text-mystic-ethereal/50 font-sans text-sm font-light text-center mb-8 tracking-[0.1em] uppercase max-w-xs">{portal.description}</p>
            </>
        )}

        {status === 'IDLE' && (
           <div className="w-full">
             {renderInput()}
             {portal.inputType === InputType.NONE && !initialInput && <div className="text-center text-mystic-indigo animate-pulse font-serif tracking-[0.3em] text-xs mt-10 uppercase">Abrindo portal...</div>}
             {initialInput && <div className="text-center text-mystic-gold animate-pulse font-serif tracking-[0.3em] text-xs mt-10 uppercase">Invocando {initialInput}...</div>}
           </div>
        )}

        {status === 'REVEALED' && (
          <div className="glass-panel w-full rounded-2xl border-t border-white/10 shadow-2xl animate-fade-in relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent"></div>
             
             <div className="bg-[#08051a]/60 backdrop-blur-xl p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* Generative Visual Display */}
                {generatedVisual && (
                    <div className="mb-8 rounded-xl overflow-hidden border border-mystic-gold/30 shadow-glow-gold relative animate-fade-in">
                        <img src={generatedVisual} alt="Visão Mística Gerada" className="w-full h-auto object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <span className="text-xs text-mystic-gold font-sans tracking-widest uppercase">Visão do Portal</span>
                        </div>
                    </div>
                )}

                <TypingEffect text={response} speed={30} className="text-base md:text-lg text-justify leading-relaxed" />
                
                {/* --- FOLLOW-UP SECTION FOR SEMENTE ESTELAR --- */}
                {portal.id === 'semente_estelar' && !showFollowUp && !isFollowingUp && (
                   <div className="mt-8 pt-6 border-t border-white/5 text-center animate-fade-in" style={{animationDelay: '3s'}}>
                       <button 
                           onClick={() => setShowFollowUp(true)}
                           className="text-xs font-serif tracking-[0.2em] text-mystic-gold hover:text-white transition-colors uppercase border border-mystic-gold/30 px-6 py-3 rounded-full hover:bg-mystic-gold/10"
                       >
                           + Aprofundar Conexão
                       </button>
                   </div>
                )}

                {showFollowUp && (
                    <div className="mt-8 pt-6 border-t border-white/5 animate-fade-in">
                         <label className="block text-[10px] font-sans tracking-widest text-mystic-ethereal/50 uppercase mb-3 text-center">O que deseja perguntar sobre sua origem?</label>
                         <div className="relative">
                            <textarea 
                                value={followUpInput}
                                onChange={(e) => setFollowUpInput(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-mystic-ethereal text-sm font-reading focus:border-mystic-gold/50 focus:outline-none resize-none"
                                rows={2}
                                placeholder="Ex: Qual meu propósito aqui?..."
                            />
                            <button 
                                onClick={handleFollowUpSubmit}
                                disabled={!followUpInput}
                                className="absolute bottom-2 right-2 p-2 rounded-full bg-mystic-gold/20 hover:bg-mystic-gold/40 text-mystic-gold disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <GetIcon name="ArrowRight" className="w-4 h-4" />
                            </button>
                         </div>
                    </div>
                )}

                {isFollowingUp && (
                    <div className="mt-8 text-center animate-pulse">
                         <span className="text-[10px] font-sans tracking-widest text-mystic-gold uppercase">Consultando os Arquivos...</span>
                    </div>
                )}
                {/* --------------------------------------------- */}

                <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in border-t border-white/5 pt-8" style={{animationDelay: '1.5s'}}>
                    <button onClick={toggleAudio} disabled={generatingAudio} className={`relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all text-[10px] font-sans tracking-[0.2em] uppercase ${isPlaying ? 'bg-mystic-gold/10 border-mystic-gold text-mystic-gold animate-pulse' : generatingAudio ? 'bg-white/5 border-white/10 text-white/50 cursor-wait' : 'border-white/20 text-mystic-ethereal/70 hover:bg-white/5 hover:text-mystic-gold hover:border-mystic-gold/30'}`}>{generatingAudio ? <><GetIcon name="RefreshCw" className="w-3 h-3 animate-spin" /><span>Gerando Voz...</span></> : <>{isPlaying ? <div className="w-2 h-2 bg-mystic-gold rounded-sm" /> : <GetIcon name="Volume2" className="w-3 h-3" />}<span>{isPlaying ? 'Silenciar' : 'Ouvir'}</span></>}</button>
                    <button onClick={handleMaterialize} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-mystic-ethereal/70 hover:text-white hover:border-white/40 transition-all text-[10px] font-sans tracking-[0.2em] uppercase hover:bg-white/5"><GetIcon name="Camera" className="w-3 h-3" /><span>Materializar</span></button>
                    <button onClick={() => setShowIntegration(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-mystic-ethereal/70 hover:text-white hover:border-white/40 transition-all text-[10px] font-sans tracking-[0.2em] uppercase hover:bg-white/5"><GetIcon name="CircleDot" className="w-3 h-3" /><span>Integrar</span></button>
                </div>

                <div className="mt-6 flex justify-center">
                   <button onClick={onClose} className="text-[10px] text-mystic-indigo hover:text-mystic-ethereal transition-colors uppercase tracking-[0.2em] font-sans opacity-60 hover:opacity-100">Fechar Portal</button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Hidden Card Structure for Export - Fixed position off-screen so html2canvas can render it */}
      <div ref={captureRef} style={{ position: 'fixed', left: '-9999px', top: '0', width: '540px', height: '960px', backgroundColor: '#050406', zIndex: -10 }} className="flex flex-col items-center justify-between p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-black to-[#050406]"></div>
          <div className="relative z-10 w-full h-full flex flex-col items-center">
              <div className="mt-8 mb-6">
                  <h1 className="font-serif text-3xl text-mystic-gold tracking-[0.4em] uppercase">Oráculo<span className="font-light">7</span></h1>
                  <div className="w-12 h-[1px] bg-mystic-gold/50 mx-auto mt-2"></div>
              </div>
              
              {generatedVisual ? (
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-mystic-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.2)] mb-8">
                      <img src={generatedVisual} className="w-full h-full object-cover" alt="Vision" />
                  </div>
              ) : (
                  <div className="w-full aspect-[3/4] rounded-xl border border-mystic-gold/20 flex items-center justify-center mb-8 bg-white/5">
                      <GetIcon name={portal.icon} className="w-24 h-24 text-mystic-gold opacity-50" />
                  </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center">
                   <p className="font-serif text-mystic-gold/80 text-sm tracking-[0.3em] uppercase mb-4">{portal.title}</p>
                   <p className="font-reading text-2xl text-mystic-ethereal italic leading-relaxed px-4 line-clamp-6">
                       "{response.split('\n')[0].replace(/\*\*/g, '').substring(0, 150)}..."
                   </p>
              </div>

              <div className="mt-8 text-[10px] font-sans tracking-[0.4em] text-gray-500 uppercase">
                  oraculo7.com.br
              </div>
          </div>
      </div>
    </div>
  );
};

export default PortalView;