import React, { useState, useEffect, useRef } from 'react';
import { PortalConfig, InputType, UserProfile, Reading } from '../types';
import { GetIcon } from './Icons';
import { generateOracleResponse, generateAudioReading, generateMysticImage, calculateTzolkinKin } from '../services/geminiService';
import { saveReading } from '../services/storage';
import { soundManager } from '../services/soundService';
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
        // Shadow Portal Specific Loader: The Eclipse
        const shadowText = text === "Inspire..." ? "Encare..." : text === "Segure..." ? "Sustente..." : "Integre...";
        
        return (
            <div className="flex flex-col items-center justify-center animate-fade-in z-20">
                <div 
                    className="relative w-56 h-56 flex items-center justify-center transition-transform duration-[3500ms] ease-in-out"
                    style={{ transform: `scale(${scale})` }}
                >
                    {/* Outer Chaos Ring - Counter Spin */}
                    <div className="absolute inset-0 rounded-full border border-gray-800/40 border-t-white/10 animate-[spin_12s_linear_infinite_reverse]"></div>
                    
                    {/* Inner Focus Ring - Fast Spin (Loading Indicator) */}
                    <div className="absolute inset-4 rounded-full border-[1px] border-transparent border-t-mystic-gold/40 border-r-mystic-gold/10 animate-[spin_3s_linear_infinite]"></div>

                    {/* The Void Core */}
                    <div className="absolute inset-8 rounded-full bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-900 flex items-center justify-center z-10 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(30,30,30,0.8)_0%,_#000000_100%)]"></div>
                        
                        {/* Pulsing Shadow Heart */}
                        <div className="w-20 h-20 bg-black rounded-full shadow-[0_0_20px_rgba(0,0,0,1)] animate-pulse border border-white/5"></div>
                        
                        {/* Text Overlay */}
                        <div className="absolute text-gray-500 font-serif tracking-[0.4em] text-[9px] uppercase opacity-80 mix-blend-screen z-20">
                            {shadowText}
                        </div>
                    </div>

                    {/* Ethereal Smoke/Glow behind */}
                    <div className="absolute inset-6 rounded-full bg-mystic-gold/5 blur-xl animate-pulse-slow"></div>
                </div>
                
                <div className="mt-10 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-gray-500 font-sans tracking-[0.3em] uppercase animate-pulse">
                        Acessando o Inconsciente
                    </span>
                    <div className="flex gap-1">
                        <span className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                </div>
            </div>
        );
    }

    // Default Gold Variant (Standard Breathwork)
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

