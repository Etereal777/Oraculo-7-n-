import React from 'react';
import { 
  Ghost, Waves, CircleDot, Sparkles, Moon, Star, Flame, RefreshCw, Eye, 
  GalleryVerticalEnd, Map, Hash, BookOpen, Compass, History, Book, ChevronLeft,
  Orbit, ArrowRight, X, Volume2, VolumeX, Camera, Upload, Share2, CloudMoon, Landmark,
  Mic, MicOff, Hexagon, Triangle, BoxSelect, Calendar, Sun, Layers, Infinity, Mountain, Dna, Binary, Eclipse,
  Flower2, Fingerprint, Download, Zap, Hourglass, User, Sprout, Activity
} from 'lucide-react';

export const IconMap: Record<string, React.ElementType> = {
  Ghost, Waves, CircleDot, Sparkles, Moon, Star, Flame, RefreshCw, Eye, 
  GalleryVerticalEnd, Map, Hash, BookOpen, Compass, History, Book, ChevronLeft,
  Orbit, ArrowRight, X, Volume2, VolumeX, Camera, Upload, Share2, CloudMoon, Landmark,
  Mic, MicOff, Hexagon, Triangle, BoxSelect, Calendar, Sun, Layers, Infinity, Mountain, Dna, Binary, Eclipse,
  Flower2, Fingerprint, Download, Zap, Hourglass, User, Sprout, Activity
};

export const GetIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = IconMap[name] || Sparkles;
  
  let finalClass = className;

  // Lógica de Identidade Visual Específica
  // Garante que o ícone de DNA (Semente Estelar) brilhe sempre em Azul Etéreo
  if (name === 'Dna') {
      // Se a classe original for dourada (padrão dos portais), forçamos o azul
      if (finalClass?.includes('text-mystic-gold')) {
          finalClass = finalClass.replace('text-mystic-gold', 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]');
      } 
      // Se for uma cor genérica ou escura, aplicamos o brilho etéreo
      else if (finalClass?.includes('text-mystic-ethereal')) {
           finalClass = finalClass.replace('text-mystic-ethereal', 'text-cyan-200');
      }
  }

  return <Icon className={finalClass} />;
};