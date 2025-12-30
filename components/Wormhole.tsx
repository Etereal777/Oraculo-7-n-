import React, { useEffect, useRef } from 'react';

const Wormhole: React.FC = () => {
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

        const stars: { x: number, y: number, z: number }[] = [];
        const STAR_COUNT = 800;
        const SPEED = 25;

        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: (Math.random() - 0.5) * width * 2,
                y: (Math.random() - 0.5) * height * 2,
                z: Math.random() * width
            });
        }

        let frameId = 0;

        const render = () => {
            ctx.fillStyle = '#030005';
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            stars.forEach(star => {
                star.z -= SPEED;
                if (star.z <= 0) {
                    star.z = width;
                    star.x = (Math.random() - 0.5) * width * 2;
                    star.y = (Math.random() - 0.5) * height * 2;
                }

                const scale = 200 / star.z;
                const sx = cx + star.x * scale;
                const sy = cy + star.y * scale;

                const radius = Math.max(0, (1 - star.z / width) * 4);

                ctx.beginPath();
                ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${1 - star.z / width})`;
                ctx.fill();
            });

            frameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(frameId);
    }, []);

    return (
        <canvas ref={canvasRef} className="fixed inset-0 z-[90] pointer-events-none" />
    );
};

export default Wormhole;