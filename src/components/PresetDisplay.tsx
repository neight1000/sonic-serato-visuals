
import React from 'react';
import { Card } from '@/components/ui/card';
import { EqualizerPreset } from '@/utils/presets';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PresetDisplayProps {
  currentPreset: EqualizerPreset;
}

export const PresetDisplay: React.FC<PresetDisplayProps> = ({ currentPreset }) => {
  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 p-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
          <h3 
            className="text-xl font-bold"
            style={{ color: currentPreset.color.primary }}
          >
            {currentPreset.name}
          </h3>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400 mb-3">{currentPreset.description}</p>
        
        <div className="flex items-center justify-center gap-1 mb-3">
          {currentPreset.bands.map((level, index) => (
            <div
              key={index}
              className="w-3 bg-gray-800 rounded-sm overflow-hidden"
              style={{ height: '40px' }}
            >
              <div
                className="w-full rounded-sm transition-all duration-300"
                style={{
                  height: `${level * 100}%`,
                  background: `linear-gradient(to top, ${currentPreset.color.primary}, ${currentPreset.color.secondary})`,
                  boxShadow: `0 0 8px ${currentPreset.color.glow}40`
                }}
              />
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500">
          Use ← → arrow keys to change presets
        </div>
      </div>
    </Card>
  );
};
