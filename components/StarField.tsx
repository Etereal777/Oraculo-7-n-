import React, { useEffect, useRef } from 'react';

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number; y: number; size: number; speed: number; opacity: number; dir: number }[] = [];
    const particleCount = 60; // Not too crowded

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.5 + 0.1,
        dir: Math.random() > 0.5 ? 1 : -1
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        // Move particle
        p.y -= p.speed;
        p.x += Math.sin(p.y * 0.01) * 0.1 * p.dir;

        // Reset if out of bounds
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Gold tint
        const gold = '212, 175, 55';
        const white = '255, 255, 255';
        const color = Math.random() > 0.7 ? gold : white;
        
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
        
        // Twinkle
        if (Math.random() > 0.98) {
            p.opacity = Math.random() * 0.5 + 0.1;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[-1]" />;
};

export default StarField;