// --- AUDIO VISUALIZER COMPONENT ---
const AudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-8">
            <div className={`flex items-center gap-1.5 h-16 ${isPlaying ? '' : 'opacity-30 grayscale'}`}>
                 {[...Array(9)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 bg-mystic-gold rounded-full transition-all duration-300 ${isPlaying ? 'animate-[pulse_1s_ease-in-out_infinite]' : 'h-1'}`}
                        style={{ 
                            height: isPlaying ? `${Math.random() * 40 + 10}px` : '4px',
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: `${0.6 + Math.random() * 0.5}s`
                        }}
                    ></div>
                 ))}
            </div>
            
            <p className="text-[10px] font-serif tracking-[0.3em] uppercase text-mystic-gold/80 animate-pulse">
                {isPlaying ? "Oráculo Falando..." : "Sintonizando Voz..."}
            </p>
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
    setGeneratingAudio(true); // Indicate we are preparing audio early
    
    // RITUAL DELAY: Forced breathing time
    await new Promise(resolve => setTimeout(resolve, 8000));

    // --- PREPARATION LOGIC ---
    let finalText = initialInput ? initialInput : text;
    let visualSubject: string | null = null;

    // 1. TAROT LOGIC
    if (portal.id === 'tarot') {
        const aestheticStyle = "ancient gold and obsidian tarot card style, masterpiece, cinematic lighting, ethereal mist, divine atmosphere, intricate details, mystical symbols, high contrast. Colors: Deep Black, Gold, Amber.";

        if (!finalText || finalText === "Sorteio Aleatório") {
            const allCards = TAROT_DECK.flatMap(group => group.cards);
            const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
            finalText = `Carta sorteada: ${randomCard}`;
            // Visual Prompt for Random Card
            visualSubject = `Visual interpretation of the Tarot Card archetype '${randomCard}'. ${aestheticStyle}`;
        } else {
            const cardName = finalText.replace('Carta escolhida: ', '').replace('Carta sorteada: ', '');
            // Visual Prompt for Selected Card
            visualSubject = `Visual interpretation of the Tarot Card archetype '${cardName}'. ${aestheticStyle}`;
        }
    }
    
    // 2. OTHER VISUAL PORTALS LOGIC
    else if (portal.id === 'semente_estelar' && finalText) {
        // Starseed Fix: Map long sentences to simple visual keywords to avoid token overflow/confusion
        const starseedMap: Record<string, string> = {
            'saudade': 'distant blue star glowing in dark space, solitude, cosmic yearning',
            'missão': 'golden light healing earth from space, divine hands, spiritual energy',
            'lógica': 'sacred geometry blue patterns, futuristic technology, arcturian vibes',
            'guerreiro': 'sword of light in cosmos, galactic guardian, stern face',
            'observador': 'giant eye in the nebula, watching silently, purple clouds',
            'memórias': 'ancient crystal city atlantis underwater glowing, sci-fi ancient',
            'liberdade': 'bird of light flying in space, breaking chains, supernova',
            'deslocado': 'lone silhouette staring at stars on alien planet, purple sky'
        };
        
        let keyword = 'cosmic energy, nebula, stars';
        for (const [key, value] of Object.entries(starseedMap)) {
            if (finalText.toLowerCase().includes(key)) {
                keyword = value;
                break;
            }
        }
        visualSubject = `Mystical cosmic art: ${keyword}. High quality, ethereal, cinematic lighting.`;
    }
    else if (portal.id === 'elemento' && finalText) {
        visualSubject = `Mystical art representing the element ${finalText}, alchemy symbol, ethereal nature, elemental energy`;
    }
    else if (portal.id === 'chakra' && finalText) {
        visualSubject = `Spiritual glowing energy of the ${finalText} chakra, lotus flower, sacred geometry, vibration`;
    }
    else if (portal.id === 'sonhos' && finalText) {
         visualSubject = `Surreal dreamscape interpreting: ${finalText.substring(0, 100)}, salvador dali style, ethereal, mist, dream world`;
    }
    else if (portal.id === 'intencao' && finalText) {
         visualSubject = `Visual manifestation of the intention: ${finalText.substring(0, 100)}, glowing light orb, magic, sparkles`;
    }
    else if (portal.id === 'sombra') {
         visualSubject = `The integration of shadow and light, jungian psychology art, eclipse, ethereal, dark and gold contrast`;
    }
    else if (portal.id === 'tzolkin' && finalText) {
         const kinData = calculateTzolkinKin(finalText);
         if (kinData) {
            // Translating colors/context for better image generation prompts
            // Creates a "Dark Luxo" version of the Glyph
            visualSubject = `A masterpiece 3D render of the Mayan Glyph '${kinData.seal}' glowing in ethereal ${kinData.color} energy. The glyph is carved into a polished black obsidian monolith with intricate antique gold inlays. Cinematic lighting, dark void background with floating dust particles, mystical atmosphere, hyper-realistic, 8k resolution.`;
         } else {
            visualSubject = `Ancient Mayan Tzolkin Calendar wheel carved in black obsidian with glowing gold details, cinematic lighting, mystical atmosphere.`;
         }
    }
    else if (portal.id === 'numeros') {
         visualSubject = `Sacred geometry pattern representing divine mathematics, golden ratio, fibonacci spiral, glowing lines in dark void`;
    }
    else if (portal.id === 'peregrinacao') {
         visualSubject = `Atmospheric concept art of a hidden sacred temple, spiritual sanctuary, misty forest or mountain, mystical light beams`;
    }
    else if (portal.id === 'vibracao' && finalText) {
         visualSubject = `Abstract aura photography representing the emotion: ${finalText}, ethereal color waves, spiritual energy field`;
    }
    else if (portal.id === 'oraculo') {
         visualSubject = `Abstract ethereal light, divine spark in the void, golden particles, moment of revelation, cinematic lighting, mystical atmosphere`;
    }
    else if (portal.id === 'ciclo') {
         visualSubject = `Symbol of the Ouroboros, golden snake eating its tail, infinity loop, phases of the moon, spiral time, dark background`;
    }
    else if (portal.id === 'mapa') {
         visualSubject = `Ancient celestial map, golden zodiac constellations, astral chart, nebula background, sacred geometry of the stars`;
    }

    // Parallel Execution of Text and Image
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

    // CRITICAL FIX: Safe UUID
    const safeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `portal-${Date.now()}`;

    const reading: Reading = {
      id: safeId,
      portalId: portal.id,
      portalName: portal.title,
      timestamp: Date.now(),
      userInput: image ? '[Imagem enviada]' : loc ? `[Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}]` : finalText,
      response: resultText
    };

    saveReading(reading);
    setResponse(resultText);
    
    // AUTO AUDIO GENERATION
    const audio = await generateAudioReading(resultText);
    if (audio) {
        setAudioBase64(audio);
        setIsPlaying(true);
        soundManager.playTTS(audio, () => setIsPlaying(false));
    }
    setGeneratingAudio(false);

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
    
    // Safe ID
    const safeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `followup-${Date.now()}`;

    // Save new reading history
    saveReading({
        id: safeId,
        portalId: portal.id,
        portalName: portal.title,
        timestamp: Date.now(),
        userInput: `[Aprofundamento]: ${followUpInput}`,
        response: followUpResponse
    });

    // Auto play ONLY the new part
    setGeneratingAudio(true);
    const audio = await generateAudioReading(followUpResponse);
    if (audio) {
        setAudioBase64(audio);
        setIsPlaying(true);
        soundManager.playTTS(audio, () => setIsPlaying(false));
    }
    setGeneratingAudio(false);

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

  const handleDownloadAudio = () => {
      if (!audioBase64) return;
      soundManager.playClick();
      try {
          const blob = soundManager.createWavBlob(audioBase64);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Oraculo7_Voz_${Date.now()}.wav`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Download failed", e);
      }
  };

  // --- MATERIALIZE CARD FEATURE ---
  const handleMaterialize = async () => {
      soundManager.playClick();
      if (!captureRef.current) return;

      try {
          const element = captureRef.current;
          const canvas = await html2canvas(element, {
              backgroundColor: '#030005',
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
            <textarea value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder={isListening ? "Ouvindo sua voz..." : placeholderText} className={`w-full input-mirror rounded-xl p-8 text-mystic-ethereal text-2xl font-reading italic leading-relaxed focus:outline-none focus:border-mystic-gold/40 focus:shadow-glow-gold transition-all duration-500 mb-6 min-h-[160px] placeholder-mystic-ethereal/20 resize-none ${isListening ? 'border-mystic-gold/50 shadow-glow-gold bg-mystic-gold/5' : 'border-white/10'}`}/>
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
                    className="w-full bg-[#030005] border border-white/10 rounded-xl py-6 px-4 text-center text-mystic-gold text-2xl font-reading focus:outline-none focus:border-mystic-gold/30 focus:shadow-glow-gold transition-all duration-500 [color-scheme:dark] uppercase tracking-widest cursor-pointer hover:bg-[#0a050e]"
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
      
      <div className="absolute inset-0 bg-[#030005]/98 backdrop-blur-3xl transition-opacity duration-1000"></div>
      
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
             <div className="relative group cursor-default">
                 {/* 1. Breathing Back Glow */}
                 <div className="absolute inset-0 bg-mystic-gold/20 rounded-full blur-[30px] animate-pulse-slow"></div>

                 {/* 2. Rotating Energy Ring - Very Subtle */}
                 <div className="absolute -inset-1 rounded-full border border-mystic-gold/10 border-t-mystic-gold/30 animate-[spin_12s_linear_infinite] opacity-50"></div>

                 {/* 3. Container */}
                 <div className="relative p-5 rounded-full border border-white/10 bg-[#0a050e] shadow-2xl overflow-hidden">
                     
                     {/* 4. Subtle Inner Gradient (Ethereal Sheen) */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-mystic-gold/5 to-transparent opacity-50 animate-pulse-slow"></div>

                     {/* 5. The Icon */}
                     <GetIcon 
                       name={portal.icon} 
                       className="w-10 h-10 text-mystic-gold relative z-10 opacity-90 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-transform duration-1000 group-hover:scale-105" 
                     />
                 </div>
             </div>
          )}
        </div>

        {status !== 'REVEALED' && status !== 'THINKING' && (
            <>
                <h2 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-white via-mystic-gold to-mystic-amber tracking-[0.25em] mb-4 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium animate-fade-in">{portal.title}</h2>
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent mb-6 animate-fade-in"></div>
                <p className="text-mystic-ethereal/80 font-sans text-sm font-light text-center mb-8 tracking-[0.15em] uppercase max-w-xs leading-relaxed animate-fade-in" style={{animationDelay: '0.1s'}}>{portal.description}</p>
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
          <div className="glass-panel w-full rounded-2xl border-t border-white/10 shadow-void-depth animate-fade-in relative overflow-hidden bg-opacity-40">
             <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-mystic-gold/50 to-transparent"></div>
             
             <div className="bg-[#030005]/80 backdrop-blur-xl p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* Generative Visual Display - Materialization Effect */}
                {generatedVisual && (
                    <div className="mb-8 rounded-xl overflow-hidden border border-mystic-gold/30 shadow-glow-gold relative animate-fade-in group">
                        <img src={generatedVisual} alt="Visão Mística Gerada" className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-[10px] text-mystic-gold/80 font-serif tracking-[0.3em] uppercase drop-shadow-md border border-mystic-gold/20 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">Visão Materializada</span>
                        </div>
                    </div>
                )}

                {/* AUDIO ONLY INTERFACE - TEXT REMOVED */}
                <div className="py-8 flex flex-col items-center">
                    {generatingAudio ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <GetIcon name="RefreshCw" className="w-8 h-8 text-mystic-gold/50 animate-spin" />
                            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-mystic-gold/50">Materializando Voz...</span>
                        </div>
                    ) : (
                        <AudioVisualizer isPlaying={isPlaying} />
                    )}
                </div>

                {/* --- FOLLOW-UP SECTION FOR SEMENTE ESTELAR --- */}
                {portal.id === 'semente_estelar' && !showFollowUp && !isFollowingUp && !generatingAudio && (
                   <div className="mt-8 pt-6 border-t border-white/5 text-center animate-fade-in" style={{animationDelay: '1s'}}>
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
                    <button onClick={toggleAudio} disabled={generatingAudio} className={`relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all text-[10px] font-sans tracking-[0.2em] uppercase ${isPlaying ? 'bg-mystic-gold/10 border-mystic-gold text-mystic-gold animate-pulse' : generatingAudio ? 'bg-white/5 border-white/10 text-white/50 cursor-wait' : 'border-white/20 text-mystic-ethereal/70 hover:bg-white/5 hover:text-mystic-gold hover:border-mystic-gold/30'}`}>{generatingAudio ? <><GetIcon name="RefreshCw" className="w-3 h-3 animate-spin" /><span>Gerando...</span></> : <>{isPlaying ? <div className="w-2 h-2 bg-mystic-gold rounded-sm" /> : <GetIcon name="Volume2" className="w-3 h-3" />}<span>{isPlaying ? 'Pausar' : 'Ouvir Novamente'}</span></>}</button>
                    
                    <button onClick={handleDownloadAudio} disabled={!audioBase64 || generatingAudio} className={`flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-mystic-ethereal/70 hover:text-white hover:border-white/40 transition-all text-[10px] font-sans tracking-[0.2em] uppercase hover:bg-white/5 ${!audioBase64 ? 'opacity-50 cursor-not-allowed' : ''}`}><GetIcon name="Download" className="w-3 h-3" /><span>Baixar Voz</span></button>
                    
                    <button onClick={handleMaterialize} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-mystic-ethereal/70 hover:text-white hover:border-white/40 transition-all text-[10px] font-sans tracking-[0.2em] uppercase hover:bg-white/5"><GetIcon name="Camera" className="w-3 h-3" /><span>Materializar</span></button>
                </div>

                <div className="mt-6 flex justify-center">
                   <button onClick={onClose} className="text-[10px] text-mystic-indigo hover:text-mystic-ethereal transition-colors uppercase tracking-[0.2em] font-sans opacity-60 hover:opacity-100">Fechar Portal</button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Hidden Card Structure for Export - Refined for Audio-First Look */}
      <div ref={captureRef} style={{ position: 'fixed', left: '-9999px', top: '0', width: '540px', height: '960px', backgroundColor: '#030005', zIndex: -10 }} className="flex flex-col items-center justify-between p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a050e] via-black to-[#030005]"></div>
          
          {/* Border Decoration */}
          <div className="absolute inset-4 border border-mystic-gold/20 rounded-2xl pointer-events-none"></div>

          <div className="relative z-10 w-full h-full flex flex-col items-center">
              <div className="mt-10 mb-6">
                  <h1 className="font-serif text-3xl text-mystic-gold tracking-[0.4em] uppercase">Oráculo<span className="font-light">7</span></h1>
                  <div className="w-12 h-[1px] bg-mystic-gold/50 mx-auto mt-2"></div>
              </div>
              
              {generatedVisual ? (
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-mystic-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.2)] mb-8 relative">
                      <img src={generatedVisual} className="w-full h-full object-cover" alt="Vision" />
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                  </div>
              ) : (
                  <div className="w-full aspect-[3/4] rounded-xl border border-mystic-gold/20 flex items-center justify-center mb-8 bg-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.1)_0%,_transparent_70%)] opacity-30"></div>
                      <GetIcon name={portal.icon} className="w-24 h-24 text-mystic-gold opacity-50 relative z-10" />
                  </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center w-full">
                   <p className="font-serif text-mystic-gold/60 text-xs tracking-[0.3em] uppercase mb-4">{portal.title} • Frequência</p>
                   
                   {/* Sound Wave Representation */}
                   <div className="flex justify-center items-center gap-1 h-8 mb-6 opacity-70">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="w-1 bg-mystic-gold rounded-full" style={{ height: `${Math.random() * 20 + 5}px` }}></div>
                        ))}
                   </div>

                   <div className="relative">
                       <span className="absolute -top-4 -left-2 text-4xl text-mystic-gold/20 font-serif">“</span>
                       <p className="font-reading text-xl text-mystic-ethereal italic leading-relaxed px-4 text-center">
                           {/* Capture just the first meaningful sentence/paragraph for impact */}
                           {response.replace(/\*\*/g, '').replace(/^#+\s.*$/gm, '').trim().split('\n').filter(l => l.length > 30)[0] || "A sabedoria foi revelada."}
                       </p>
                       <span className="absolute -bottom-6 -right-2 text-4xl text-mystic-gold/20 font-serif transform rotate-180">“</span>
                   </div>
              </div>

              <div className="mt-12 text-[9px] font-sans tracking-[0.4em] text-gray-500 uppercase flex items-center gap-2">
                  <span className="w-1 h-1 bg-mystic-gold/50 rounded-full"></span>
                  oraculo7.com.br
                  <span className="w-1 h-1 bg-mystic-gold/50 rounded-full"></span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PortalView;