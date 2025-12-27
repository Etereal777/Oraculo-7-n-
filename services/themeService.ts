// Definição das paletas de cores baseadas no ciclo circadiano místico
const PALETTES = {
  // 05:00 - 11:00 (Renascimento, Brumas, Ouro Pálido)
  DAWN: {
    dark: '#0f172a',       // Slate 900
    deep: '#1e293b',       // Slate 800
    plum: '#334155',       // Slate 700 (Shifted to Blue-Grey)
    indigo: '#475569',     // Slate 600
    gold: '#fcd34d',       // Amber 300 (Soft Morning Sun)
    amber: '#fbbf24',      // Amber 400
    ethereal: '#f1f5f9',   // Slate 100
    void: '#020617',       // Slate 950
  },
  // 11:00 - 17:00 (Clareza, Sol Pleno, Azul Profundo)
  ZENITH: {
    dark: '#000000',       // Pure Black contrast
    deep: '#0c0a09',       // Stone 950
    plum: '#1c1917',       // Stone 900
    indigo: '#292524',     // Stone 800
    gold: '#fbbf24',       // Amber 400 (Bright Sun)
    amber: '#d97706',      // Amber 600
    ethereal: '#fafaf9',   // Stone 50
    void: '#000000',
  },
  // 17:00 - 20:00 (Transição, Roxo Profundo, Laranja Queimado)
  DUSK: {
    dark: '#2e1065',       // Violet 950
    deep: '#4c1d95',       // Violet 900
    plum: '#581c87',       // Purple 900
    indigo: '#6b21a8',     // Purple 800
    gold: '#fca5a5',       // Red 300 (Pinkish sunset)
    amber: '#f87171',      // Red 400
    ethereal: '#e9d5ff',   // Purple 100
    void: '#1e1b4b',       // Indigo 950
  },
  // 20:00 - 05:00 (O Original: Vazio, Índigo, Ouro Místico)
  VOID: {
    dark: '#030014',       // Void black
    deep: '#0f0c29',       // Deep background base
    plum: '#240b36',       // Rich dark purple
    indigo: '#302b63',     // Deep indigo
    gold: '#FFD700',       // Bright Gold
    amber: '#d69e2e',      // Muted Amber
    ethereal: '#E0E7FF',   // White/Blue mist
    void: '#000000',       // Absolute Void
  }
};

export const initializeTheme = () => {
  const hour = new Date().getHours();
  let theme = PALETTES.VOID; // Default Night

  if (hour >= 5 && hour < 11) {
    theme = PALETTES.DAWN;
  } else if (hour >= 11 && hour < 17) {
    theme = PALETTES.ZENITH;
  } else if (hour >= 17 && hour < 20) {
    theme = PALETTES.DUSK;
  }
  // Else stays VOID (20:00 - 05:00)

  const root = document.documentElement;
  
  // Inject CSS Variables
  root.style.setProperty('--color-mystic-dark', theme.dark);
  root.style.setProperty('--color-mystic-deep', theme.deep);
  root.style.setProperty('--color-mystic-plum', theme.plum);
  root.style.setProperty('--color-mystic-indigo', theme.indigo);
  root.style.setProperty('--color-mystic-gold', theme.gold);
  root.style.setProperty('--color-mystic-amber', theme.amber);
  root.style.setProperty('--color-mystic-ethereal', theme.ethereal);
  root.style.setProperty('--color-mystic-void', theme.void);

  console.log(`Oráculo 7 Environment: ${hour}h - Theme Applied`);
};