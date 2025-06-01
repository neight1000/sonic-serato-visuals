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
    
    // Optimized analyser settings for low latency
    analyser.fftSize = 256; // Reduced for better performance
    analyser.smoothingTimeConstant = 0.1; // Much lower for immediate response
    analyser.minDecibels = -80;
    analyser.maxDecibels = -20;
    
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
        drawRainbowWaveform(ctx, dataArray, canvas.width, canvas.height, sensitivity, currentBeatData);
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

  const drawRainbowWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, beatData: any) => {
    const centerY = height / 2;
    const samples = 64; // Reduced for better performance
    
    // Optimized frequency processing for low latency
    const waveData: number[] = [];
    for (let i = 0; i < samples; i++) {
      const dataIndex = Math.floor((i / samples) * dataArray.length);
      const value = dataArray[dataIndex];
      
      // Simplified amplitude calculation for better performance
      const normalizedValue = value / 255;
      const amplitude = normalizedValue * sensitivity * 0.8; // Reduced sensitivity multiplier
      waveData.push(amplitude);
    }
    
    // Reduced trailing effect for better performance - 15 history frames
    waveHistoryRef.current.push([...waveData]);
    if (waveHistoryRef.current.length > 15) {
      waveHistoryRef.current.shift();
    }
    
    // Draw optimized trailing waves with rainbow spectrum
    waveHistoryRef.current.forEach((wave, historyIndex) => {
      const alpha = (historyIndex + 1) / waveHistoryRef.current.length;
      const hueOffset = historyIndex * 20; // Increased hue separation
      drawRainbowWaveLayer(ctx, wave, width, centerY, alpha * 0.6, hueOffset, historyIndex * 2);
    });
    
    // Main waveform with 3 rainbow layers for optimal performance
    drawRainbowWaveLayer(ctx, waveData, width, centerY, 1.0, 0, 0);
    drawRainbowWaveLayer(ctx, waveData, width, centerY, 0.8, 120, 3);
    drawRainbowWaveLayer(ctx, waveData, width, centerY, 0.6, 240, -2);
    
    // Optimized rainbow particles
    drawRainbowParticles(ctx, waveData, width, centerY, beatData);
  };
  
  const drawRainbowWaveLayer = (ctx: CanvasRenderingContext2D, waveData: number[], width: number, centerY: number, alpha: number, hueOffset: number, offset: number) => {
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = alpha * 20;
    
    const step = width / waveData.length;
    
    for (let i = 0; i < waveData.length; i++) {
      const x = i * step;
      const amplitude = waveData[i] * 250; // Balanced amplitude for smooth response
      
      // Optimized rainbow color calculation
      const baseHue = (i / waveData.length) * 360 + hueOffset;
      const time = Date.now() * 0.001; // Slower time for smoother animation
      const animatedHue = (baseHue + time * 50) % 360;
      const color = `hsl(${animatedHue}, 100%, 65%)`;
      
      ctx.strokeStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.shadowColor = color;
      
      // Simplified flowing wave effect
      const flowOffset = Math.sin(time * 2 + i * 0.1) * 15;
      const y1 = centerY - amplitude + offset + flowOffset;
      const y2 = centerY + amplitude + offset + flowOffset;
      
      if (i === 0) {
        ctx.moveTo(x, y1);
      } else {
        // Simplified smooth curves
        const prevX = (i - 1) * step;
        const cpX = prevX + step * 0.5;
        ctx.quadraticCurveTo(cpX, y1, x, y1);
      }
    }
    
    ctx.stroke();
    
    // Draw mirrored wave
    ctx.beginPath();
    for (let i = 0; i < waveData.length; i++) {
      const x = i * step;
      const amplitude = waveData[i] * 250;
      const time = Date.now() * 0.001;
      const baseHue = (i / waveData.length) * 360 + hueOffset;
      const animatedHue = (baseHue + time * 50) % 360;
      const color = `hsl(${animatedHue}, 100%, 65%)`;
      
      ctx.strokeStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.shadowColor = color;
      
      const flowOffset = Math.sin(time * 2 + i * 0.1) * 15;
      const y = centerY + amplitude + offset + flowOffset;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const cpX = prevX + step * 0.5;
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };
  
  const drawRainbowParticles = (ctx: CanvasRenderingContext2D, waveData: number[], width: number, centerY: number, beatData: any) => {
    // Optimized particle count
    const particleCount = beatData.isBeat ? 40 : 20;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const dataIndex = Math.floor((x / width) * waveData.length);
      const amplitude = waveData[dataIndex] || 0;
      
      if (amplitude > 0.03) {
        const y = centerY + (Math.random() - 0.5) * amplitude * 400;
        const size = Math.random() * 3 + 1;
        
        // Rainbow colors based on position
        const hue = (x / width) * 360 + Date.now() * 0.05;
        const color = `hsl(${hue % 360}, 100%, 70%)`;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(Math.random() * 100 + 155).toString(16)}`;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  };

  const drawElectricDreamsSpectrum = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number) => {
    const numBars = 64;
    const barWidth = width / numBars;
    const spacing = 2;
    
    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor((i / numBars) * dataArray.length);
      const value = dataArray[dataIndex];
      
      // Enhanced reactivity with logarithmic scaling
      const normalizedValue = value / 255;
      const logScale = Math.log(normalizedValue * 9 + 1) / Math.log(10);
      const barHeight = logScale * sensitivity * height * 1.2; // Increased multiplier for better response
      
      const x = i * barWidth;
      
      // Create gradient from bottom to top
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      
      // Electric Dreams color scheme with enhanced intensity
      const intensity = Math.max(0.3, normalizedValue); // Minimum intensity for visibility
      gradient.addColorStop(0, '#ff0080');
      gradient.addColorStop(0.3, '#ff4000');
      gradient.addColorStop(0.5, '#ffff00');
      gradient.addColorStop(0.7, '#00ff80');
      gradient.addColorStop(1, '#00ffff');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth - spacing, barHeight);
      
      // Add glow effect for higher values
      if (value > 80) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.fillRect(x, height - barHeight, barWidth - spacing, barHeight);
        ctx.shadowBlur = 0;
      }
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
