import React, { useState } from 'react';
import { UserProfile } from '../types';
import { saveProfile } from '../services/storage';
import { soundManager } from '../services/soundService';
import { Logo } from './Logo';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [quest, setQuest] = useState('');
  const [step, setStep] = useState(1);

  // Date Helpers
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
      {val: '01', label: 'Janeiro'}, {val: '02', label: 'Fevereiro'}, {val: '03', label: 'Março'}, 
      {val: '04', label: 'Abril'}, {val: '05', label: 'Maio'}, {val: '06', label: 'Junho'},
      {val: '07', label: 'Julho'}, {val: '08', label: 'Agosto'}, {val: '09', label: 'Setembro'}, 
      {val: '10', label: 'Outubro'}, {val: '11', label: 'Novembro'}, {val: '12', label: 'Dezembro'}
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 100}, (_, i) => (currentYear - i).toString());

  // Parse current selection
  const [selYear, selMonth, selDay] = birthDate ? birthDate.split('-') : ['', '', ''];

  const handleDatePartChange = (part: 'day' | 'month' | 'year', val: string) => {
      let y = selYear || '2000';
      let m = selMonth || '01';
      let d = selDay || '01';
      
      if (part === 'day') d = val;
      if (part === 'month') m = val;
      if (part === 'year') y = val;

      setBirthDate(`${y}-${m}-${d}`);
  };

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isStepValid()) {
        handleNext();
    }
  }

  const isStepValid = () => {
    if (step === 1) return name.length > 2;
    if (step === 2) return true; // Birthdate optional
    if (step === 3) return quest.length > 3;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-mystic-dark">
      
      {/* --- Ambient Background Layers --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-mystic-deep)_0%,_#000000_100%)] z-0 pointer-events-none"></div>
      
      {/* Central Nebula */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mystic-gold/5 rounded-full blur-[120px] animate-pulse-slow pointer-events-none z-0"></div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center transition-all duration-1000">
        
        {/* Header: Logo & Identity */}
        <div className={`flex flex-col items-center mb-16 transition-transform duration-700 ${step > 1 ? 'scale-90 opacity-80' : 'scale-100'}`}>
           <div className="relative mb-8">
              <div className="absolute inset-0 bg-mystic-gold/20 blur-[30px] rounded-full animate-pulse-slow"></div>
              <Logo className="w-20 h-20 text-mystic-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] relative z-10" />
           </div>
           
           <h1 className="font-serif text-4xl md:text-5xl tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-mystic-ethereal via-mystic-gold to-mystic-amber text-center pl-4 drop-shadow-sm">
             ORÁCULO<span className="text-mystic-gold font-light">7</span>
           </h1>
           <div className="mt-4 flex items-center gap-4 opacity-50">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-mystic-gold"></div>
              <span className="text-[9px] font-sans tracking-[0.5em] uppercase text-mystic-ethereal">Iniciação</span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-mystic-gold"></div>
           </div>
        </div>

        {/* Input Card Area */}
        <div className="w-full min-h-[300px] flex flex-col items-center relative">
            
            {/* Step 1: Name */}
            {step === 1 && (
                <div className="w-full animate-fade-in flex flex-col items-center">
                    <label className="text-mystic-ethereal/60 font-sans text-xs tracking-[0.4em] uppercase mb-8">
                        Como a energia lhe reconhece?
                    </label>
                    <div className="relative w-full group">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Seu Nome"
                            className="w-full bg-transparent border-b border-white/10 py-4 text-center text-3xl md:text-4xl text-mystic-gold font-reading italic focus:outline-none focus:border-mystic-gold/50 transition-all duration-500 placeholder-white/5"
                            autoFocus
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-mystic-gold group-hover:w-1/2 transition-all duration-700 opacity-50"></div>
                    </div>
                </div>
            )}

            {/* Step 2: Birth Date (Custom Selects) */}
            {step === 2 && (
                <div className="w-full animate-fade-in flex flex-col items-center">
                    <label className="text-mystic-ethereal/60 font-sans text-xs tracking-[0.4em] uppercase mb-8">
                        Seu marco temporal de chegada
                    </label>
                    
                    <div className="w-full flex flex-col gap-4 max-w-sm">
                        <div className="flex gap-4">
                            {/* Day Selector */}
                            <div className="relative w-1/3 group">
                                <select
                                    value={selDay}
                                    onChange={(e) => handleDatePartChange('day', e.target.value)}
                                    className="w-full appearance-none bg-transparent border-b border-white/10 py-3 text-center text-xl md:text-2xl text-mystic-gold font-reading focus:outline-none focus:border-mystic-gold/50 transition-all rounded-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-mystic-dark text-gray-500">Dia</option>
                                    {days.map(d => <option key={d} value={d} className="bg-mystic-dark text-mystic-gold">{d}</option>)}
                                </select>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-mystic-gold/50 transition-colors">
                                   <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>

                            {/* Month Selector */}
                            <div className="relative w-2/3 group">
                                <select
                                    value={selMonth}
                                    onChange={(e) => handleDatePartChange('month', e.target.value)}
                                    className="w-full appearance-none bg-transparent border-b border-white/10 py-3 text-center text-xl md:text-2xl text-mystic-gold font-reading focus:outline-none focus:border-mystic-gold/50 transition-all rounded-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-mystic-dark text-gray-500">Mês</option>
                                    {months.map(m => <option key={m.val} value={m.val} className="bg-mystic-dark text-mystic-gold">{m.label}</option>)}
                                </select>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-mystic-gold/50 transition-colors">
                                   <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Year Selector */}
                        <div className="relative w-full group">
                             <select
                                value={selYear}
                                onChange={(e) => handleDatePartChange('year', e.target.value)}
                                className="w-full appearance-none bg-transparent border-b border-white/10 py-3 text-center text-xl md:text-2xl text-mystic-gold font-reading focus:outline-none focus:border-mystic-gold/50 transition-all rounded-none tracking-widest cursor-pointer"
                            >
                                <option value="" disabled className="bg-mystic-dark text-gray-500">Ano</option>
                                {years.map(y => <option key={y} value={y} className="bg-mystic-dark text-mystic-gold">{y}</option>)}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-mystic-gold/50 transition-colors">
                               <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                        </div>
                    </div>
                    
                    <p className="mt-12 text-[9px] text-white/20 font-sans tracking-[0.2em] uppercase">
                        (Opcional • Para cálculos astrais)
                    </p>
                </div>
            )}

            {/* Step 3: Quest */}
            {step === 3 && (
                <div className="w-full animate-fade-in flex flex-col items-center">
                    <label className="text-mystic-ethereal/60 font-sans text-xs tracking-[0.4em] uppercase mb-8">
                        Qual a sua busca sagrada?
                    </label>
                    <div className="relative w-full group">
                        <textarea
                            value={quest}
                            onChange={(e) => setQuest(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if(isStepValid()) handleNext(); } }}
                            placeholder="Clareza, propósito, cura..."
                            rows={2}
                            className="w-full bg-transparent border-b border-white/10 py-4 text-center text-2xl md:text-3xl text-mystic-gold font-reading italic focus:outline-none focus:border-mystic-gold/50 transition-all duration-500 placeholder-white/5 resize-none leading-relaxed"
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {/* Navigation Controls */}
            <div className="mt-16 flex flex-col items-center gap-8 w-full">
                
                {/* Primary Action Button */}
                <button
                    onClick={handleNext}
                    onMouseEnter={() => soundManager.playHover()}
                    disabled={!isStepValid()}
                    className={`
                        group relative px-12 py-4 rounded-full transition-all duration-700
                        ${isStepValid() 
                            ? 'cursor-pointer' 
                            : 'cursor-not-allowed opacity-30 blur-[1px]'}
                    `}
                >
                    {/* Button Background & Border */}
                    <div className="absolute inset-0 rounded-full border border-mystic-gold/30 bg-mystic-gold/5 group-hover:bg-mystic-gold/10 group-hover:border-mystic-gold/60 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]"></div>
                    
                    {/* Inner Glow on Hover */}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.2)_0%,_transparent_70%)] transition-opacity duration-500 blur-md"></div>

                    {/* Button Text */}
                    <span className={`relative z-10 font-serif text-xs tracking-[0.3em] uppercase transition-colors duration-300 ${isStepValid() ? 'text-mystic-gold group-hover:text-white' : 'text-white/40'}`}>
                        {step === 3 ? 'Abrir Portal' : 'Continuar'}
                    </span>
                </button>

                {/* Elegant Progress Dots */}
                <div className="flex gap-4 items-center">
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i} 
                            className={`transition-all duration-700 rounded-full 
                                ${i === step 
                                    ? 'w-2 h-2 bg-mystic-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]' 
                                    : i < step 
                                        ? 'w-1.5 h-1.5 bg-mystic-gold/40' 
                                        : 'w-1 h-1 bg-white/10'
                                }
                            `}
                        />
                    ))}
                </div>
            </div>

        </div>

        {/* Footer Ambient Text */}
        <div className="absolute bottom-4 w-full flex flex-col items-center gap-1 text-[8px] md:text-[9px] font-sans tracking-[0.2em] text-white/10 uppercase select-none pointer-events-none z-20">
            <span>Sintonia v7.0</span>
            <span>Todos os direitos reservados André Miguel Herman 2025</span>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;