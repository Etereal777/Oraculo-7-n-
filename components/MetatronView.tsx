import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Octahedron, Float } from '@react-three/drei';
import { UserProfile, Reading } from '../types';
import { consultMetatron, MetatronMode, generateAudioReading } from '../services/geminiService';
import { saveReading } from '../services/storage';
import { soundManager } from '../services/soundService';
import { GetIcon } from './Icons';

interface Props {
  user: UserProfile;
  onClose: () => void;
}

// --- 3D SACRED GEOMETRY (Using Three.js) ---
const SacredGeometry = ({ mode }: { mode: 'IDLE' | 'ANALYZING' }) => {
    const meshRef = useRef<any>(null);
    const groupRef = useRef<any>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * (mode === 'ANALYZING' ? 2 : 0.2);
            groupRef.current.rotation.x += delta * (mode === 'ANALYZING' ? 1.5 : 0.1);
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={groupRef}>
                {/* Core */}
                <Icosahedron args={[1, 0]}>
                    <meshStandardMaterial 
                        color={mode === 'ANALYZING' ? "#ffffff" : "#D4AF37"} 
                        wireframe 
                        emissive={mode === 'ANALYZING' ? "#ffffff" : "#D4AF37"}
                        emissiveIntensity={0.5}
                    />
                </Icosahedron>
                {/* Shell */}
                <Octahedron args={[1.5, 0]}>
                    <meshStandardMaterial 
                        color="#1a1a1a" 
                        wireframe 
                        transparent 
                        opacity={0.3} 
                    />
                </Octahedron>
            </group>
        </Float>
    )
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
                {isPlaying ? "A Estrutura Fala..." : "Calculando Vibração..."}
            </p>
        </div>
    );
};

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
    setGeneratingAudio(true); // Prep visual

    // Structural Delay
    await new Promise(resolve => setTimeout(resolve, 4000));

    const result = await consultMetatron(user, mode);
    
    // CRITICAL FIX: Safe UUID
    const safeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `meta-${Date.now()}`;

    // Save
    const reading: Reading = {
        id: safeId,
        portalId: 'metatron',
        portalName: 'METATRON',
        timestamp: Date.now(),
        userInput: `[MODO: ${mode}]`,
        response: result
    };
    saveReading(reading);

    setResponse(result);
    
    // Auto Play Audio
    const audio = await generateAudioReading(result);
    if (audio) {
        setAudioBase64(audio);
        setIsPlaying(true);
        soundManager.playTTS(audio, () => setIsPlaying(false));
    }
    setGeneratingAudio(false);

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

  const handleDownloadAudio = () => {
      if (!audioBase64) return;
      soundManager.playClick();
      try {
          const blob = soundManager.createWavBlob(audioBase64);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Metatron_Voz_${Date.now()}.wav`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Download failed", e);
      }
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
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 opacity-40">
          <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <SacredGeometry mode={status === 'ANALYZING' ? 'ANALYZING' : 'IDLE'} />
          </Canvas>
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
             <h1 className="font-serif text-2xl md:text-3xl tracking-[0.4em] uppercase text-mystic-gold text-center drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
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
            <div className="w-full h-[65vh] overflow-y-auto custom-scrollbar border-t border-b border-mystic-gold/10 bg-black/40 backdrop-blur-md p-8 animate-fade-in relative flex flex-col items-center justify-center">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-mystic-gold/40"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-mystic-gold/40"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-mystic-gold/40"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-mystic-gold/40"></div>

                {/* AUDIO VISUALIZER REPLACING TEXT */}
                <div className="w-full flex justify-center py-8">
                    {generatingAudio ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                             <GetIcon name="RefreshCw" className="w-8 h-8 text-mystic-gold/50 animate-spin" />
                             <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-mystic-gold/50">Sintetizando...</span>
                        </div>
                    ) : (
                        <AudioVisualizer isPlaying={isPlaying} />
                    )}
                </div>

                <div className="flex justify-center mt-12 mb-4 gap-4">
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
                        <span>{isPlaying ? 'Pausar Frequência' : 'Ouvir Novamente'}</span>
                    </button>

                    <button onClick={handleDownloadAudio} disabled={!audioBase64 || generatingAudio} className={`flex items-center gap-2 px-6 py-2 border border-mystic-gold/30 rounded-none text-mystic-gold/60 hover:text-mystic-gold hover:bg-mystic-gold/5 transition-all text-[10px] font-sans tracking-[0.2em] uppercase ${!audioBase64 ? 'opacity-50 cursor-not-allowed' : ''}`}><GetIcon name="Download" className="w-3 h-3" /><span>Baixar</span></button>
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