import React, { useEffect, useState } from 'react';
import { getHistory, updateReading } from '../services/storage';
import { Reading } from '../types';
import { GetIcon } from './Icons';
import { generateAudioReading } from '../services/geminiService';
import { soundManager } from '../services/soundService';

interface Props {
  onBack: () => void;
}

const History: React.FC<Props> = ({ onBack }) => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Journaling State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // Audio State
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setReadings(getHistory());
    return () => {
      soundManager.stopTTS();
    };
  }, []);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };
  
  const handleToggleAudio = async (readingId: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    
    // Stop if playing the same audio
    if (currentAudioId === readingId && isPlaying) {
        soundManager.stopTTS();
        setIsPlaying(false);
        return;
    }
    
    // If playing another audio, stop it
    soundManager.stopTTS();
    setCurrentAudioId(readingId);
    
    setGeneratingAudio(true);
    const rawBase64 = await generateAudioReading(text);
    
    if (rawBase64) {
        setAudioBase64(rawBase64);
        setIsPlaying(true);
        soundManager.playTTS(rawBase64, () => {
            setIsPlaying(false);
            setCurrentAudioId(null);
        });
    }
    setGeneratingAudio(false);
  };

  const startEditingNote = (reading: Reading) => {
    setEditingNoteId(reading.id);
    setNoteContent(reading.notes || '');
  };

  const saveNote = (reading: Reading) => {
      soundManager.playClick();
      const updatedReading = { ...reading, notes: noteContent };
      updateReading(updatedReading);
      
      // Update local state
      setReadings(prev => prev.map(r => r.id === reading.id ? updatedReading : r));
      setEditingNoteId(null);
  };

  return (
    <div className="min-h-screen bg-mystic-dark p-6 animate-fade-in pb-20">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center mb-12 pt-4">
          <button onClick={onBack} className="mr-6 p-2 rounded-full hover:bg-white/5 text-mystic-indigo hover:text-mystic-ethereal transition-colors">
            <GetIcon name="ChevronLeft" className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-serif text-mystic-ethereal tracking-[0.25em] uppercase">Saberes Guardados</h1>
        </header>

        {readings.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 text-mystic-indigo/30">
            <GetIcon name="Book" className="w-16 h-16 mb-6 opacity-30" />
            <p className="font-serif text-lg tracking-wide">O livro da sua jornada ainda está em branco.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {readings.map((reading) => (
              <div 
                key={reading.id} 
                className={`glass-panel border ${expandedId === reading.id ? 'border-mystic-gold/30 bg-mystic-indigo/10' : 'border-mystic-border'} rounded-2xl p-6 transition-all duration-300 hover:border-mystic-border/80`}
              >
                <div 
                  className="flex justify-between items-center cursor-pointer group"
                  onClick={() => setExpandedId(expandedId === reading.id ? null : reading.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-mystic-gold/70 font-serif tracking-[0.25em] uppercase mb-1">{reading.portalName}</span>
                    <span className="text-sm text-mystic-ethereal/80 font-sans font-light tracking-wide">{formatDate(reading.timestamp)}</span>
                  </div>
                  <div className={`transform transition-transform duration-300 text-mystic-indigo group-hover:text-mystic-gold ${expandedId === reading.id ? 'rotate-180' : ''}`}>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                     </svg>
                  </div>
                </div>

                {expandedId === reading.id && (
                  <div className="mt-6 pt-6 border-t border-mystic-border/50 animate-fade-in">
                    {reading.userInput && (
                      <div className="mb-6 bg-black/30 p-4 rounded-xl border border-mystic-border/30">
                        <span className="text-[10px] text-mystic-indigo font-bold tracking-[0.2em] block mb-2 uppercase font-sans">Você trouxe</span>
                        <p className="text-mystic-ethereal/70 italic text-lg font-reading font-light">"{reading.userInput}"</p>
                      </div>
                    )}
                    <span className="text-[10px] text-mystic-gold/80 font-bold tracking-[0.2em] block mb-3 uppercase flex items-center justify-between font-sans">
                        <span>O Oráculo revelou</span>
                        <button 
                            onClick={(e) => handleToggleAudio(reading.id, reading.response, e)}
                            className="flex items-center gap-2 text-mystic-gold hover:text-white transition-colors"
                            disabled={generatingAudio && currentAudioId === reading.id}
                        >
                            {generatingAudio && currentAudioId === reading.id ? (
                                <GetIcon name="RefreshCw" className="w-3 h-3 animate-spin" />
                            ) : (
                                <GetIcon name={isPlaying && currentAudioId === reading.id ? "VolumeX" : "Volume2"} className="w-4 h-4" />
                            )}
                            <span className="text-[9px] font-sans tracking-widest">{isPlaying && currentAudioId === reading.id ? "PAUSAR" : "OUVIR"}</span>
                        </button>
                    </span>
                    <p className="text-mystic-ethereal text-xl font-reading leading-loose whitespace-pre-wrap opacity-95 text-justify font-light">{reading.response.replace(/\*\*/g, '')}</p>
                    
                    {/* --- JOURNALING SECTION --- */}
                    <div className="mt-8 pt-6 border-t border-mystic-border/30">
                        <div className="flex items-center gap-2 mb-3">
                            <GetIcon name="BookOpen" className="w-3 h-3 text-mystic-gold" />
                            <span className="text-[10px] text-mystic-gold font-bold tracking-[0.2em] uppercase font-sans">Diário de Ressonância</span>
                        </div>

                        {editingNoteId === reading.id ? (
                            <div className="animate-fade-in">
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="O que você sentiu com essa leitura? Como ela se manifestou?"
                                    className="w-full bg-black/40 border border-mystic-gold/30 rounded-lg p-4 text-mystic-ethereal text-base font-reading focus:outline-none focus:border-mystic-gold transition-colors resize-none mb-3"
                                    rows={4}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setEditingNoteId(null)}
                                        className="px-4 py-2 text-xs font-sans tracking-widest text-gray-500 hover:text-gray-300 uppercase"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={() => saveNote(reading)}
                                        className="px-4 py-2 bg-mystic-gold/10 border border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/20 rounded-md text-xs font-sans tracking-widest uppercase transition-colors"
                                    >
                                        Salvar Nota
                                    </button>
                                </div>
                            </div>
                        ) : (
                             <div 
                                onClick={() => startEditingNote(reading)}
                                className="w-full bg-white/5 border border-transparent hover:border-white/10 rounded-lg p-4 cursor-text transition-all group"
                             >
                                 {reading.notes ? (
                                     <p className="text-mystic-ethereal/80 font-reading italic leading-relaxed">{reading.notes}</p>
                                 ) : (
                                     <p className="text-gray-600 text-sm font-sans tracking-wide group-hover:text-gray-500">Adicionar notas pessoais sobre esta leitura...</p>
                                 )}
                             </div>
                        )}
                    </div>
                    {/* --------------------------- */}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;