import React, { useEffect, useState } from 'react';
import { getAltar, removeAltarItem } from '../services/storage';
import { AltarItem } from '../types';
import { GetIcon } from './Icons';
import { soundManager } from '../services/soundService';

interface Props {
  onClose: () => void;
}

const AltarView: React.FC<Props> = ({ onClose }) => {
  const [items, setItems] = useState<AltarItem[]>([]);

  useEffect(() => {
    setItems(getAltar());
  }, []);

  const handleRemove = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      soundManager.playClick();
      removeAltarItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-mystic-dark p-6 animate-fade-in pb-20 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex items-center justify-between mb-12 sticky top-0 bg-mystic-dark/95 backdrop-blur-md z-40 py-4 border-b border-mystic-border/50">
          <div className="flex items-center">
            <button onClick={onClose} className="mr-4 p-2 rounded-full hover:bg-white/5 text-mystic-indigo hover:text-mystic-ethereal transition-colors">
                <GetIcon name="ChevronLeft" className="w-6 h-6" />
            </button>
            <div>
                <h1 className="text-3xl font-serif text-mystic-ethereal tracking-[0.2em] uppercase flex items-center gap-3">
                    <GetIcon name="Gem" className="w-6 h-6 text-mystic-gold" />
                    Altar
                </h1>
                <p className="text-[10px] text-mystic-ethereal/50 font-sans tracking-[0.3em] mt-1 uppercase">Sua Coleção Sagrada</p>
            </div>
          </div>
        </header>

        {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-32 opacity-30">
                <div className="w-24 h-24 border-2 border-dashed border-mystic-gold rounded-full flex items-center justify-center mb-6">
                    <GetIcon name="Ghost" className="w-10 h-10 text-mystic-gold" />
                </div>
                <p className="font-serif tracking-widest text-sm uppercase">O altar aguarda suas oferendas.</p>
                <p className="font-sans text-xs mt-2">Salve lâminas e visões após suas leituras.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(item => (
                    <div key={item.id} className="group relative bg-black/40 border border-mystic-border rounded-xl overflow-hidden hover:border-mystic-gold/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-glow-gold">
                        {/* Remove Button */}
                        <button 
                            onClick={(e) => handleRemove(item.id, e)}
                            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white/50 hover:text-red-400 hover:bg-black/80 transition-colors z-20 opacity-0 group-hover:opacity-100"
                        >
                            <GetIcon name="X" className="w-4 h-4" />
                        </button>

                        {/* Image Display */}
                        {item.imageUrl ? (
                            <div className="w-full aspect-[4/5] overflow-hidden">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            </div>
                        ) : (
                            <div className="w-full aspect-[4/5] flex items-center justify-center bg-gradient-to-br from-mystic-indigo to-black">
                                <GetIcon name="Sparkles" className="w-16 h-16 text-mystic-gold opacity-50" />
                            </div>
                        )}

                        {/* Info */}
                        <div className="p-6 relative">
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none -translate-y-full h-full"></div>
                             <h3 className="font-serif text-lg text-mystic-gold tracking-widest uppercase mb-2">{item.name}</h3>
                             <p className="font-reading text-sm text-mystic-ethereal/70 italic line-clamp-3">{item.description}</p>
                             <span className="block mt-4 text-[9px] font-sans tracking-[0.2em] text-white/20 uppercase">
                                 Obtido em {new Date(item.timestamp).toLocaleDateString()}
                             </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default AltarView;