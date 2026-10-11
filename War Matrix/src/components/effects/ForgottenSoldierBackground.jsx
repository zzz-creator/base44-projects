import React, { useEffect, useRef } from 'react';

export default function ForgottenSoldierBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ranks = ['Pvt.', 'Cpl.', 'Sgt.', 'Lt.', 'Capt.', 'Maj.', 'Col.'];
    const firstNames = ['John', 'James', 'William', 'Robert', 'Thomas', 'George', 'Charles', 'Frank', 'Joseph', 'Henry'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'];
    const years = ['1914', '1915', '1916', '1917', '1918', '1939', '1940', '1941', '1942', '1943', '1944', '1945'];

    const columns = Math.floor(canvas.width / 200);
    const drops = Array(columns).fill(1);

    function generateSoldier() {
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const year = years[Math.floor(Math.random() * years.length)];
      return `${rank} ${firstName} ${lastName} †${year}`;
    }

    function draw() {
      ctx.fillStyle = 'rgba(10, 14, 39, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#8b7355';
      ctx.font = '12px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = generateSoldier();
        ctx.fillText(text, i * 200, drops[i] * 30);

        if (drops[i] * 30 > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 100);

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
      className="fixed inset-0 pointer-events-none opacity-25 z-0"
    />
  );
}