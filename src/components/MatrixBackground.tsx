import React, { useEffect, useRef } from 'react';

const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%^&*()_+~`|}{[]:;?><,./-='.split('');
    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = [];
    
    const initDrops = () => {
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let x = 0; x < columns; x++) {
        drops[x] = Math.random() * (height / fontSize);
      }
    };
    initDrops();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initDrops();
    };
    window.addEventListener('resize', handleResize);

    const particles: { x: number, y: number, vx: number, vy: number, radius: number, color: string }[] = [];
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 100 + 50,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`
      });
    }

    let hue = 0;
    let animationFrameId: number;

    const draw = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(9, 9, 11, 0.15)'; 
      ctx.fillRect(0, 0, width, height);

      // Update particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.radius) p.vx = Math.abs(p.vx);
        if (p.x > width + p.radius) p.vx = -Math.abs(p.vx);
        if (p.y < -p.radius) p.vy = Math.abs(p.vy);
        if (p.y > height + p.radius) p.vy = -Math.abs(p.vy);
      });

      hue = (hue + 0.5) % 360;

      ctx.font = fontSize + 'px monospace';
      ctx.textAlign = 'center';
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        let charX = i * fontSize + fontSize / 2;
        let charY = drops[i] * fontSize;

        let dxOffset = 0;
        let dyOffset = 0;
        let charColor = `hsl(${(hue + i * 5) % 360}, 100%, 50%)`;
        let isDistorted = false;

        for (const p of particles) {
          const dx = charX - p.x;
          const dy = charY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < p.radius) {
            const force = Math.pow((p.radius - dist) / p.radius, 2);
            // Push characters away from particle center
            dxOffset += (dx / dist) * force * 50;
            dyOffset += (dy / dist) * force * 50;
            charColor = p.color;
            isDistorted = true;
          }
        }

        if (isDistorted) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = charColor;
          ctx.fillStyle = '#fff';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = charColor;
        }

        ctx.fillText(text, charX + dxOffset, charY + dyOffset);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.7; // Fall speed
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-40"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default MatrixBackground;
