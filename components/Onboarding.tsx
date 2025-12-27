import React, { useState } from 'react';
import { UserProfile } from '../types';
import { saveProfile } from '../services/storage';
import { soundManager } from '../services/soundService';
import { Logo } from './Logo';
import { GetIcon } from './Icons';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [quest, setQuest] = useState('');
  const [step, setStep] = useState(1);

  // Define max date as today to prevent future years
  const maxDate = new Date().toISOString().split('T')[0];

  const handleNext = () => {
    soundManager.playClick();
    if (step < 3) {
      setStep(step + 1);
    } else {
      const profile: UserProfile = {
        name,
        birthDate,
        quest,
        createdAt: Date.now(),
      };
      saveProfile(profile);
      onComplete(profile);
    }
  };

  const isStepValid = () => {
    if (step === 1) return name.length > 2;
    if (step === 2) return true; // Birthdate optional
    if (step === 3) return quest.length > 3;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-mystic-dark">
      {/* --- Harmonious Deep Background --- */}
      
      {/* 1. Base Layer: Warm Void */}
      <div className="absolute inset-0 bg-[#050406] z-[-2]"></div>

      {/* 2. Central Glow: Diffused Antique Gold (Subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-[radial-gradient(circle_at_center,_rgba(170,119,28,0.08)_0%,_transparent_70%)] blur-[80px] z-[-1] pointer-events-none animate-pulse-slow"></div>

      {/* 3. Bottom Accent: Deep Amber Rise */}
      <div className="absolute bottom-[-10%] left-0 right-0 h-[40vh] bg-gradient-to-t from-[#1a1205] to-transparent opacity-60 z-[-1] pointer-events-none"></div>
      
      {/* 4. Top Accent: Ethereal Mist */}
      <div className="absolute top-[-10%] left-0 right-0 h-[30vh] bg-gradient-to-b from-[#111111] to-transparent opacity-40 z-[-1] pointer-events-none"></div>

      {/* 5. Subtle Dust/Stars */}
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-mystic-gold rounded-full blur-[1px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/5 w-1 h-1 bg-white rounded-full blur-[1px] opacity-10 animate-pulse-slow"></div>

      
      <div className="max-w-md w-full animate-fade-in z-10 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="relative mb-8 group cursor-default">
             {/* Logo Backlight - Breathing independently */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-mystic-gold/10 rounded-full blur-[40px] animate-pulse-slow pointer-events-none"></div>
             
             {/* The Animated Logo */}
             <Logo className="w-24 h-24 text-mystic-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[#EBEAE4] via-[#D4AF37] to-[#785915] tracking-[0.3em] mb-3 drop-shadow-sm text-center pl-3">
            ORÁCULO<span className="text-[#AA771C] font-light">7</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 opacity-60 mt-2">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-mystic-gold/50"></div>
             <p className="text-[#C0C0C0] text-[9px] font-sans tracking-[0.6em] uppercase">Iniciação</p>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-mystic-gold/50"></div>
          </div>
        </div>

        {/* Interaction Card */}
        <div className="w-full glass-panel rounded-[2rem] p-10 border border-white/5 bg-gradient-to-b from-[#0a0a0a]/80 to-[#050505]/90 transform transition-all duration-700 relative overflow-hidden">
          
          {/* Top light reflection */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-mystic-gold/20 to-transparent"></div>

          {step === 1 && (
            <div className="space-y-10 animate-fade-in">
              <label className="block text-center font-serif text-xl text-mystic-ethereal tracking-widest uppercase opacity-90">Como deseja ser chamado?</label>
              <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-mystic-gold/0 via-mystic-gold/10 to-mystic-gold/0 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome..."
                    className="relative w-full bg-[#0E0E0E] border border-white/10 rounded-xl py-6 px-4 text-center text-mystic-gold text-2xl font-reading italic focus:outline-none focus:border-mystic-gold/30 focus:bg-[#151515] focus:shadow-glow-gold transition-all duration-500 placeholder-white/10"
                    autoFocus
                  />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-fade-in">
              <label className="block text-center font-serif text-xl text-mystic-ethereal tracking-widest uppercase opacity-90">Quando sua jornada começou?</label>
              <div className="relative group">
                <input
                  type="date"
                  value={birthDate}
                  min="1900-01-01"
                  max={maxDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[#0E0E0E] border border-white/10 rounded-xl py-6 px-4 text-center text-mystic-gold text-2xl font-reading focus:outline-none focus:border-mystic-gold/30 focus:shadow-glow-gold transition-all duration-500 [color-scheme:dark] uppercase tracking-widest cursor-pointer hover:bg-[#151515]"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-30 group-hover:text-mystic-gold transition-colors">
                    <GetIcon name="Star" className="w-3 h-3" />
                </div>
                <p className="text-[9px] text-center text-white/20 mt-4 uppercase tracking-[0.3em] font-sans">(Data de Nascimento - Opcional)</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-fade-in">
              <label className="block text-center font-serif text-xl text-mystic-ethereal tracking-widest uppercase opacity-90">O que busca neste momento?</label>
              <div className="relative group">
                 <div className="absolute -inset-1 bg-gradient-to-r from-mystic-gold/0 via-mystic-gold/10 to-mystic-gold/0 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                 <textarea
                    value={quest}
                    onChange={(e) => setQuest(e.target.value)}
                    placeholder="Clareza, propósito, paz interior..."
                    rows={2}
                    className="relative w-full bg-[#0E0E0E] border border-white/10 rounded-xl p-6 text-center text-mystic-gold text-2xl font-reading italic focus:outline-none focus:border-mystic-gold/30 focus:bg-[#151515] focus:shadow-glow-gold transition-all duration-500 placeholder-white/10 resize-none leading-relaxed"
                    autoFocus
                  />
              </div>
            </div>
          )}

          <div className="mt-14 flex justify-center">
            <button
              onClick={handleNext}
              onMouseEnter={() => soundManager.playHover()}
              disabled={!isStepValid()}
              className={`
                px-10 py-3 rounded-full font-serif tracking-[0.3em] text-[10px] transition-all duration-700 relative overflow-hidden group uppercase border
                ${isStepValid() 
                  ? 'bg-mystic-gold/5 border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/10 hover:border-mystic-gold hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] hover:scale-105' 
                  : 'bg-transparent border-white/5 text-white/10 cursor-not-allowed'}
              `}
            >
              <span className="relative z-10">{step === 3 ? 'ATIVAR PORTAL' : 'CONTINUAR'}</span>
              {isStepValid() && <div className="absolute inset-0 bg-mystic-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
            </button>
          </div>
          
          <div className="mt-10 flex justify-center gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-[2px] rounded-full transition-all duration-1000 ${i <= step ? 'w-6 bg-mystic-gold/80 shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'w-2 bg-white/5'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;