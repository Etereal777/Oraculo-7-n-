import React from 'react';
import { 
  Ghost, Waves, CircleDot, Sparkles, Moon, Star, Flame, RefreshCw, Eye, 
  GalleryVerticalEnd, Map, Hash, BookOpen, Compass, History, Book, ChevronLeft,
  Orbit, ArrowRight, X, Volume2, VolumeX, Camera, Upload, Share2, CloudMoon, Landmark,
  Mic, MicOff, Hexagon, Triangle, BoxSelect, Calendar, Sun, Layers, Infinity, Mountain, Dna, Binary, Eclipse,
  Flower2, Fingerprint
} from 'lucide-react';

export const IconMap: Record<string, React.ElementType> = {
  Ghost, Waves, CircleDot, Sparkles, Moon, Star, Flame, RefreshCw, Eye, 
  GalleryVerticalEnd, Map, Hash, BookOpen, Compass, History, Book, ChevronLeft,
  Orbit, ArrowRight, X, Volume2, VolumeX, Camera, Upload, Share2, CloudMoon, Landmark,
  Mic, MicOff, Hexagon, Triangle, BoxSelect, Calendar, Sun, Layers, Infinity, Mountain, Dna, Binary, Eclipse,
  Flower2, Fingerprint
};

export const GetIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = IconMap[name] || Sparkles;
  return <Icon className={className} />;
};