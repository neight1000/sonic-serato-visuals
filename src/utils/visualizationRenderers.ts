
import { EqualizerPreset } from '@/utils/presets';

export const drawStaticVisualization = (ctx: CanvasRenderingContext2D, width: number, height: number, preset: EqualizerPreset) => {
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

export const drawRainbowSpectrum = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, beatData: any) => {
  const centerY = height / 2;
  const samples = Math.min(128, dataArray.length);
  const waveWidth = width * 0.9;
  const offsetX = width * 0.05;
  
  // Create frequency-based waveform data
  const wavePoints: number[] = [];
  for (let i = 0; i < samples; i++) {
    const freq = dataArray[i] / 255;
    const amplitude = freq * sensitivity * 0.4;
    wavePoints.push(amplitude);
  }
  
  // Draw multiple rainbow spectrum layers
  drawSpectrumLayer(ctx, wavePoints, offsetX, centerY, waveWidth, 1.0, 0, 4);
  drawSpectrumLayer(ctx, wavePoints, offsetX, centerY, waveWidth, 0.7, 10, 3);
  drawSpectrumLayer(ctx, wavePoints, offsetX, centerY, waveWidth, 0.5, -10, 2);
  
  // Add particles for beat enhancement
  if (beatData.isBeat) {
    drawSpectrumParticles(ctx, wavePoints, offsetX, centerY, waveWidth);
  }
};

export const drawSpectrumLayer = (ctx: CanvasRenderingContext2D, wavePoints: number[], offsetX: number, centerY: number, waveWidth: number, alpha: number, yOffset: number, lineWidth: number) => {
  const stepX = waveWidth / wavePoints.length;
  
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw top wave
  ctx.beginPath();
  for (let i = 0; i < wavePoints.length; i++) {
    const x = offsetX + i * stepX;
    const amplitude = wavePoints[i] * 120;
    const y = centerY - amplitude + yOffset;
    
    // Rainbow spectrum color based on position
    const hue = (i / wavePoints.length) * 360;
    const saturation = 100;
    const lightness = 50 + wavePoints[i] * 30;
    
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.shadowBlur = 15 * alpha;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Draw bottom wave (mirrored)
  ctx.beginPath();
  for (let i = 0; i < wavePoints.length; i++) {
    const x = offsetX + i * stepX;
    const amplitude = wavePoints[i] * 120;
    const y = centerY + amplitude - yOffset;
    
    const hue = (i / wavePoints.length) * 360;
    const saturation = 100;
    const lightness = 50 + wavePoints[i] * 30;
    
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.shadowBlur = 15 * alpha;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
};

export const drawSpectrumParticles = (ctx: CanvasRenderingContext2D, wavePoints: number[], offsetX: number, centerY: number, waveWidth: number) => {
  const stepX = waveWidth / wavePoints.length;
  
  for (let i = 0; i < wavePoints.length; i += 3) {
    if (wavePoints[i] > 0.1) {
      const x = offsetX + i * stepX + (Math.random() - 0.5) * 20;
      const amplitude = wavePoints[i] * 120;
      const y = centerY + (Math.random() - 0.5) * amplitude * 2;
      
      const hue = (i / wavePoints.length) * 360;
      const size = 2 + wavePoints[i] * 3;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
      ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
};

export const drawElectricDreamsSpectrum = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number) => {
  const numBars = 64;
  const barWidth = width / numBars;
  const spacing = 2;
  
  for (let i = 0; i < numBars; i++) {
    const dataIndex = Math.floor((i / numBars) * dataArray.length);
    const value = dataArray[dataIndex];
    
    // Enhanced reactivity with logarithmic scaling
    const normalizedValue = value / 255;
    const logScale = Math.log(normalizedValue * 9 + 1) / Math.log(10);
    const barHeight = logScale * sensitivity * height * 1.2;
    
    const x = i * barWidth;
    
    // Create gradient from bottom to top
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
    
    // Electric Dreams color scheme with enhanced intensity
    const intensity = Math.max(0.3, normalizedValue);
    gradient.addColorStop(0, '#ff0080');
    gradient.addColorStop(0.3, '#ff4000');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(0.7, '#00ff80');
    gradient.addColorStop(1, '#00ffff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, height - barHeight, barWidth - spacing, barHeight);
    
    // Add glow effect for higher values
    if (value > 80) {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.fillRect(x, height - barHeight, barWidth - spacing, barHeight);
      ctx.shadowBlur = 0;
    }
  }
};

export const drawNeonBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, sensitivity: number, preset: EqualizerPreset, beatData: any) => {
  const barWidth = width / dataArray.length * 2.5;
  let x = 0;

  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] * sensitivity * height) / 256;
    const beatBoost = beatData.isBeat ? 1.2 : 1;
    const finalHeight = barHeight * beatBoost;
    
    // Create neon rainbow effect for NEON RAINBOW preset
    if (preset.id === 'neon-rainbow') {
      const hue = (i / dataArray.length) * 360;
      const intensity = dataArray[i] / 256;
      const gradient = ctx.createLinearGradient(0, height, 0, height - finalHeight);
      
      // Vibrant neon rainbow bars
      gradient.addColorStop(0, `hsl(${hue}, 100%, ${intensity * 30 + 50}%)`);
      gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 100%, ${intensity * 40 + 60}%)`);
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, ${intensity * 50 + 70}%)`);
      ctx.fillStyle = gradient;
      
      // Neon glow effect for rainbow
      if (dataArray[i] > 100 || beatData.isBeat) {
        ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
        ctx.shadowBlur = beatData.isBeat ? 40 : 25;
      }
    } else {
      // Standard neon bar effect for other presets
      const intensity = dataArray[i] / 256;
      const gradient = ctx.createLinearGradient(0, height, 0, height - finalHeight);
      gradient.addColorStop(0, `${preset.color.primary}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.5, `${preset.color.secondary}${Math.floor(intensity * 200).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${preset.color.primary}${Math.floor(intensity * 150).toString(16).padStart(2, '0')}`);
      ctx.fillStyle = gradient;
      
      // Standard neon glow
      if (dataArray[i] > 150 || beatData.isBeat) {
        ctx.shadowColor = preset.color.glow;
        ctx.shadowBlur = beatData.isBeat ? 35 : 25;
      }
    }
    
    ctx.fillRect(x, height - finalHeight, barWidth - 2, finalHeight);
    ctx.shadowBlur = 0;
    
    x += barWidth;
  }
};
