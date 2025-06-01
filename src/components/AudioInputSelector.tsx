
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Upload, Radio } from 'lucide-react';
import { AudioInputType } from '@/utils/audioInputManager';

interface AudioInputSelectorProps {
  currentInput: AudioInputType;
  onInputChange: (type: AudioInputType, file?: File, streamUrl?: string) => void;
  isPlaying: boolean;
}

export const AudioInputSelector: React.FC<AudioInputSelectorProps> = ({
  currentInput,
  onInputChange,
  isPlaying
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onInputChange('file', file);
    }
  };

  const handleStreamInput = () => {
    const url = streamInputRef.current?.value;
    if (url) {
      onInputChange('stream', undefined, url);
    }
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 p-4">
      <h3 className="text-white font-semibold mb-4">Audio Input Source</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          onClick={() => onInputChange('microphone')}
          variant={currentInput === 'microphone' ? 'default' : 'outline'}
          className={`h-12 ${
            currentInput === 'microphone' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-800 hover:bg-gray-700'
          } text-white border-gray-600`}
          disabled={isPlaying}
        >
          <Mic className="w-4 h-4 mr-2" />
          Microphone
        </Button>

        <div className="relative">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant={currentInput === 'file' ? 'default' : 'outline'}
            className={`h-12 w-full ${
              currentInput === 'file' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-800 hover:bg-gray-700'
            } text-white border-gray-600`}
            disabled={isPlaying}
          >
            <Upload className="w-4 h-4 mr-2" />
            Audio File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleStreamInput}
            variant={currentInput === 'stream' ? 'default' : 'outline'}
            className={`h-8 w-full ${
              currentInput === 'stream' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-gray-800 hover:bg-gray-700'
            } text-white border-gray-600 text-xs`}
            disabled={isPlaying}
          >
            <Radio className="w-3 h-3 mr-1" />
            Stream
          </Button>
          <input
            ref={streamInputRef}
            type="url"
            placeholder="Stream URL"
            className="w-full h-6 px-2 text-xs bg-gray-800 text-white border border-gray-600 rounded"
            disabled={isPlaying}
          />
        </div>
      </div>
    </Card>
  );
};
