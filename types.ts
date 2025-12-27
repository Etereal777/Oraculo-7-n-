
export interface UserProfile {
  name: string;
  birthDate?: string;
  quest: string;
  createdAt: number;
}

export enum PortalCategory {
  PRESENCE = 'Presença',
  SUBTLE = 'Sintonias Sutis',
  DEEP = 'Grandes Portais',
}

export enum InputType {
  NONE = 'none', // Just click to activate
  TEXT = 'text', // User types something
  SELECTION = 'selection', // User picks from a list
  DATE = 'date', // Date picker
  IMAGE = 'image', // Image upload for multimodal analysis
  LOCATION = 'location', // Geolocation for grounding
}

export interface PortalConfig {
  id: string;
  title: string;
  description: string;
  category: PortalCategory;
  icon: string; // Lucide icon name
  inputType: InputType;
  options?: string[]; // For selection type
  promptContext: string; // Instructions for the AI
}

export interface Reading {
  id: string;
  portalId: string;
  portalName: string;
  timestamp: number;
  userInput?: string;
  response: string;
  notes?: string; // Journaling field
}

export type ViewState = 'ONBOARDING' | 'DASHBOARD' | 'PORTAL' | 'HISTORY' | 'UNIVERSE' | 'TAROT_GRIMOIRE' | 'METATRON';