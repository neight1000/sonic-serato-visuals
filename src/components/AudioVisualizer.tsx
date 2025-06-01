import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { EqualizerPreset } from '@/utils/presets';
import { BeatDetector } from '@/utils/beatDetection';
import { ParticleSystem } from './ParticleSystem';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: 'bars' | 'wave' | 'circular';
  sensitivity: number;
  preset: EqualizerPreset;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isPlaying,
  mode,
  sensitivity,
  preset
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const beatDetectorRef = useRef<BeatDetector | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [beatData, setBeatData] = useState({ isBeat: false, energy: 0, bassEnergy: 0, trebleEnergy: 0 });
  const [beatIntensity, setBeatIntensity] = useState(0);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Initialize beat detector
    if (!beatDetectorRef.current) {
      beatDetectorRef.current = new BeatDetector(analyser);
    }

    const draw = () => {
      if (!isPlaying) {
        // Draw static visualization when not playing
        drawStaticVisualization(ctx, canvas.width, canvas.height, preset);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      setFrequencyData(dataArray);

      // Beat detection
      const currentBeatData = beatDetectorRef.current!.detectBeat();
      setBeatData(currentBeatData);

      // Beat intensity effect
      if (currentBeatData.isBeat) {
        setBeatIntensity(1);
      } else {
        setBeatIntensity(prev => Math.max(0, prev - 0.05));
      }

      // Dynamic background based on beat
      const bgAlpha = currentBeatData.isBeat ? 0.1 : 0.2;
      ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add beat flash effect
      if (beatIntensity > 0) {
        ctx.fillStyle = `${preset.color.glow}${Math.floor(beatIntensity * 50).toString(16).padStart(2, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      switch (mode) {
        case 'bars':
          drawBars(ctx, dataArray, canvas.width, canvas.height, sensitivity, preset, currentBeatData);
          break;
        case 'wave':
          drawWave(ctx, dataArray, canvas.width, canvas.height, sensitivity, preset, currentBeatData);
          break;
        case 'circular':
          drawCircular(ctx, dataArray, canvas.width, canvas.height, sensitivity, preset, currentBeatData);
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
  }, [analyser, isPlaying, mode, sensitivity, preset]);

  const drawStaticVisualization = (ctx: CanvasRenderingContext2D, width: number, height: number, preset: EqualizerPreset) => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid with preset colors
    ctx.strokeStyle = `${preset.color.primary}40`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw center text with preset colors
    ctx.fillStyle = preset.color.primary;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = preset.color.glow;
    ctx.shadowBlur = 10;
    ctx.fillText('READY TO VISUALIZE', width / 2, height / 2);
    ctx.shadowBlur = 0;
  };

  const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, preset: EqualizerPreset, beatData: any) => {
    const barWidth = width / dataArray.length * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] * sensitivity * height) / 256;
      const beatBoost = beatData.isBeat ? 1.2 : 1;
      const finalHeight = barHeight * beatBoost;
      
      // Enhanced rainbow spectrum effect with neon glow
      if (preset.id === 'rainbow-spectrum') {
        const hue = (i / dataArray.length) * 360;
        const intensity = dataArray[i] / 256;
        const gradient = ctx.createLinearGradient(0, height, 0, height - finalHeight);
        
        // Create vibrant neon rainbow gradient
        gradient.addColorStop(0, `hsl(${hue}, 100%, ${intensity * 30 + 50}%)`);
        gradient.addColorStop(0.3, `hsl(${(hue + 40) % 360}, 100%, ${intensity * 40 + 60}%)`);
        gradient.addColorStop(0.7, `hsl(${(hue + 80) % 360}, 100%, ${intensity * 50 + 70}%)`);
        gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, ${intensity * 60 + 80}%)`);
        ctx.fillStyle = gradient;
      } else {
        // Enhanced neon effect for other presets
        const intensity = dataArray[i] / 256;
        const gradient = ctx.createLinearGradient(0, height, 0, height - finalHeight);
        gradient.addColorStop(0, `${preset.color.primary}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${preset.color.secondary}${Math.floor(intensity * 200).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${preset.color.primary}${Math.floor(intensity * 150).toString(16).padStart(2, '0')}`);
        ctx.fillStyle = gradient;
      }
      
      ctx.fillRect(x, height - finalHeight, barWidth - 2, finalHeight);
      
      // Enhanced neon glow effect
      if (dataArray[i] > 150 || beatData.isBeat) {
        const glowColor = preset.id === 'rainbow-spectrum' 
          ? `hsl(${(i / dataArray.length) * 360}, 100%, 70%)` 
          : preset.color.glow;
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = beatData.isBeat ? 35 : 25;
        ctx.fillRect(x, height - finalHeight, barWidth - 2, finalHeight);
        ctx.shadowBlur = 0;
      }
      
      x += barWidth;
    }
  };

  const drawWave = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, preset: EqualizerPreset, beatData: any) => {
    const lineWidth = beatData.isBeat ? 6 : 4;
    ctx.lineWidth = lineWidth;
    
    // Enhanced rainbow effect for wave mode
    if (preset.id === 'rainbow-spectrum') {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      for (let i = 0; i < 8; i++) {
        gradient.addColorStop(i / 7, `hsl(${i * 51.4}, 100%, 70%)`);
      }
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = preset.color.primary;
    }
    
    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] * sensitivity) / 128.0;
      const beatBoost = beatData.isBeat ? 1.3 : 1;
      const y = (v * height * beatBoost) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
    
    // Enhanced neon glow effect
    ctx.shadowColor = preset.id === 'rainbow-spectrum' ? '#ff4000' : preset.color.glow;
    ctx.shadowBlur = beatData.isBeat ? 30 : 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCircular = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, preset: EqualizerPreset, beatData: any) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const barHeight = (dataArray[i] * sensitivity) / 2;
      const beatBoost = beatData.isBeat ? 1.4 : 1;
      const finalHeight = barHeight * beatBoost;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + finalHeight);
      const y2 = centerY + Math.sin(angle) * (radius + finalHeight);

      // Enhanced rainbow spectrum effect for circular mode
      if (preset.id === 'rainbow-spectrum') {
        const hue = (i / dataArray.length) * 360;
        const intensity = dataArray[i] / 256;
        ctx.strokeStyle = `hsl(${hue}, 100%, ${intensity * 30 + 50}%)`;
        
        // Add glow for high intensity
        if (intensity > 0.6) {
          ctx.shadowColor = `hsl(${hue}, 100%, 80%)`;
          ctx.shadowBlur = 15;
        }
      } else {
        const intensity = dataArray[i] / 256;
        ctx.strokeStyle = `${preset.color.primary}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`;
      }
      
      ctx.lineWidth = beatData.isBeat ? 4 : 3;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Enhanced center circle with rainbow effect
    ctx.beginPath();
    const centerRadius = radius * (beatData.isBeat ? 0.2 : 0.12);
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    
    if (preset.id === 'rainbow-spectrum') {
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerRadius);
      gradient.addColorStop(0, '#ff0080');
      gradient.addColorStop(0.5, '#ff4000');
      gradient.addColorStop(1, '#ffff00');
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#ff4000';
    } else {
      ctx.fillStyle = preset.color.primary;
      ctx.shadowColor = preset.color.glow;
    }
    
    ctx.shadowBlur = beatData.isBeat ? 25 : 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  return (
    <Card 
      ref={containerRef}
      className={`bg-gray-900/50 backdrop-blur-sm border-gray-700 p-6 relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      <Button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600"
        size="sm"
        variant="outline"
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </Button>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`w-full bg-black rounded-lg border border-gray-600 transition-all duration-500 ${
            isFullscreen ? 'h-screen' : 'h-96'
          }`}
          style={{ 
            imageRendering: 'pixelated',
            boxShadow: `0 0 30px ${preset.color.glow}20`
          }}
        />
        
        {/* Particle System */}
        {isPlaying && (
          <ParticleSystem
            bassEnergy={beatData.bassEnergy}
            trebleEnergy={beatData.trebleEnergy}
            isBeat={beatData.isBeat}
            preset={preset}
            width={canvasRef.current?.offsetWidth || 0}
            height={canvasRef.current?.offsetHeight || 0}
          />
        )}
      </div>
    </Card>
  );
};
