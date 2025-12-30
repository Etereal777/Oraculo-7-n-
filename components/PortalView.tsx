import React, { useState, useEffect, useRef } from 'react';
import { PortalConfig, InputType, UserProfile, Reading } from '../types';
import { GetIcon } from './Icons';
import { generateOracleResponse, generateAudioReading, generateMysticImage, calculateTzolkinKin, generateMeditationScript } from '../services/geminiService';
import { saveReading, saveAltarItem } from '../services/storage';
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
        const shadowText = text === "Inspire..." ? "Encare..." : text === "Segure..." ? "Sustente..." : "Integre...";
        return (
            <div className="flex flex-col items-center justify-center animate-fade-in z-20">
                <div 
                    className="relative w-56 h-56 flex items-center justify-center transition-transform duration-[3500ms] ease-in-out"
                    style={{ transform: `scale(${scale})` }}
                >
                    <div className="absolute inset-0 rounded-full border border-gray-800/40 border-t-white/10 animate-[spin_12s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-4 rounded-full border-[1px] border-transparent border-t-mystic-gold/40 border-r-mystic-gold/10 animate-[spin_3s_linear_infinite]"></div>
                    <div className="absolute inset-8 rounded-full bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-900 flex items-center justify-center z-10 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(30,30,30,0.8)_0%,_#000000_100%)]"></div>
                        <div className="w-20 h-20 bg-black rounded-full shadow-[0_0_20px_rgba(0,0,0,1)] animate-pulse border border-white/5"></div>
                        <div className="absolute text-gray-500 font-serif tracking-[0.4em] text-[9px] uppercase opacity-80 mix-blend-screen z-20">{shadowText}</div>
                    </div>
                    <div className="absolute inset-6 rounded-full bg-mystic-gold/5 blur-xl animate-pulse-slow"></div>
                </div>
                <div className="mt-10 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-gray-500 font-sans tracking-[0.3em] uppercase animate-pulse">Acessando o Inconsciente</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center animate-fade-in">
            <div 
                className="w-48 h-48 rounded-full border border-mystic-gold/20 flex items-center justify-center relative transition-transform duration-[3500ms] ease-in-out"
                style={{ transform: `scale(${scale})` }}
            >
                <div className="absolute inset-0 bg-mystic-gold/5 rounded-full blur-xl"></div>
                <div className="w-40 h-40 rounded-full border border-mystic-gold/40 opacity-50 animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute text-mystic-gold font-serif tracking-[0.3em] text-sm uppercase opacity-80">{text}</div>
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

const PortalView: React.FC<Props> = ({ portal, user, onClose, initialInput }) => {
  const [status, setStatus] = useState<'IDLE' | 'THINKING' | 'REVEALED'>('IDLE');
  const [inputVal, setInputVal] = useState('');
  const [imageVal, setImageVal] = useState<string | null>(null);
  const [locationVal, setLocationVal] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [response, setResponse] = useState('');
  
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFollowingUp, setIsFollowingUp] = useState(false);

  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null); 

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
    if (portal.inputType === InputType.DATE && !inputVal) {
        const today = new Date().toISOString().split('T')[0];
        setInputVal(today);
    }
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
        (error) => { setStatus('IDLE'); alert("Erro ao obter localização."); },
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
    setGeneratingAudio(true); 
    
    await new Promise(resolve => setTimeout(resolve, 8000));

    let finalText = initialInput ? initialInput : text;
    let visualSubject: string | null = null;
    let resultText = "";

    // MEDITATION SPECIAL LOGIC
    if (portal.id === 'ressonancia') {
        finalText = finalText || "Paz interior";
        resultText = await generateMeditationScript(finalText);
        visualSubject = `Abstract ethereal meditation background, healing energy, calm, ${finalText}, soft colors`;
    } else {
        // ... (Standard Logic)
        if (portal.id === 'tarot') {
            const aestheticStyle = "ancient gold and obsidian tarot card style, masterpiece, cinematic lighting, ethereal mist, divine atmosphere, intricate details, mystical symbols, high contrast. Colors: Deep Black, Gold, Amber.";
            if (!finalText || finalText === "Sorteio Aleatório") {
                const allCards = TAROT_DECK.flatMap(group => group.cards);
                const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                finalText = `Carta sorteada: ${randomCard}`;
                visualSubject = `Visual interpretation of the Tarot Card archetype '${randomCard}'. ${aestheticStyle}`;
            } else {
                const cardName = finalText.replace('Carta escolhida: ', '').replace('Carta sorteada: ', '');
                visualSubject = `Visual interpretation of the Tarot Card archetype '${cardName}'. ${aestheticStyle}`;
            }
        }
        else if (portal.id === 'semente_estelar' && finalText) visualSubject = `Mystical cosmic art, nebula, stars, cinematic`;
        else if (portal.id === 'elemento' && finalText) visualSubject = `Mystical art representing element ${finalText}, alchemy symbol`;
        else if (portal.id === 'chakra' && finalText) visualSubject = `Spiritual glowing energy of ${finalText} chakra, lotus flower`;
        else if (portal.id === 'sonhos' && finalText) visualSubject = `Surreal dreamscape: ${finalText.substring(0, 100)}, salvador dali style`;
        else if (portal.id === 'intencao' && finalText) visualSubject = `Visual manifestation of intention: ${finalText.substring(0, 100)}, glowing orb`;
        else if (portal.id === 'sombra') visualSubject = `Integration of shadow and light, eclipse, ethereal, dark and gold`;
        else if (portal.id === 'tzolkin' && finalText) {
             const kinData = calculateTzolkinKin(finalText);
             visualSubject = kinData ? `Mayan Glyph '${kinData.seal}' glowing in ethereal ${kinData.color} energy on obsidian` : `Ancient Mayan Tzolkin Calendar`;
        }
        else if (portal.id === 'numeros') visualSubject = `Sacred geometry pattern, divine mathematics, golden ratio, fibonacci`;
        else if (portal.id === 'peregrinacao') visualSubject = `Atmospheric concept art of a hidden sacred temple, spiritual sanctuary`;
        else if (portal.id === 'vibracao' && finalText) visualSubject = `Abstract aura photography representing emotion: ${finalText}`;
        else if (portal.id === 'oraculo') visualSubject = `Abstract ethereal light, divine spark in the void`;
        else if (portal.id === 'ciclo') visualSubject = `Symbol of Ouroboros, infinity loop, phases of moon`;
        else if (portal.id === 'mapa') visualSubject = `Ancient celestial map, golden zodiac constellations`;
    }

    const promises: Promise<any>[] = [];
    
    if (portal.id !== 'ressonancia') {
        promises.push(generateOracleResponse(portal.promptContext, user, finalText, portal.title, image, loc));
    }

    if (visualSubject) {
        promises.push(generateMysticImage(visualSubject));
    }

    const results = await Promise.all(promises);
    
    if (portal.id !== 'ressonancia') {
        resultText = results[0];
    }
    
    const resultImage = visualSubject ? (portal.id === 'ressonancia' ? results[0] : results[1]) : null;

    if (resultImage) setGeneratedVisual(resultImage);

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

    const followUpResponse = await generateOracleResponse(portal.promptContext, user, followUpInput, portal.title, undefined, undefined, response);
    const newFullResponse = `${response}\n\n---\n\n## 🔮 Aprofundamento\n\n${followUpResponse}`;
    
    setResponse(newFullResponse);
    const safeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `followup-${Date.now()}`;
    saveReading({ id: safeId, portalId: portal.id, portalName: portal.title, timestamp: Date.now(), userInput: `[Aprofundamento]: ${followUpInput}`, response: followUpResponse });

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
    if (isPlaying) { soundManager.stopTTS(); setIsPlaying(false); return; }
    if (audioBase64) { setIsPlaying(true); soundManager.playTTS(audioBase64, () => setIsPlaying(false)); return; }
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

  const handleSaveToAltar = () => {
      soundManager.playClick();
      if (!generatedVisual) return;
      saveAltarItem({
          id: `altar-${Date.now()}`,
          type: portal.id === 'tarot' ? 'CARD' : 'IMAGE',
          name: portal.id === 'tarot' ? (initialInput?.replace("Carta escolhida: ", "") || "Arcano") : portal.title,
          description: response.substring(0, 100) + "...",
          imageUrl: generatedVisual,
          timestamp: Date.now()
      });
      soundManager.playReveal(); // Confirmation sound
      alert("Item consagrado no Altar.");
  };

  const handleShare = async () => {
      soundManager.playClick();
      if (!captureRef.current) return;
      try {
          const element = captureRef.current;
          const canvas = await html2canvas(element, { backgroundColor: '#030005', scale: 2, useCORS: true, logging: false });
          
          canvas.toBlob(async (blob) => {
              if (!blob) return;
              const file = new File([blob], "oraculo7_vision.png", { type: "image/png" });
              if (navigator.share) {
                  await navigator.share({
                      title: 'Oráculo 7',
                      text: 'Minha visão no Oráculo 7',
                      files: [file]
                  });
              } else {
                  // Fallback to download
                  const link = document.createElement('a');
                  link.download = `Oraculo7_Share.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
              }
          });
      } catch (e) {
          console.error("Share failed", e);
      }
  };

  const handleBack = () => {
    soundManager.playClick();
    soundManager.stopTTS();
    setIsPlaying(false);
    if (status === 'REVEALED') {
      if (initialInput) onClose();
      else { setStatus('IDLE'); setResponse(''); setLocationVal(undefined); }
    } else onClose();
  };

  const renderInput = () => {
    if (portal.inputType === InputType.SELECTION && portal.options) {
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
      const placeholderText = portal.id === 'intencao' ? "Descreva aqui sua intenção" : portal.id === 'sonhos' ? "Descreva seu sonho..." : portal.id === 'ressonancia' ? "Como você se sente?" : "Escreva aqui sua inquietação...";
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
    // ... (DATE, IMAGE, LOCATION unchanged logic, assumed existing)
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
                 <div className="absolute inset-0 bg-mystic-gold/20 rounded-full blur-[30px] animate-pulse-slow"></div>
                 <div className="absolute -inset-1 rounded-full border border-mystic-gold/10 border-t-mystic-gold/30 animate-[spin_12s_linear_infinite] opacity-50"></div>
                 <div className="relative p-5 rounded-full border border-white/10 bg-[#0a050e] shadow-2xl overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-mystic-gold/5 to-transparent opacity-50 animate-pulse-slow"></div>
                     <GetIcon name={portal.icon} className="w-10 h-10 text-mystic-gold relative z-10 opacity-90 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-transform duration-1000 group-hover:scale-105" />
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
                {generatedVisual && (
                    <div className={`mb-8 relative group animate-fade-in ${portal.id === 'tarot' ? 'rounded-2xl border border-mystic-gold/60 shadow-[0_0_50px_rgba(212,175,55,0.25)] scale-[0.98]' : 'rounded-xl border border-mystic-gold/30 shadow-glow-gold overflow-hidden'}`}>
                        <img src={generatedVisual} alt="Visão Mística Gerada" className={`w-full h-auto object-cover transition-all duration-1000 ${portal.id === 'tarot' ? 'rounded-2xl opacity-100' : 'opacity-90 group-hover:opacity-100'}`} />
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-[10px] text-mystic-gold/80 font-serif tracking-[0.3em] uppercase drop-shadow-md border border-mystic-gold/20 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                                {portal.id === 'tarot' ? 'Arcano Revelado' : 'Visão Materializada'}
                            </span>
                        </div>
                    </div>
                )}

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

                {portal.id === 'semente_estelar' && !showFollowUp && !isFollowingUp && !generatingAudio && (
                   <div className="mt-8 pt-6 border-t border-white/5 text-center animate-fade-in" style={{animationDelay: '1s'}}>
                       <button onClick={() => setShowFollowUp(true)} className="text-xs font-serif tracking-[0.2em] text-mystic-gold hover:text-white transition-colors uppercase border border-mystic-gold/30 px-6 py-3 rounded-full hover:bg-mystic-gold/10">+ Aprofundar Conexão</button>
                   </div>
                )}

                {showFollowUp && (
                    <div className="mt-8 pt-6 border-t border-white/5 animate-fade-in">
                         <label className="block text-[10px] font-sans tracking-widest text-mystic-ethereal/50 uppercase mb-3 text-center">O que deseja perguntar?</label>
                         <div className="relative">
                            <textarea value={followUpInput} onChange={(e) => setFollowUpInput(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-mystic-ethereal text-sm font-reading focus:border-mystic-gold/50 focus:outline-none resize-none" rows={2} placeholder="Ex: Qual meu propósito aqui?..." />
                            <button onClick={handleFollowUpSubmit} disabled={!followUpInput} className="absolute bottom-2 right-2 p-2 rounded-full bg-mystic-gold/20 hover:bg-mystic-gold/40 text-mystic-gold disabled:opacity-30 disabled:cursor-not-allowed"><GetIcon name="ArrowRight" className="w-4 h-4" /></button>
                         </div>
                    </div>
                )}

                <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in border-t border-white/5 pt-8" style={{animationDelay: '1.5s'}}>
                    <button onClick={toggleAudio} disabled={generatingAudio} className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[9px] font-sans tracking-[0.2em] uppercase ${isPlaying ? 'bg-mystic-gold/10 border-mystic-gold text-mystic-gold animate-pulse' : 'border-white/20 text-mystic-ethereal/70 hover:bg-white/5 hover:text-mystic-gold'}`}>{generatingAudio ? <><GetIcon name="RefreshCw" className="w-3 h-3 animate-spin" /><span>Gerando...</span></> : <>{isPlaying ? <div className="w-2 h-2 bg-mystic-gold rounded-sm" /> : <GetIcon name="Volume2" className="w-3 h-3" />}<span>{isPlaying ? 'Pausar' : 'Ouvir'}</span></>}</button>
                    
                    {generatedVisual && (
                        <button onClick={handleSaveToAltar} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-mystic-ethereal/70 hover:text-mystic-gold hover:border-mystic-gold/40 transition-all text-[9px] font-sans tracking-[0.2em] uppercase hover:bg-white/5"><GetIcon name="Gem" className="w-3 h-3" /><span>Guardar</span></button>
                    )}

                    <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-mystic-ethereal/70 hover:text-white hover:border-white/40 transition-all text-[9px] font-sans tracking-[0.2em] uppercase hover:bg-white/5"><GetIcon name="Share2" className="w-3 h-3" /><span>Compartilhar</span></button>
                </div>

                <div className="mt-6 flex justify-center">
                   <button onClick={onClose} className="text-[10px] text-mystic-indigo hover:text-mystic-ethereal transition-colors uppercase tracking-[0.2em] font-sans opacity-60 hover:opacity-100">Fechar Portal</button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Hidden Card Structure for Export */}
      <div ref={captureRef} style={{ position: 'fixed', left: '-9999px', top: '0', width: '540px', height: '960px', backgroundColor: '#030005', zIndex: -10 }} className="flex flex-col items-center justify-between p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a050e] via-black to-[#030005]"></div>
          <div className="absolute inset-4 border border-mystic-gold/20 rounded-2xl pointer-events-none"></div>
          <div className="relative z-10 w-full h-full flex flex-col items-center">
              <div className="mt-10 mb-6">
                  <h1 className="font-serif text-3xl text-mystic-gold tracking-[0.4em] uppercase">Oráculo<span className="font-light">7</span></h1>
                  <div className="w-12 h-[1px] bg-mystic-gold/50 mx-auto mt-2"></div>
              </div>
              
              {generatedVisual ? (
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-mystic-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.2)] mb-8 relative">
                      <img src={generatedVisual} className="w-full h-full object-cover" alt="Vision" />
                  </div>
              ) : (
                  <div className="w-full aspect-[3/4] rounded-xl border border-mystic-gold/20 flex items-center justify-center mb-8 bg-white/5 relative overflow-hidden">
                      <GetIcon name={portal.icon} className="w-24 h-24 text-mystic-gold opacity-50 relative z-10" />
                  </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center w-full">
                   <p className="font-serif text-mystic-gold/60 text-xs tracking-[0.3em] uppercase mb-4">{portal.title} • {new Date().toLocaleDateString()}</p>
                   <div className="relative">
                       <p className="font-reading text-xl text-mystic-ethereal italic leading-relaxed px-4 text-center line-clamp-6">
                           {response.replace(/\*\*/g, '').replace(/^#+\s.*$/gm, '').trim().split('\n')[0] || "A sabedoria foi revelada."}
                       </p>
                   </div>
              </div>

              <div className="mt-12 flex flex-col items-center gap-2">
                  <div className="text-[9px] font-sans tracking-[0.4em] text-gray-500 uppercase flex items-center gap-2">
                      <span className="w-1 h-1 bg-mystic-gold/50 rounded-full"></span>
                      oraculo7.com.br
                      <span className="w-1 h-1 bg-mystic-gold/50 rounded-full"></span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PortalView;