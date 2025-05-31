
import React, { useState, useEffect, useRef } from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { PresetDisplay } from './PresetDisplay';
import { VolumeControls } from './VolumeControls';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EQUALIZER_PRESETS, getNextPreset, getPreviousPreset, EqualizerPreset } from '@/utils/presets';

export const MusicEqualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mediaSource, setMediaSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [sensitivity, setSensitivity] = useState(1);
  const [currentPreset, setCurrentPreset] = useState<EqualizerPreset>(EQUALIZER_PRESETS[0]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Keyboard controls for presets
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        const nextPreset = getNextPreset(currentPreset.id);
        setCurrentPreset(nextPreset);
        toast.success(`Switched to ${nextPreset.name}`);
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        const prevPreset = getPreviousPreset(currentPreset.id);
        setCurrentPreset(prevPreset);
        toast.success(`Switched to ${prevPreset.name}`);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPreset.id]);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      source.connect(analyserNode);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
      setMediaSource(source);
      setIsPlaying(true);
      
      toast.success("Audio input connected! Start playing music through your system.");
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Could not access audio input. Please check your microphone permissions.");
    }
  };

  const stopAudio = () => {
    if (mediaSource) {
      mediaSource.disconnect();
    }
    if (audioContext) {
      audioContext.close();
    }
    setIsPlaying(false);
    setAudioContext(null);
    setAnalyser(null);
    setMediaSource(null);
    toast.info("Audio input disconnected.");
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      initializeAudio();
    }
  };

  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  return (
    <div 
      className="min-h-screen text-white p-6 transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 
            className="text-4xl font-bold transition-all duration-500"
            style={{
              background: `linear-gradient(45deg, ${currentPreset.color.primary}, ${currentPreset.color.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: `0 0 20px ${currentPreset.color.glow}40`
            }}
          >
            DJ EQUALIZER PRO
          </h1>
          <p className="text-gray-400 mt-2">Professional Audio Spectrum Analyzer</p>
        </div>
        
        <div className="flex items-center gap-4">
          <VolumeControls sensitivity={sensitivity} onSensitivityChange={setSensitivity} />
          
          <Button
            onClick={togglePlayback}
            className={`h-12 px-6 ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white font-semibold transition-all duration-200`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                STOP
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                START
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <AudioVisualizer 
            analyser={analyser}
            isPlaying={isPlaying}
            mode={currentPreset.visualMode}
            sensitivity={sensitivity}
            preset={currentPreset}
          />
        </div>
        
        <div className="space-y-6">
          <PresetDisplay currentPreset={currentPreset} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${
            isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-sm">
            {isPlaying ? 'LIVE AUDIO INPUT' : 'AUDIO INPUT DISCONNECTED'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Volume2 className="w-4 h-4" />
          <span>Standalone DJ Equalizer • Ready to Use</span>
        </div>
      </div>
    </div>
  );
};
