import React, { useState, useEffect } from 'react';
import { UserProfile, PortalConfig, ViewState } from './types';
import { getProfile } from './services/storage';
import { soundManager } from './services/soundService';
import { initializeTheme } from './services/themeService';
import { PORTALS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PortalView from './components/PortalView';
import History from './components/History';
import UniverseConsultant from './components/UniverseConsultant';
import TarotGrimoire from './components/TarotGrimoire';
import MetatronView from './components/MetatronView';
import { GetIcon } from './components/Icons';
import { Logo } from './components/Logo';
import StarField from './components/StarField';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('ONBOARDING');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePortal, setActivePortal] = useState<PortalConfig | null>(null);
  const [preselectedInput, setPreselectedInput] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(soundManager.getMuteState());
  const [isAmbient, setIsAmbient] = useState(soundManager.getAmbientState());
  
  // Transition State: 'idle' (hidden), 'active' (covering screen)
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Set dynamic colors based on time of day
    initializeTheme();

    const savedProfile = getProfile();
    if (savedProfile) {
      setProfile(savedProfile);
      setView('DASHBOARD');
    }
    setLoading(false);
  }, []);

  // Initialize Audio on first interaction if not already active
  const handleInteraction = () => {
      soundManager.init();
      window.removeEventListener('click', handleInteraction);
  };

  useEffect(() => {
      window.addEventListener('click', handleInteraction);
      return () => window.removeEventListener('click', handleInteraction);
  }, [view]);

  const toggleMute = () => {
      soundManager.init(); // Ensure init
      soundManager.toggleMute();
      setIsMuted(soundManager.getMuteState());
  };

  const toggleAmbient = () => {
      soundManager.init();
      const newState = soundManager.toggleAmbient();
      setIsAmbient(newState);
  };

  // --- MYSTIC TRANSITION HANDLER ---
  const navigateWithTransition = (callback: () => void) => {
      soundManager.playTransition();
      setIsTransitioning(true); // Fade In Overlay
      
      // Wait for cover up
      setTimeout(() => {
          callback(); // Change the actual View state
          window.scrollTo(0, 0); // Reset scroll
          
          // Wait a brief moment in the void before revealing
          setTimeout(() => {
              setIsTransitioning(false); // Fade Out Overlay
          }, 600);
          
      }, 800); // Duration matches CSS transition
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    soundManager.playReveal(); 
    navigateWithTransition(() => setView('DASHBOARD'));
  };

  const handlePortalSelect = (portal: PortalConfig) => {
    navigateWithTransition(() => {
        setActivePortal(portal);
        setPreselectedInput(undefined); 
        setView('PORTAL');
    });
  };

  const handleClosePortal = () => {
    soundManager.playClick();
    navigateWithTransition(() => {
        setActivePortal(null);
        setPreselectedInput(undefined);
        setView('DASHBOARD');
    });
  };

  const handleViewChange = (newView: ViewState) => {
      // Small logic to prevent redundant transitions
      if (view === newView) return;
      
      navigateWithTransition(() => {
          setView(newView);
      });
  }

  const handleGrimoireSelection = (cardName: string) => {
      const tarotPortal = PORTALS.find(p => p.id === 'tarot');
      if (tarotPortal) {
          navigateWithTransition(() => {
              setActivePortal(tarotPortal);
              setPreselectedInput(cardName);
              setView('PORTAL');
          });
      }
  };

  if (loading) {
    return <div className="min-h-screen bg-mystic-dark" />;
  }

  return (
    <>
      <StarField />
      
      {/* --- MYSTIC TRANSITION OVERLAY --- */}
      {/* This element sits on top of everything (z-[100]) and fades in/out to mask View changes */}
      <div 
        className={`fixed inset-0 z-[100] bg-[#03000a] flex items-center justify-center transition-opacity duration-700 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
          {/* Visuals inside the void */}
          <div className={`relative transition-transform duration-1000 ${isTransitioning ? 'scale-100' : 'scale-150'}`}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-mystic-gold/10 rounded-full blur-[50px] animate-pulse-slow"></div>
              <Logo className="w-20 h-20 text-mystic-gold opacity-80 animate-spin-slow" />
          </div>
      </div>

      {/* Sound Controls */}
      <div className="fixed top-6 right-6 z-[60] flex gap-2">
        <button 
          onClick={toggleAmbient}
          className={`p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${isAmbient ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-black/20 border-white/10 text-mystic-ethereal/50 hover:text-mystic-gold'}`}
          title="Frequência de Fundo (432Hz)"
        >
          <GetIcon name="Waves" className="w-5 h-5" />
        </button>

        <button 
          onClick={toggleMute}
          className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-mystic-ethereal/50 hover:text-mystic-gold hover:border-mystic-gold/30 transition-all duration-300"
          title="Mudo"
        >
          <GetIcon name={isMuted ? "VolumeX" : "Volume2"} className="w-5 h-5" />
        </button>
      </div>

      {view === 'ONBOARDING' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {view === 'DASHBOARD' && profile && (
        <Dashboard 
          user={profile} 
          onSelectPortal={handlePortalSelect}
          onOpenHistory={() => handleViewChange('HISTORY')}
          onOpenUniverse={() => handleViewChange('UNIVERSE')}
          onOpenGrimoire={() => handleViewChange('TAROT_GRIMOIRE')}
          onOpenMetatron={() => handleViewChange('METATRON')}
        />
      )}

      {view === 'PORTAL' && activePortal && profile && (
        <PortalView 
          portal={activePortal} 
          user={profile} 
          onClose={handleClosePortal} 
          initialInput={preselectedInput}
        />
      )}

      {view === 'HISTORY' && (
        <History onBack={() => handleViewChange('DASHBOARD')} />
      )}

      {view === 'UNIVERSE' && profile && (
        <UniverseConsultant 
          user={profile} 
          onClose={() => handleViewChange('DASHBOARD')} 
        />
      )}

      {view === 'TAROT_GRIMOIRE' && (
          <TarotGrimoire 
            onSelectCard={handleGrimoireSelection}
            onClose={() => handleViewChange('DASHBOARD')}
          />
      )}

      {view === 'METATRON' && profile && (
          <MetatronView 
            user={profile}
            onClose={() => handleViewChange('DASHBOARD')}
          />
      )}
    </>
  );
};

export default App;