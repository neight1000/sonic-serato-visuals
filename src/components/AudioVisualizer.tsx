import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { EqualizerPreset } from '@/utils/presets';
import { BeatDetector } from '@/utils/beatDetection';
import { ParticleSystem } from './ParticleSystem';
import { EnhancedAudioAnalyzer, FrequencyBands } from '@/utils/audioAnalyzer';
import { VisualizationRenderers } from '@/utils/visualizationRenderers';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: 'bars' | 'wave' | 'circular' | '3d';
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
  const audioAnalyzerRef = useRef<EnhancedAudioAnalyzer | null>(null);
  const renderersRef = useRef<VisualizationRenderers | null>(null);
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [beatData, setBeatData] = useState({ isBeat: false, energy: 0, bassEnergy: 0, trebleEnergy: 0 });
  const [beatIntensity, setBeatIntensity] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState<FrequencyBands>({
    subBass: 0, bass: 0, lowMid: 0, highMid: 0, presence: 0, brilliance: 0
  });

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

    // Initialize analyzers and renderers
    if (!beatDetectorRef.current) {
      beatDetectorRef.current = new BeatDetector(analyser);
    }
    if (!audioAnalyzerRef.current) {
      audioAnalyzerRef.current = new EnhancedAudioAnalyzer(analyser);
    }
    if (!renderersRef.current) {
      renderersRef.current = new VisualizationRenderers();
    }

    const draw = () => {
      if (!isPlaying) {
        // Draw static visualization when not playing
        drawStaticVisualization(ctx, canvas.width, canvas.height, preset);
        return;
      }

      const analyzer = audioAnalyzerRef.current!;
      const renderer = renderersRef.current!;
      
      // Get enhanced audio data
      const dataArray = analyzer.getFullSpectrum();
      const waveformData = analyzer.getWaveform();
      const bands = analyzer.getFrequencyBands();
      
      setFrequencyData(dataArray);
      setFrequencyBands(bands);

      // Beat detection
      const currentBeatData = beatDetectorRef.current!.detectBeat();
      setBeatData(currentBeatData);

      // Beat intensity effect
      if (currentBeatData.isBeat) {
        setBeatIntensity(1);
      } else {
        setBeatIntensity(prev => Math.max(0, prev - 0.05));
      }

      // Create render context
      const renderContext = {
        ctx,
        width: canvas.width,
        height: canvas.height,
        preset,
        sensitivity,
        beatData: currentBeatData
      };

      // Dynamic background based on beat
      const bgAlpha = currentBeatData.isBeat ? 0.05 : 0.1;
      ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add beat flash effect
      if (beatIntensity > 0) {
        ctx.fillStyle = `${preset.color.glow}${Math.floor(beatIntensity * 30).toString(16).padStart(2, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render based on visualization mode
      switch (mode) {
        case 'bars':
          renderer.renderBars(renderContext, dataArray);
          break;
        case 'wave':
          renderer.renderWaveform(renderContext, waveformData);
          break;
        case 'circular':
          renderer.renderCircular(renderContext, bands);
          break;
        case '3d':
          renderer.render3D(renderContext, dataArray);
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Reinitialize trails for new canvas size
      if (renderersRef.current) {
        renderersRef.current.initializeTrails(canvas.width, canvas.height);
      }
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
        
        {/* Enhanced Particle System */}
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
        
        {/* Frequency Band Display */}
        <div className="absolute bottom-4 left-4 bg-black/80 rounded p-2 text-xs text-white font-mono">
          <div>SUB: {Math.floor(frequencyBands.subBass * 100)}%</div>
          <div>BASS: {Math.floor(frequencyBands.bass * 100)}%</div>
          <div>MID: {Math.floor(frequencyBands.lowMid * 100)}%</div>
          <div>HIGH: {Math.floor(frequencyBands.highMid * 100)}%</div>
          <div>PRES: {Math.floor(frequencyBands.presence * 100)}%</div>
          <div>BRIL: {Math.floor(frequencyBands.brilliance * 100)}%</div>
        </div>
      </div>
    </Card>
  );
};
