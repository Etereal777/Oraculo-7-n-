import React, { useEffect, useState } from 'react';
import { UserProfile, PortalConfig, PortalCategory } from '../types';
import { PORTALS } from '../constants';
import { GetIcon } from './Icons';
import { Logo } from './Logo';
import { generateDailyPhrase, getMoonPhase } from '../services/geminiService';
import { getCurrentEphemeris, PlanetaryPosition } from '../services/astronomyService';
import { soundManager } from '../services/soundService';

interface Props {
  user: UserProfile;
  onSelectPortal: (portal: PortalConfig) => void;
  onOpenHistory: () => void;
  onOpenUniverse: () => void;
  onOpenGrimoire: () => void;
  onOpenMetatron: () => void;
  onOpenAltar: () => void;
}

const Dashboard: React.FC<Props> = ({ user, onSelectPortal, onOpenHistory, onOpenUniverse, onOpenGrimoire, onOpenMetatron, onOpenAltar }) => {
  const [dailyPhrase, setDailyPhrase] = useState("Sintonizando energias...");
  const [moonPhase, setMoonPhase] = useState("");
  const [ephemeris, setEphemeris] = useState<PlanetaryPosition[]>([]);

  useEffect(() => {
    let mounted = true;
    
    generateDailyPhrase(user.name).then(phrase => {
      if (mounted) setDailyPhrase(phrase);
    });

    setMoonPhase(getMoonPhase());
    setEphemeris(getCurrentEphemeris());

    return () => { mounted = false; };
  }, [user.name]);

  const getMoonAffinity = (portalId: string, currentMoon: string) => {
      if (currentMoon.includes("Nova")) return ['intencao', 'semente_estelar'].includes(portalId);
      if (currentMoon.includes("Crescente")) return ['elemento', 'numeros', 'mapa'].includes(portalId);
      if (currentMoon.includes("Cheia")) return ['tarot', 'visao', 'vibracao', 'chakra'].includes(portalId);
      if (currentMoon.includes("Minguante")) return ['sombra', 'sonhos', 'peregrinacao'].includes(portalId);
      return false;
  };

  const renderSection = (category: PortalCategory) => {
    const portals = PORTALS.filter(p => p.category === category);
    let titleColor = 'text-mystic-ethereal/40';
    let containerClass = 'gap-4';

    if (category === PortalCategory.DEEP) {
        titleColor = 'text-mystic-gold/60';
        containerClass = 'gap-6';
    }

    return (
      <div className="mb-24 animate-fade-in">
        <div className="flex flex-col items-center mb-12">
           <h3 className={`${titleColor} font-serif tracking-[0.4em] text-[10px] md:text-xs uppercase mb-3 flex items-center gap-6 opacity-80`}>
             <span className="w-16 h-[1px] bg-gradient-to-r from-transparent to-white/10"></span>
             {category}
             <span className="w-16 h-[1px] bg-gradient-to-l from-transparent to-white/10"></span>
           </h3>
        </div>
        
        <div className={`flex flex-wrap justify-center ${containerClass}`}>
          {portals.map(portal => {
            let iconColorClass = 'text-mystic-ethereal/60 group-hover:text-mystic-gold group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'; 
            
            if (['tarot', 'tzolkin', 'oraculo', 'intencao'].includes(portal.id)) {
                iconColorClass = 'text-mystic-gold/70 group-hover:text-amber-200 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'; 
            } else if (['sombra', 'sonhos', 'peregrinacao', 'visao'].includes(portal.id)) {
                iconColorClass = 'text-indigo-300/60 group-hover:text-mystic-gold'; 
            } else if (['semente_estelar', 'vibracao', 'elemento', 'ciclo', 'ressonancia'].includes(portal.id)) {
                iconColorClass = 'text-blue-200/60 group-hover:text-amber-100'; 
            } else if (['mapa', 'numeros', 'chakra'].includes(portal.id)) {
                iconColorClass = 'text-amber-700/60 group-hover:text-amber-300'; 
            }

            const sizeClass = category === PortalCategory.DEEP 
                ? 'w-full md:w-[30%] min-w-[280px] h-48' 
                : 'w-[45%] md:w-[22%] min-w-[150px] h-40';
            
            const isMoonBoosted = getMoonAffinity(portal.id, moonPhase);

            return (
              <button
                key={portal.id}
                onClick={() => onSelectPortal(portal)}
                onMouseEnter={() => soundManager.playHover()}
                className={`
                  group relative ${sizeClass}
                  glass-panel rounded-xl
                  flex flex-col items-center justify-center text-center
                  transition-all duration-700 ease-out
                  hover:-translate-y-2 hover:scale-[1.02] hover:shadow-glow-gold hover:bg-mystic-gold/5
                  border ${isMoonBoosted ? 'border-mystic-gold/40 shadow-[0_0_20px_rgba(212,175,55,0.15)] bg-mystic-gold/5' : 'border-white/5 hover:border-mystic-gold/40'}
                  overflow-hidden
                `}
              >
                {isMoonBoosted && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-70 animate-pulse">
                        <GetIcon name="Moon" className="w-2 h-2 text-mystic-gold" />
                    </div>
                )}
                <div className="absolute inset-0 bg-glow-radial opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-5">
                  <div className={`
                    p-4 rounded-full 
                    bg-gradient-to-br from-white/5 to-transparent 
                    border ${isMoonBoosted ? 'border-mystic-gold/30' : 'border-white/5'} 
                    group-hover:border-mystic-gold/50
                    shadow-inner-light
                    transition-all duration-700 
                    group-hover:scale-110 
                    group-hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]
                    group-hover:bg-mystic-gold/10
                  `}>
                    <GetIcon name={portal.icon} className={`w-6 h-6 transition-all duration-500 ${iconColorClass}`} />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-mystic-ethereal/70 text-[10px] md:text-xs tracking-[0.25em] uppercase group-hover:text-mystic-gold group-hover:font-medium transition-all duration-500 drop-shadow-sm">
                        {portal.title}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  return (
    <div className="min-h-screen relative pb-32 overflow-x-hidden selection:bg-mystic-gold/30">
       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[60vh] bg-mystic-indigo blur-[120px] rounded-full pointer-events-none -z-10 opacity-40"></div>
       <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-mystic-plum blur-[100px] rounded-full pointer-events-none -z-10 opacity-30"></div>

       <header className="px-6 pt-10 pb-8 max-w-5xl mx-auto relative">
         <div className="flex justify-between items-start animate-fade-in relative z-20">
            <div className="flex flex-col gap-2 mt-2">
               {/* Date & Moon */}
              <div className="flex items-center gap-4 text-mystic-ethereal/40 text-[9px] md:text-[10px] font-sans font-medium tracking-[0.3em] uppercase">
                <span className="flex items-center gap-2">
                   <span className="w-1 h-1 rounded-full bg-mystic-gold/50"></span>
                   {formattedDate}
                </span>
                <span className="opacity-10 text-lg font-light">|</span>
                <span className="flex items-center gap-2 text-mystic-gold/60">
                    <GetIcon name="Moon" className="w-3 h-3" />
                    {moonPhase}
                </span>
              </div>
              
              {/* Live Ephemeris Ticker */}
              <div className="overflow-hidden h-4 w-64 md:w-96 relative mask-linear-fade">
                  <div className="flex gap-6 animate-shimmer absolute whitespace-nowrap text-[8px] font-sans tracking-widest text-white/30 uppercase">
                      {ephemeris.map((planet, i) => (
                          <span key={i} className="flex items-center gap-1">
                              <span className="text-mystic-gold/70">{planet.body}</span> em {planet.sign} {planet.degree}° {planet.retrograde ? '(R)' : ''}
                          </span>
                      ))}
                  </div>
              </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                  onClick={onOpenAltar}
                  onMouseEnter={() => soundManager.playHover()}
                  className="group p-3 rounded-full glass-panel text-mystic-ethereal/40 hover:text-mystic-gold hover:border-mystic-gold/20 transition-all duration-500 shadow-lg hover:shadow-glow-gold"
                  title="Altar"
                >
                  <GetIcon name="Gem" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>

                <button 
                  onClick={onOpenGrimoire}
                  onMouseEnter={() => soundManager.playHover()}
                  className="group p-3 rounded-full glass-panel text-mystic-ethereal/40 hover:text-mystic-gold hover:border-mystic-gold/20 transition-all duration-500 shadow-lg hover:shadow-glow-gold"
                  title="Grimório"
                >
                  <GetIcon name="BookOpen" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>

                <button 
                  onClick={onOpenHistory}
                  onMouseEnter={() => soundManager.playHover()}
                  className="group p-3 rounded-full glass-panel text-mystic-ethereal/40 hover:text-mystic-gold hover:border-mystic-gold/20 transition-all duration-500 shadow-lg hover:shadow-glow-gold"
                  title="Histórico"
                >
                  <GetIcon name="History" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
            </div>
         </div>

         <div className="flex flex-col items-center justify-center mt-12 mb-16 animate-fade-in relative z-10">
            <div className="relative mb-8">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-mystic-gold/5 rounded-full blur-[60px] animate-pulse-slow"></div>
                 <div className="relative flex items-center justify-center">
                     <Logo className="w-16 h-16 text-mystic-gold opacity-90 drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]" />
                 </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-b from-mystic-ethereal via-mystic-gold to-amber-700 drop-shadow-2xl mb-8 text-center pl-4 animate-pulse-slow">
              ORÁCULO<span className="text-mystic-gold font-light">7</span>
            </h1>

            <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-mystic-gold/40 to-transparent mb-10"></div>

            <div className="relative w-full max-w-2xl px-6">
                <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden group hover:border-mystic-gold/20 transition-colors duration-1000 shadow-void-depth">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <p className="font-sans text-mystic-ethereal/40 text-[10px] tracking-[0.4em] uppercase mb-5">
                            Saudações, <span className="text-mystic-gold/90 font-bold">{user.name}</span>
                        </p>
                        <div className="mb-6 text-mystic-gold/30">
                           <GetIcon name="Sparkles" className="w-3 h-3 animate-pulse" />
                        </div>
                        <p className="font-reading text-2xl md:text-3xl text-mystic-ethereal/90 italic leading-relaxed tracking-wide font-light">
                            "{dailyPhrase}"
                        </p>
                    </div>
                </div>
            </div>
         </div>
       </header>

       <main className="px-6 max-w-6xl mx-auto mt-8">
         {renderSection(PortalCategory.DEEP)}
         {renderSection(PortalCategory.SUBTLE)}
         {renderSection(PortalCategory.PRESENCE)}

         <div className="w-full text-center mt-12 mb-8 opacity-20">
            <p className="text-[8px] font-sans tracking-[0.2em] uppercase text-mystic-ethereal">
                Todos os direitos reservados André Miguel Herman 2025
            </p>
         </div>
       </main>

       {/* UPDATED FOOTER NAV */}
       <div className="fixed bottom-0 left-0 w-full bg-[#03000a]/95 backdrop-blur-xl border-t border-white/5 px-6 py-3 flex justify-around items-end z-40 shadow-[0_-20px_60px_rgba(0,0,0,0.9)]">
          <button 
            onClick={onOpenMetatron}
            onMouseEnter={() => soundManager.playHover()}
            className="group flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-105"
            title="Acessar Metatron"
          >
             <div className="relative p-2">
                <GetIcon name="Hexagon" className="w-5 h-5 text-mystic-ethereal group-hover:text-mystic-gold transition-colors drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]" />
                <div className="absolute inset-0 bg-mystic-gold/20 blur-md rounded-full opacity-30 group-hover:opacity-100 transition-opacity animate-pulse-slow"></div>
             </div>
             <span className="text-[9px] font-serif tracking-[0.3em] uppercase text-mystic-ethereal group-hover:text-mystic-gold transition-colors">Metatron</span>
          </button>

          <div className="flex flex-col items-center gap-2 opacity-100 cursor-pointer group mb-1">
            <div className="p-3.5 rounded-full bg-mystic-gold/10 border border-mystic-gold/30 group-hover:border-mystic-gold/60 transition-colors shadow-glow-gold">
                 <Logo className="w-6 h-6 text-mystic-gold" />
            </div>
            <span className="text-[10px] font-serif tracking-[0.3em] uppercase text-mystic-gold drop-shadow-md">Oráculo</span>
          </div>

          <button 
            onClick={onOpenUniverse}
            onMouseEnter={() => soundManager.playHover()}
            className="group flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-105"
          >
             <div className="relative p-2">
                <GetIcon name="Orbit" className="w-5 h-5 text-mystic-ethereal" />
                <div className="absolute inset-0 bg-mystic-ethereal/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </div>
             <span className="text-[9px] font-serif tracking-[0.3em] uppercase text-mystic-ethereal">Consultor</span>
          </button>
       </div>
    </div>
  );
};

export default Dashboard;