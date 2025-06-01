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

      // Beat intensity effect
      if (currentBeatData.isBeat) {
        setBeatIntensity(1);
      } else {
        setBeatIntensity(prev => Math.max(0, prev - 0.05));
      }

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add beat flash effect
      if (beatIntensity > 0) {
        ctx.fillStyle = `${preset.color.glow}${Math.floor(beatIntensity * 30).toString(16).padStart(2, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw flowing waveforms
      drawFlowingWaveforms(ctx, dataArray, canvas.width, canvas.height, sensitivity, preset, currentBeatData);

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
    
    // Draw flowing lines even when static
    ctx.strokeStyle = `${preset.color.primary}40`;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const y = height / 2 + Math.sin((Date.now() * 0.001) + i) * 20;
      ctx.moveTo(0, y);
      
      for (let x = 0; x < width; x += 10) {
        const waveY = y + Math.sin((x * 0.01) + (Date.now() * 0.002) + i) * 15;
        ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
    
    // Draw center text
    ctx.fillStyle = preset.color.primary;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = preset.color.glow;
    ctx.shadowBlur = 10;
    ctx.fillText('READY TO VISUALIZE', width / 2, height / 2);
    ctx.shadowBlur = 0;
  };

  const drawFlowingWaveforms = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, preset: EqualizerPreset, beatData: any) => {
    const numWaves = 8;
    const centerY = height / 2;
    const maxAmplitude = height * 0.3;
    
    // Store current frame data
    const currentFrame = Array.from(dataArray.slice(0, 64));
    waveHistoryRef.current.unshift(currentFrame);
    
    // Keep only last 100 frames for trailing effect
    if (waveHistoryRef.current.length > 100) {
      waveHistoryRef.current.pop();
    }

    // Draw multiple flowing waveforms with trailing effect
    for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
      const hueShift = preset.id === 'neon-rainbow' ? (waveIndex * 45) : 0;
      
      for (let historyIndex = 0; historyIndex < Math.min(waveHistoryRef.current.length, 50); historyIndex++) {
        const frame = waveHistoryRef.current[historyIndex];
        if (!frame) continue;
        
        const alpha = Math.max(0.1, 1 - (historyIndex / 50));
        const thickness = Math.max(1, 4 - (historyIndex / 12));
        
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Create flowing waveform path
        ctx.beginPath();
        
        const points: Array<{x: number, y: number}> = [];
        const segmentWidth = width / frame.length;
        
        for (let i = 0; i < frame.length; i++) {
          const x = i * segmentWidth + (historyIndex * 2); // Add horizontal flow
          const amplitude = (frame[i] / 256) * maxAmplitude * sensitivity;
          const beatBoost = beatData.isBeat ? 1.3 : 1;
          const finalAmplitude = amplitude * beatBoost;
          
          // Create multiple wave layers
          const waveOffset = (waveIndex - numWaves/2) * (finalAmplitude * 0.3);
          const timeOffset = Date.now() * 0.001 + waveIndex * 0.5;
          const flowY = centerY + waveOffset + Math.sin((i * 0.1) + timeOffset) * (finalAmplitude * 0.5);
          
          points.push({ x, y: flowY });
        }
        
        // Draw smooth curved line through points
        if (points.length > 2) {
          ctx.moveTo(points[0].x, points[0].y);
          
          for (let i = 1; i < points.length - 1; i++) {
            const cp1x = (points[i-1].x + points[i].x) / 2;
            const cp1y = (points[i-1].y + points[i].y) / 2;
            const cp2x = (points[i].x + points[i+1].x) / 2;
            const cp2y = (points[i].y + points[i+1].y) / 2;
            
            ctx.quadraticCurveTo(points[i].x, points[i].y, cp2x, cp2y);
          }
        }
        
        // Set stroke color with rainbow effect
        if (preset.id === 'neon-rainbow') {
          const hue = (hueShift + (historyIndex * 2)) % 360;
          ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
          ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.5})`;
        } else {
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, `${preset.color.primary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(0.5, `${preset.color.secondary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(1, `${preset.color.primary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
          ctx.strokeStyle = gradient;
          ctx.shadowColor = `${preset.color.glow}${Math.floor(alpha * 128).toString(16).padStart(2, '0')}`;
        }
        
        ctx.shadowBlur = beatData.isBeat ? 20 : 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
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
            imageRendering: 'auto',
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
