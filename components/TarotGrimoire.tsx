import React, { useState } from 'react';
import { TAROT_DECK } from '../data/tarotData';
import { GetIcon } from './Icons';
import { soundManager } from '../services/soundService';

interface Props {
  onSelectCard: (cardName: string) => void;
  onClose: () => void;
}

const TarotGrimoire: React.FC<Props> = ({ onSelectCard, onClose }) => {
  const activeTabRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleCardClick = (card: string) => {
    soundManager.playClick();
    onSelectCard(card);
  };

  return (
    <div className="min-h-screen bg-mystic-dark p-6 animate-fade-in pb-20 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 sticky top-0 bg-mystic-dark/95 backdrop-blur-md z-40 py-4 border-b border-mystic-border/50">
          <div className="flex items-center">
            <button onClick={onClose} className="mr-4 p-2 rounded-full hover:bg-white/5 text-mystic-indigo hover:text-mystic-ethereal transition-colors">
                <GetIcon name="ChevronLeft" className="w-6 h-6" />
            </button>
            <div>
                <h1 className="text-3xl font-serif text-mystic-ethereal tracking-[0.2em] flex items-center gap-3 uppercase">
                    <GetIcon name="BookOpen" className="w-6 h-6 text-mystic-gold" />
                    Grimório
                </h1>
                <p className="text-[10px] text-mystic-ethereal/50 font-sans tracking-[0.3em] mt-1 uppercase">78 Arquétipos da Consciência</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center sticky top-24 z-30 py-2">
            {TAROT_DECK.map((group, index) => (
                <button
                    key={group.name}
                    onClick={() => { setActiveTab(index); soundManager.playHover(); }}
                    className={`px-4 py-2 rounded-full text-[10px] font-sans tracking-[0.2em] uppercase transition-all duration-300 border
                        ${activeTab === index 
                            ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold shadow-glow-gold' 
                            : 'bg-black/20 border-mystic-border text-mystic-ethereal/60 hover:border-mystic-gold/30 hover:text-mystic-ethereal'}`}
                >
                    {group.name}
                </button>
            ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
            {TAROT_DECK[activeTab].cards.map((card, idx) => (
                <button
                    key={card}
                    onClick={() => handleCardClick(card)}
                    onMouseEnter={() => soundManager.playHover()}
                    className="group relative aspect-[2/3] rounded-xl border border-mystic-border bg-gradient-to-br from-mystic-deep to-black overflow-hidden hover:border-mystic-gold/50 hover:shadow-glow-gold transition-all duration-500 hover:-translate-y-1"
                >
                    {/* Card Back Pattern Effect */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-mystic-gold)_1px,_transparent_1px)] bg-[length:10px_10px]"></div>
                    
                    {/* Inner Content */}
                    <div className="absolute inset-2 border border-white/5 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                        <div className="w-8 h-8 rounded-full bg-mystic-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
                             {activeTab === 0 ? (
                                <GetIcon name="Star" className="w-4 h-4 text-mystic-gold" />
                             ) : activeTab === 1 ? (
                                <GetIcon name="Flame" className="w-4 h-4 text-orange-400" />
                             ) : activeTab === 2 ? (
                                <GetIcon name="Waves" className="w-4 h-4 text-blue-400" />
                             ) : activeTab === 3 ? (
                                <GetIcon name="Sparkles" className="w-4 h-4 text-cyan-400" />
                             ) : (
                                <GetIcon name="CircleDot" className="w-4 h-4 text-emerald-400" />
                             )}
                        </div>
                        <span className="font-serif text-sm text-mystic-ethereal group-hover:text-white transition-colors leading-tight tracking-wide">
                            {card}
                        </span>
                        
                        {/* Number hint for Majors */}
                        {activeTab === 0 && (
                            <span className="absolute bottom-2 text-[10px] text-white/20 font-serif">{idx}</span>
                        )}
                    </div>

                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-mystic-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
            ))}
        </div>

        <div className="mt-12 text-center text-mystic-ethereal/30 text-[10px] font-sans tracking-[0.2em] uppercase">
            "Escolha uma lâmina para meditar sobre sua essência."
        </div>
      </div>
    </div>
  );
};

export default TarotGrimoire;