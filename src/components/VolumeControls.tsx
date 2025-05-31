
import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Volume2 } from 'lucide-react';

interface VolumeControlsProps {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export const VolumeControls: React.FC<VolumeControlsProps> = ({
  sensitivity,
  onSensitivityChange
}) => {
  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-cyan-400" />
        <Label className="text-sm font-medium text-cyan-400">Sensitivity</Label>
      </div>
      
      <div className="space-y-2">
        <Slider
          value={[sensitivity]}
          onValueChange={(value) => onSensitivityChange(value[0])}
          max={3}
          min={0.1}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Low</span>
          <span className="text-cyan-400 font-medium">{sensitivity.toFixed(1)}x</span>
          <span>High</span>
        </div>
      </div>
    </Card>
  );
};
