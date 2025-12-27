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
import StarField from './components/StarField';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('ONBOARDING');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePortal, setActivePortal] = useState<PortalConfig | null>(null);
  const [preselectedInput, setPreselectedInput] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(soundManager.getMuteState());
  const [isAmbient, setIsAmbient] = useState(soundManager.getAmbientState());

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

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    soundManager.playReveal(); // Celebration sound
    setView('DASHBOARD');
  };

  const handlePortalSelect = (portal: PortalConfig) => {
    soundManager.playTransition();
    setActivePortal(portal);
    setPreselectedInput(undefined); // Reset specific input
    setView('PORTAL');
  };

  const handleClosePortal = () => {
    soundManager.playClick();
    setActivePortal(null);
    setPreselectedInput(undefined);
    setView('DASHBOARD');
  };

  const handleViewChange = (newView: ViewState) => {
      soundManager.playTransition();
      setView(newView);
  }

  const handleGrimoireSelection = (cardName: string) => {
      // Find the Tarot portal config
      const tarotPortal = PORTALS.find(p => p.id === 'tarot');
      if (tarotPortal) {
          setActivePortal(tarotPortal);
          setPreselectedInput(cardName);
          soundManager.playTransition();
          setView('PORTAL');
      }
  };

  if (loading) {
    return <div className="min-h-screen bg-mystic-dark" />;
  }

  return (
    <>
      <StarField />
      
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