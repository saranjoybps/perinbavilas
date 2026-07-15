'use client';

import { useEffect, useRef } from 'react';

/**
 * FloatingParticles — subtle light dust / bokeh particles floating upward.
 * Rendered on a canvas for zero DOM overhead.
 */
export default function FloatingParticles({ count = 28, color = 'rgba(212,175,55,0.22)' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed particles
    const particles = Array.from({ length: count }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       Math.random() * 2.5 + 0.8,
      speed:   Math.random() * 0.28 + 0.08,
      opacity: Math.random() * 0.5 + 0.15,
      drift:   (Math.random() - 0.5) * 0.3,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color.replace('0.22)', `${p.opacity})`);
        ctx.fill();

        p.y     -= p.speed;
        p.x     += p.drift;
        p.opacity -= 0.0003;

        if (p.y < -10 || p.opacity <= 0) {
          p.x       = Math.random() * canvas.width;
          p.y       = canvas.height + 10;
          p.opacity = Math.random() * 0.5 + 0.15;
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
