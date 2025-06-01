
import React from 'react';
import { EqualizerPreset } from '@/utils/presets';
import {
  drawStaticVisualization,
  drawRainbowSpectrum,
  drawElectricDreamsSpectrum,
  drawNeonBars
} from '@/utils/visualizationRenderers';

interface VisualizationRendererProps {
  ctx: CanvasRenderingContext2D;
  dataArray: Uint8Array;
  width: number;
  height: number;
  sensitivity: number;
  preset: EqualizerPreset;
  isPlaying: boolean;
  beatData: { isBeat: boolean; energy: number; bassEnergy: number; trebleEnergy: number };
}

export const renderVisualization = ({
  ctx,
  dataArray,
  width,
  height,
  sensitivity,
  preset,
  isPlaying,
  beatData
}: VisualizationRendererProps) => {
  if (!isPlaying) {
    drawStaticVisualization(ctx, width, height, preset);
    return;
  }

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillRect(0, 0, width, height);

  // Draw based on preset
  if (preset.id === 'neon-nights') {
    drawRainbowSpectrum(ctx, dataArray, width, height, sensitivity, beatData);
  } else if (preset.id === 'electric-dreams') {
    drawElectricDreamsSpectrum(ctx, dataArray, width, height, sensitivity);
  } else {
    drawNeonBars(ctx, dataArray, width, height, sensitivity, preset, beatData);
  }
};
