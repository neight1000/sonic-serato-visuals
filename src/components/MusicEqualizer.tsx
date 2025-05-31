
import React, { useState, useEffect, useRef } from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { EqualizerControls } from './EqualizerControls';
import { VolumeControls } from './VolumeControls';
import { Settings, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const MusicEqualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mediaSource, setMediaSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'circular'>('bars');
  const [sensitivity, setSensitivity] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
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
            mode={visualizerMode}
            sensitivity={sensitivity}
          />
        </div>
        
        <div className="space-y-6">
          <EqualizerControls 
            mode={visualizerMode}
            onModeChange={setVisualizerMode}
          />
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
          <span>Serato DJ Pro Compatible</span>
        </div>
      </div>
    </div>
  );
};
