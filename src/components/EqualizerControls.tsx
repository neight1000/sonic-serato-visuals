
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface EqualizerControlsProps {
  mode: 'bars' | 'wave' | 'circular';
  onModeChange: (mode: 'bars' | 'wave' | 'circular') => void;
}

export const EqualizerControls: React.FC<EqualizerControlsProps> = ({
  mode,
  onModeChange
}) => {
  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-cyan-400 mb-4">Visualization Mode</h3>
      
      <div className="space-y-3">
        <Button
          onClick={() => onModeChange('bars')}
          variant={mode === 'bars' ? 'default' : 'outline'}
          className={`w-full justify-start ${
            mode === 'bars' 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
              : 'border-gray-600 text-gray-300 hover:bg-gray-800'
          }`}
        >
          Frequency Bars
        </Button>
        
        <Button
          onClick={() => onModeChange('wave')}
          variant={mode === 'wave' ? 'default' : 'outline'}
          className={`w-full justify-start ${
            mode === 'wave' 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
              : 'border-gray-600 text-gray-300 hover:bg-gray-800'
          }`}
        >
          Waveform
        </Button>
        
        <Button
          onClick={() => onModeChange('circular')}
          variant={mode === 'circular' ? 'default' : 'outline'}
          className={`w-full justify-start ${
            mode === 'circular' 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
              : 'border-gray-600 text-gray-300 hover:bg-gray-800'
          }`}
        >
          Circular Spectrum
        </Button>
      </div>

      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
        <h4 className="text-sm font-medium text-cyan-400 mb-2">DJ Features</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Real-time audio analysis</li>
          <li>• Serato DJ Pro compatible</li>
          <li>• Professional grade visualization</li>
          <li>• Multiple display modes</li>
        </ul>
      </div>
    </Card>
  );
};
