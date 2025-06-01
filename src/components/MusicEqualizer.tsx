import React, { useState, useEffect, useRef } from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { PresetDisplay } from './PresetDisplay';
import { VolumeControls } from './VolumeControls';
import { VirtualAudioSelector } from './VirtualAudioSelector';
import { MobileControls } from './MobileControls';
import { Play, Pause, Volume2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EQUALIZER_PRESETS, getNextPreset, getPreviousPreset, EqualizerPreset } from '@/utils/presets';
import { VirtualAudioRouter } from '@/utils/virtualAudioRouter';

export const MusicEqualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mediaSource, setMediaSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [sensitivity, setSensitivity] = useState(1);
  const [currentPreset, setCurrentPreset] = useState<EqualizerPreset>(EQUALIZER_PRESETS[0]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const routerRef = useRef<VirtualAudioRouter>(new VirtualAudioRouter());

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

  const initializeAudio = async (deviceId?: string) => {
    try {
      let stream: MediaStream;
      
      if (deviceId) {
        // Use virtual audio router for specific device
        stream = await routerRef.current.connectToVirtualDevice(deviceId);
        toast.success("Connected to virtual audio device!");
      } else {
        // Fallback to default microphone
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 44100,
            channelCount: 2
          } 
        });
        toast.success("Connected to default audio input!");
      }
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 512; // Increased for better frequency resolution
      analyserNode.smoothingTimeConstant = 0.7;
      source.connect(analyserNode);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
      setMediaSource(source);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error accessing audio:', error);
      toast.error("Could not access audio input. Check device permissions and virtual audio setup.");
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
      initializeAudio(selectedDeviceId);
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isPlaying) {
      // Restart with new device
      stopAudio();
      setTimeout(() => initializeAudio(deviceId), 100);
    }
  };

  const handlePresetChange = (direction: 'next' | 'prev') => {
    const newPreset = direction === 'next' 
      ? getNextPreset(currentPreset.id)
      : getPreviousPreset(currentPreset.id);
    setCurrentPreset(newPreset);
    toast.success(`Switched to ${newPreset.name}`);
  };

  const handleFullscreen = () => {
    // This will be handled by the AudioVisualizer component
    toast.info("Use the fullscreen button on the visualizer");
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
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            Professional Audio Spectrum Analyzer • Virtual Audio Ready
          </p>
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

      {/* Audio Input Selector */}
      <div className="mb-6">
        <VirtualAudioSelector
          onDeviceSelect={handleDeviceSelect}
          currentDeviceId={selectedDeviceId}
          isConnected={isPlaying}
        />
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
            {isPlaying ? 'LIVE AUDIO INPUT ACTIVE' : 'AUDIO INPUT DISCONNECTED'}
          </span>
          {selectedDeviceId && (
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-600/30">
              Virtual Audio
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Volume2 className="w-4 h-4" />
          <span>Professional DJ Equalizer • Serato Ready</span>
        </div>
      </div>

      {/* Mobile Controls */}
      <MobileControls
        currentPreset={currentPreset}
        onPresetChange={handlePresetChange}
        onFullscreen={handleFullscreen}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
      />
    </div>
  );
};
