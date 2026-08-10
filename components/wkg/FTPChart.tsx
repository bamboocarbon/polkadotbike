'use client';

import { useEffect, useRef } from 'react';
import { CATS, LBS, type Gender, type WeightUnit } from '@/lib/wkg';

interface FTPChartProps {
  ftp: number;
  bodyKg: number;
  gender: Gender;
  unit: WeightUnit;
  catColor: string;
}

// Direct port of the source's drawFTPChart() — same padding, domain, and
// drawing order, just typed and using a canvas ref instead of
// document.getElementById. Kept as one big draw function (not decomposed)
// deliberately, so it stays diffable against the original if the source
// ever needs re-checking.
export default function FTPChart({ ftp, bodyKg, gender, unit, catColor }: FTPChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.offsetWidth;
      if (!W) return;
      const dpr = window.devicePixelRatio || 1;
      const H = 232;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = H + 'px';
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const PAD = { top: 22, right: 62, bottom: 32, left: 44 };
      const cW = W - PAD.left - PAD.right;
      const cH = H - PAD.top - PAD.bottom;
      const WMin = 40, WMax = 130, FMin = 60, FMax = 500;
      const xOf = (kg: number) => PAD.left + ((kg - WMin) / (WMax - WMin)) * cW;
      const yOf = (w: number) => PAD.top + cH - ((w - FMin) / (FMax - FMin)) * cH;
      const cats = CATS[gender];

      ctx.save();
      ctx.beginPath();
      ctx.rect(PAD.left, PAD.top, cW, cH);
      ctx.clip();

      // category band fills
      cats.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(xOf(WMin), yOf(c.min * WMin));
        ctx.lineTo(xOf(WMax), yOf(c.min * WMax));
        ctx.lineTo(xOf(WMax), yOf(c.max * WMax));
        ctx.lineTo(xOf(WMin), yOf(c.max * WMin));
        ctx.closePath();
        ctx.fillStyle = c.color + '1a';
        ctx.fill();
      });

      // subtle gridlines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      [100, 200, 300, 400].forEach((f) => {
        ctx.beginPath();
        ctx.moveTo(PAD.left, yOf(f));
        ctx.lineTo(PAD.left + cW, yOf(f));
        ctx.stroke();
      });

      // W/kg threshold lines
      cats.forEach((c) => {
        if (c.min === 0) return;
        let x1 = WMin, y1 = c.min * WMin, x2 = WMax, y2 = c.min * WMax;
        if (y1 > FMax) { x1 = FMax / c.min; y1 = FMax; }
        if (y2 > FMax) { x2 = FMax / c.min; y2 = FMax; }
        if (y1 < FMin) { x1 = FMin / c.min; y1 = FMin; }
        if (y2 < FMin) { x2 = FMin / c.min; y2 = FMin; }
        if (x1 > WMax || x2 < WMin) return;
        ctx.beginPath();
        ctx.moveTo(xOf(x1), yOf(y1));
        ctx.lineTo(xOf(x2), yOf(y2));
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.stroke();
      });

      // crosshairs
      const ux = xOf(bodyKg), uy = yOf(Math.min(Math.max(ftp, FMin), FMax));
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(PAD.left, uy); ctx.lineTo(ux, uy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, PAD.top + cH); ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore(); // end clip

      // category labels
      cats.forEach((c) => {
        if (c.min === 0) return;
        const yAtRight = c.min * WMax;
        ctx.font = '600 9px Inter, system-ui, sans-serif';
        if (yAtRight <= FMax && yAtRight >= FMin) {
          ctx.fillStyle = c.color;
          ctx.textAlign = 'left';
          ctx.fillText(c.label, xOf(WMax) + 5, yOf(yAtRight) + 3);
        } else if (yAtRight > FMax) {
          const exitX = FMax / c.min;
          if (exitX >= WMin && exitX <= WMax) {
            ctx.fillStyle = c.color;
            ctx.textAlign = 'center';
            ctx.fillText(c.label, xOf(exitX), PAD.top - 5);
          }
        }
      });

      // axis labels
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      [100, 200, 300, 400, 500].forEach((f) => ctx.fillText(String(f), PAD.left - 6, yOf(f) + 3));
      ctx.save();
      ctx.translate(11, PAD.top + cH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.font = '600 9px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Power (W)', 0, 0);
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      [50, 60, 70, 80, 90, 100, 110, 120].forEach((kg) => {
        ctx.fillText(unit === 'lbs' ? String(Math.round(kg * LBS)) : String(kg), xOf(kg), PAD.top + cH + 16);
      });
      ctx.fillStyle = '#64748b';
      ctx.font = '600 9px Inter, system-ui, sans-serif';
      ctx.fillText(unit === 'lbs' ? 'body weight (lbs)' : 'body weight (kg)', PAD.left + cW / 2, PAD.top + cH + 29);

      // chart border
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD.left, PAD.top, cW, cH);

      // user dot
      const g = ctx.createRadialGradient(ux, uy, 0, ux, uy, 14);
      g.addColorStop(0, catColor + '50');
      g.addColorStop(1, catColor + '00');
      ctx.beginPath(); ctx.arc(ux, uy, 14, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(ux, uy, 7, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ux, uy, 4, 0, Math.PI * 2); ctx.fillStyle = catColor; ctx.fill();
    }

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [ftp, bodyKg, gender, unit, catColor]);

  return <canvas id="ftp-chart" ref={canvasRef} style={{ width: '100%', display: 'block' }} />;
}
