
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Maximize2 } from 'lucide-react';
import { EqualizerPreset } from '@/utils/presets';

interface MobileControlsProps {
  currentPreset: EqualizerPreset;
  onPresetChange: (direction: 'next' | 'prev') => void;
  onFullscreen: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  currentPreset,
  onPresetChange,
  onFullscreen,
  sensitivity,
  onSensitivityChange
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch gesture handling
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Only trigger on significant horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          onPresetChange('next');
        } else {
          onPresetChange('prev');
        }
      }
    };

    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, onPresetChange]);

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        {/* Preset Controls */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => onPresetChange('prev')}
            variant="outline"
            size="sm"
            className="bg-gray-800/80 border-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <h3 
              className="text-sm font-bold"
              style={{ color: currentPreset.color.primary }}
            >
              {currentPreset.name}
            </h3>
            <p className="text-xs text-gray-400">Swipe to change</p>
          </div>
          
          <Button
            onClick={() => onPresetChange('next')}
            variant="outline"
            size="sm"
            className="bg-gray-800/80 border-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
            className="bg-gray-800/80 border-gray-600"
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={onFullscreen}
            variant="outline"
            size="sm"
            className="bg-gray-800/80 border-gray-600"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Sensitivity</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onSensitivityChange(Math.max(0.1, sensitivity - 0.1))}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800/80 border-gray-600 w-8 h-8 p-0"
                >
                  -
                </Button>
                <span className="text-sm font-medium w-12 text-center">
                  {sensitivity.toFixed(1)}x
                </span>
                <Button
                  onClick={() => onSensitivityChange(Math.min(3, sensitivity + 0.1))}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800/80 border-gray-600 w-8 h-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
