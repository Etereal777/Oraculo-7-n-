// Definição da Paleta Original (Harmônica e Estável)
// Baseada nos valores iniciais do index.html para garantir consistência visual.

const STANDARD_PALETTE = {
  dark: '#030005',       // Absolute Void with subtle warmth
  deep: '#0a050e',       // Deep Purple/Black base
  plum: '#1a1025',       // Rich Shadow
  indigo: '#151020',     // Cold Shadow
  gold: '#D4AF37',       // Antique Gold
  amber: '#B8860B',      // Dark Amber
  ethereal: '#E8E8E3',   // Bone White
  void: '#000000',       // Absolute Black
};

export const initializeTheme = () => {
  const root = document.documentElement;
  
  // Aplica a paleta padrão nas variáveis CSS
  // Isso garante que tanto o Tailwind quanto os estilos inline usem as mesmas cores
  root.style.setProperty('--color-mystic-dark', STANDARD_PALETTE.dark);
  root.style.setProperty('--color-mystic-deep', STANDARD_PALETTE.deep);
  root.style.setProperty('--color-mystic-plum', STANDARD_PALETTE.plum);
  root.style.setProperty('--color-mystic-indigo', STANDARD_PALETTE.indigo);
  root.style.setProperty('--color-mystic-gold', STANDARD_PALETTE.gold);
  root.style.setProperty('--color-mystic-amber', STANDARD_PALETTE.amber);
  root.style.setProperty('--color-mystic-ethereal', STANDARD_PALETTE.ethereal);
  root.style.setProperty('--color-mystic-void', STANDARD_PALETTE.void);

  console.log(`Oráculo 7: Paleta Original Harmonizada Aplicada`);
};