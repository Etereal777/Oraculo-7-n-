import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  life: number; // 1.0 to 0.0
  size: number;
}

const SpiritCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const particlesRef = useRef<Point[]>([]);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    // --- OTIMIZAÇÃO MOBILE ---
    // Verifica se o dispositivo possui um ponteiro preciso (Mouse/Trackpad).
    // Dispositivos 'coarse' (Touch) não executarão este efeito para economizar bateria e limpar a UI.
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Mouse handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      // Add particles on move for density
      addParticle(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Particle logic
    const addParticle = (x: number, y: number) => {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 5, // Slight scatter
        y: y + (Math.random() - 0.5) * 5,
        life: 1.0,
        size: Math.random() * 2 + 1
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add a particle at current mouse pos continuously for trails even when moving slowly
      if (mouseRef.current.x > 0) {
          if (Math.random() > 0.5) addParticle(mouseRef.current.x, mouseRef.current.y);
      }

      // Update and Draw particles
      particlesRef.current.forEach((p, index) => {
        p.life -= 0.02; // Decay rate
        p.y -= 0.5; // Slight rise like smoke

        if (p.life <= 0) {
          particlesRef.current.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          
          // Gradient Gold to Transparent
          const opacity = p.life * 0.6;
          ctx.fillStyle = `rgba(212, 175, 55, ${opacity})`;
          ctx.fill();
        }
      });

      // Optional: Draw a subtle glow at cursor tip
      if (mouseRef.current.x > 0) {
          const glow = ctx.createRadialGradient(
              mouseRef.current.x, mouseRef.current.y, 0,
              mouseRef.current.x, mouseRef.current.y, 20
          );
          glow.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
          glow.addColorStop(1, 'rgba(212, 175, 55, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(mouseRef.current.x, mouseRef.current.y, 20, 0, Math.PI * 2);
          ctx.fill();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999] mix-blend-screen"
      style={{ touchAction: 'none' }} 
    />
  );
};

export default SpiritCursor;