
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: 'bars' | 'wave' | 'circular';
  sensitivity: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isPlaying,
  mode,
  sensitivity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) {
        // Draw static visualization when not playing
        drawStaticVisualization(ctx, canvas.width, canvas.height);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      setFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      switch (mode) {
        case 'bars':
          drawBars(ctx, dataArray, canvas.width, canvas.height, sensitivity);
          break;
        case 'wave':
          drawWave(ctx, dataArray, canvas.width, canvas.height, sensitivity);
          break;
        case 'circular':
          drawCircular(ctx, dataArray, canvas.width, canvas.height, sensitivity);
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyser, isPlaying, mode, sensitivity]);

  const drawStaticVisualization = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(64, 224, 208, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw center text
    ctx.fillStyle = 'rgba(64, 224, 208, 0.6)';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('READY TO VISUALIZE', width / 2, height / 2);
  };

  const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number) => {
    const barWidth = width / dataArray.length * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] * sensitivity * height) / 256;
      
      const hue = (i / dataArray.length) * 360;
      const intensity = dataArray[i] / 256;
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${intensity})`);
      gradient.addColorStop(0.5, `hsla(${hue + 30}, 100%, 60%, ${intensity * 0.8})`);
      gradient.addColorStop(1, `hsla(${hue + 60}, 100%, 70%, ${intensity * 0.6})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
      
      // Add glow effect for high frequencies
      if (dataArray[i] > 200) {
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 20;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        ctx.shadowBlur = 0;
      }
      
      x += barWidth;
    }
  };

  const drawWave = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#40E0D0';
    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] * sensitivity) / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = '#40E0D0';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCircular = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const barHeight = (dataArray[i] * sensitivity) / 2;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const hue = (i / dataArray.length) * 360;
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#40E0D0';
    ctx.fill();
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 p-6">
      <canvas
        ref={canvasRef}
        className="w-full h-96 bg-black rounded-lg border border-gray-600"
        style={{ imageRendering: 'pixelated' }}
      />
    </Card>
  );
};
