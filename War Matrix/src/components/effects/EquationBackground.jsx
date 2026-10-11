import React, { useEffect, useRef } from 'react';

export default function EquationBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const equations = [
      'E=mc²', 'F=ma', 'a²+b²=c²', 'x²-y²', '∫f(x)dx',
      'Σ(x)', '∂f/∂x', '√(x+y)', 'sin(θ)', 'cos(α)',
      'tan(β)', 'log(x)', 'e^x', 'π≈3.14', 'φ=1.618'
    ];

    const columns = Math.floor(canvas.width / 80);
    const drops = Array(columns).fill(1);

    function draw() {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00d4ff';
      ctx.font = '14px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = equations[Math.floor(Math.random() * equations.length)];
        ctx.fillText(text, i * 80, drops[i] * 25);

        if (drops[i] * 25 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 80);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-15 z-0"
    />
  );
}