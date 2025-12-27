import React, { useState, useEffect, useRef } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 20, onComplete, className }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom effect during typing
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    
    // Speed up typing for long texts
    const effectiveSpeed = text.length > 500 ? 5 : speed; // Faster typing for better UX with long texts

    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      
      if (index === text.length) {
        clearInterval(intervalId);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, effectiveSpeed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  // Simple Markdown Parser for visual formatting
  const renderFormattedText = (rawText: string) => {
    // Split by newlines to handle paragraphs
    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      // 1. Headers (## Title) - Cinzel, Uppercase, Spaced
      if (line.trim().startsWith('##')) {
        const content = line.replace(/##/g, '').trim();
        return (
          <h3 key={idx} className="text-xl md:text-2xl font-serif font-medium text-mystic-gold mt-12 mb-6 border-b border-mystic-gold/10 pb-4 tracking-[0.2em] uppercase drop-shadow-md animate-fade-in text-center">
            {content}
          </h3>
        );
      }

      // 2. Lists/Bullets (* Item) - Garamond, Large
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
         const content = line.replace(/^[\*\-]\s/, '').trim();
         return (
             <div key={idx} className="flex items-start gap-4 mb-4 ml-2 md:ml-6 text-mystic-ethereal/90 animate-fade-in group">
                 <span className="text-mystic-gold mt-2.5 text-[8px] opacity-70 group-hover:text-white transition-colors">◆</span>
                 <span className="leading-loose font-reading text-xl md:text-2xl tracking-wide font-light" dangerouslySetInnerHTML={{ __html: parseBold(content) }}></span>
             </div>
         )
      }

      // 3. Numbered Lists specific to Peregrinação (1. **Nome**)
      if (/^\d+\./.test(line.trim())) {
          return (
              <div key={idx} className="mt-8 mb-8 bg-white/5 p-8 rounded-xl border-l-2 border-mystic-gold shadow-lg backdrop-blur-sm animate-fade-in relative overflow-hidden">
                  <span className="leading-loose text-xl md:text-2xl font-reading text-mystic-ethereal font-light" dangerouslySetInnerHTML={{ __html: parseBold(line) }}></span>
              </div>
          );
      }

      // 4. Empty lines (spacing)
      if (!line.trim()) {
        return <div key={idx} className="h-4"></div>;
      }

      // 5. Regular Paragraphs - Garamond, Very Readable
      return (
        <p key={idx} className="mb-6 text-mystic-ethereal font-reading text-xl md:text-2xl leading-loose font-light tracking-wide text-justify opacity-95" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
      );
    });
  };

  // Helper to turn **text** into styled spans
  const parseBold = (text: string) => {
    // Bold text becomes Cinzel (Serif), Gold, Slightly smaller but Uppercase for contrast against the flowy Garamond
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-mystic-gold font-serif text-sm md:text-base uppercase tracking-widest font-normal ml-1 mr-1">$1</strong>');
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {renderFormattedText(displayedText)}
      
      {!isComplete && (
        <div className="flex justify-center mt-8 mb-8">
             <span className="animate-pulse inline-block w-1 h-1 bg-mystic-gold/50 rounded-full mx-1"></span>
             <span className="animate-pulse inline-block w-1 h-1 bg-mystic-gold/50 rounded-full mx-1" style={{animationDelay:'0.2s'}}></span>
             <span className="animate-pulse inline-block w-1 h-1 bg-mystic-gold/50 rounded-full mx-1" style={{animationDelay:'0.4s'}}></span>
        </div>
      )}
      
      <div className="h-16"></div>
    </div>
  );
};

export default TypingEffect;