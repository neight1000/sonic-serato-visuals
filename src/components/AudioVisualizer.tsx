import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { EqualizerPreset } from '@/utils/presets';
import { BeatDetector } from '@/utils/beatDetection';

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
  const waveHistoryRef = useRef<number[][]>([]);

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

      // Clear canvas with black background
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw based on preset
      if (preset.id === 'neon-nights') {
        drawNeonWaveform(ctx, dataArray, canvas.width, canvas.height, sensitivity, currentBeatData);
      } else if (preset.id === 'electric-dreams') {
        drawElectricDreamsSpectrum(ctx, dataArray, canvas.width, canvas.height, sensitivity);
      } else {
        // Keep original neon bars for other presets
        drawNeonBars(ctx, dataArray, canvas.width, canvas.height, sensitivity, preset, currentBeatData);
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

  const drawNeonWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, beatData: any) => {
    const centerY = height / 2;
    const samples = 128;
    
    // Create waveform data
    const waveData: number[] = [];
    for (let i = 0; i < samples; i++) {
      const dataIndex = Math.floor((i / samples) * dataArray.length);
      const value = dataArray[dataIndex];
      const amplitude = (value * sensitivity) / 256;
      waveData.push(amplitude);
    }
    
    // Enhanced trailing effect - increased from 20 to 30 history frames
    waveHistoryRef.current.push([...waveData]);
    if (waveHistoryRef.current.length > 30) {
      waveHistoryRef.current.shift();
    }
    
    // Draw trailing waves with enhanced effect
    waveHistoryRef.current.forEach((wave, historyIndex) => {
      const alpha = (historyIndex + 1) / waveHistoryRef.current.length;
      drawWaveLayer(ctx, wave, width, centerY, alpha * 0.45, '#ff0080', historyIndex * 3);
    });
    
    // Enhanced main waveform with more layers (increased from 3 to 5 layers)
    drawWaveLayer(ctx, waveData, width, centerY, 1.0, '#ff0080', 0);
    drawWaveLayer(ctx, waveData, width, centerY, 0.9, '#00ffff', 3);
    drawWaveLayer(ctx, waveData, width, centerY, 0.8, '#ffff00', -2);
    drawWaveLayer(ctx, waveData, width, centerY, 0.7, '#ff4080', 5);
    drawWaveLayer(ctx, waveData, width, centerY, 0.6, '#80ff80', -4);
    
    // Enhanced particles - increased count by 50%
    drawParticles(ctx, waveData, width, centerY, beatData);
  };
  
  const drawWaveLayer = (ctx: CanvasRenderingContext2D, waveData: number[], width: number, centerY: number, alpha: number, color: string, offset: number) => {
    ctx.beginPath();
    ctx.strokeStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 3; // Increased from 2 to 3 for more prominent lines
    ctx.shadowColor = color;
    ctx.shadowBlur = alpha * 30; // Increased from 20 to 30 for stronger glow
    
    const step = width / waveData.length;
    
    for (let i = 0; i < waveData.length; i++) {
      const x = i * step;
      const amplitude = waveData[i] * 225; // Increased from 150 to 225 for more dramatic curves
      
      // Enhanced flowing wave effect with more complex curves
      const time = Date.now() * 0.0015; // Slightly faster animation
      const flowOffset = Math.sin(time + i * 0.15) * 15; // Increased curve intensity
      const secondaryFlow = Math.cos(time * 0.7 + i * 0.08) * 8; // Added secondary curve
      const y1 = centerY - amplitude + offset + flowOffset + secondaryFlow;
      const y2 = centerY + amplitude + offset + flowOffset + secondaryFlow;
      
      if (i === 0) {
        ctx.moveTo(x, y1);
      } else {
        // Enhanced smooth curves with more control points
        const prevX = (i - 1) * step;
        const cpX1 = prevX + step * 0.3;
        const cpX2 = prevX + step * 0.7;
        ctx.bezierCurveTo(cpX1, y1, cpX2, y1, x, y1);
      }
    }
    
    ctx.stroke();
    
    // Draw enhanced mirrored wave
    ctx.beginPath();
    for (let i = 0; i < waveData.length; i++) {
      const x = i * step;
      const amplitude = waveData[i] * 225;
      const time = Date.now() * 0.0015;
      const flowOffset = Math.sin(time + i * 0.15) * 15;
      const secondaryFlow = Math.cos(time * 0.7 + i * 0.08) * 8;
      const y = centerY + amplitude + offset + flowOffset + secondaryFlow;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const cpX1 = prevX + step * 0.3;
        const cpX2 = prevX + step * 0.7;
        ctx.bezierCurveTo(cpX1, y, cpX2, y, x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };
  
  const drawParticles = (ctx: CanvasRenderingContext2D, waveData: number[], width: number, centerY: number, beatData: any) => {
    // Enhanced particle count - increased by 50%
    const particleCount = beatData.isBeat ? 75 : 30; // Increased from 50/20 to 75/30
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const dataIndex = Math.floor((x / width) * waveData.length);
      const amplitude = waveData[dataIndex] || 0;
      
      if (amplitude > 0.08) { // Slightly lower threshold for more particles
        const y = centerY + (Math.random() - 0.5) * amplitude * 450; // Increased spread
        const size = Math.random() * 4.5 + 1.5; // Slightly larger particles
        const colors = ['#ff0080', '#00ffff', '#ffff00', '#ff4000', '#80ff80', '#ff8040']; // Added more colors
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(Math.random() * 128 + 127).toString(16)}`;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15; // Increased from 10 to 15 for stronger glow
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  };

  const drawElectricDreamsSpectrum = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number) => {
    const numBars = 64; // Number of bars to display
    const barWidth = width / numBars;
    const spacing = 2;
    
    for (let i = 0; i < numBars; i++) {
      // Sample frequency data
      const dataIndex = Math.floor((i / numBars) * dataArray.length);
      const value = dataArray[dataIndex];
      const barHeight = (value * sensitivity * height) / 256;
      
      const x = i * barWidth;
      
      // Create gradient from bottom to top
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      
      // Electric Dreams color scheme - blue to cyan gradient
      const intensity = value / 256;
      gradient.addColorStop(0, '#ff0080'); // Magenta at bottom
      gradient.addColorStop(0.3, '#ff4000'); // Red-orange
      gradient.addColorStop(0.5, '#ffff00'); // Yellow
      gradient.addColorStop(0.7, '#00ff80'); // Green
      gradient.addColorStop(1, '#00ffff'); // Cyan at top
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth - spacing, barHeight);
    }
  };

  const drawNeonBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, preset: EqualizerPreset, beatData: any) => {
    const barWidth = width / dataArray.length * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] * sensitivity * height) / 256;
      const beatBoost = beatData.isBeat ? 1.2 : 1;
      const finalHeight = barHeight * beatBoost;
      
      // Create neon rainbow effect for NEON RAINBOW preset
      if (preset.id === 'neon-rainbow') {
        const hue = (i / dataArray.length) * 360;
        const intensity = dataArray[i] / 256;
        const gradient = ctx.createLinearGradient(0, height, 0, height - finalHeight);
        
        // Vibrant neon rainbow bars
        gradient.addColorStop(0, `hsl(${hue}, 100%, ${intensity * 30 + 50}%)`);
        gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 100%, ${intensity * 40 + 60}%)`);
        gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, ${intensity * 50 + 70}%)`);
        ctx.fillStyle = gradient;
        
        // Neon glow effect for rainbow
        if (dataArray[i] > 100 || beatData.isBeat) {
          ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
          ctx.shadowBlur = beatData.isBeat ? 40 : 25;
        }
      } else {
        // Standard neon bar effect for other presets
        const intensity = dataArray[i] / 256;
        const gradient = ctx.createLinearGradient(0, height, 0, height - finalHeight);
        gradient.addColorStop(0, `${preset.color.primary}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${preset.color.secondary}${Math.floor(intensity * 200).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${preset.color.primary}${Math.floor(intensity * 150).toString(16).padStart(2, '0')}`);
        ctx.fillStyle = gradient;
        
        // Standard neon glow
        if (dataArray[i] > 150 || beatData.isBeat) {
          ctx.shadowColor = preset.color.glow;
          ctx.shadowBlur = beatData.isBeat ? 35 : 25;
        }
      }
      
      ctx.fillRect(x, height - finalHeight, barWidth - 2, finalHeight);
      ctx.shadowBlur = 0;
      
      x += barWidth;
    }
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
      </div>
    </Card>
  );
};
