
import { EqualizerPreset } from './presets';
import { FrequencyBands } from './audioAnalyzer';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  preset: EqualizerPreset;
  sensitivity: number;
  beatData: any;
}

export class VisualizationRenderers {
  private trailCanvas: HTMLCanvasElement | null = null;
  private trailCtx: CanvasRenderingContext2D | null = null;

  initializeTrails(width: number, height: number): void {
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = width;
    this.trailCanvas.height = height;
    this.trailCtx = this.trailCanvas.getContext('2d')!;
  }

  renderBars(context: RenderContext, dataArray: Uint8Array): void {
    const { ctx, width, height, preset, sensitivity, beatData } = context;
    
    // Apply trail effect
    this.applyTrailEffect(ctx, width, height, 0.95);
    
    const barWidth = width / dataArray.length * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] * sensitivity * height) / 256;
      const beatBoost = beatData.isBeat ? 1.2 : 1;
      const finalHeight = barHeight * beatBoost;
      
      this.drawNeonBar(ctx, x, height - finalHeight, barWidth - 2, finalHeight, preset, dataArray[i], i, dataArray.length);
      x += barWidth;
    }
  }

  renderWaveform(context: RenderContext, waveformData: Uint8Array): void {
    const { ctx, width, height, preset, sensitivity } = context;
    
    this.applyTrailEffect(ctx, width, height, 0.98);
    
    ctx.strokeStyle = preset.color.primary;
    ctx.lineWidth = 3;
    ctx.shadowColor = preset.color.glow;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    
    const sliceWidth = width / waveformData.length;
    let x = 0;
    
    for (let i = 0; i < waveformData.length; i++) {
      const v = (waveformData[i] / 128.0) * sensitivity;
      const y = (v * height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  renderCircular(context: RenderContext, bands: FrequencyBands): void {
    const { ctx, width, height, preset, sensitivity, beatData } = context;
    
    this.applyTrailEffect(ctx, width, height, 0.96);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 3;
    
    const bandsArray = [bands.subBass, bands.bass, bands.lowMid, bands.highMid, bands.presence, bands.brilliance];
    const angleStep = (Math.PI * 2) / bandsArray.length;
    
    bandsArray.forEach((value, index) => {
      const angle = angleStep * index;
      const radius = 50 + (value * sensitivity * maxRadius);
      const beatBoost = beatData.isBeat ? 1.3 : 1;
      const finalRadius = radius * beatBoost;
      
      const x = centerX + Math.cos(angle) * 80;
      const y = centerY + Math.sin(angle) * 80;
      
      // Draw radial bars
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      const gradient = ctx.createLinearGradient(0, 0, finalRadius, 0);
      gradient.addColorStop(0, `${preset.color.primary}80`);
      gradient.addColorStop(1, preset.color.secondary);
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = preset.color.glow;
      ctx.shadowBlur = 20;
      ctx.fillRect(0, -5, finalRadius, 10);
      
      ctx.restore();
    });
    
    ctx.shadowBlur = 0;
  }

  render3D(context: RenderContext, dataArray: Uint8Array): void {
    const { ctx, width, height, preset, sensitivity, beatData } = context;
    
    this.applyTrailEffect(ctx, width, height, 0.94);
    
    const perspective = 800;
    const depth = 300;
    
    for (let i = 0; i < dataArray.length; i += 2) {
      const barHeight = (dataArray[i] * sensitivity * height) / 256;
      const beatBoost = beatData.isBeat ? 1.2 : 1;
      const finalHeight = barHeight * beatBoost;
      
      const x = (i / dataArray.length) * width;
      const z = (Math.sin(Date.now() * 0.001 + i * 0.1) * depth) + depth;
      
      // Apply 3D projection
      const scale = perspective / (perspective + z);
      const projectedX = (x - width / 2) * scale + width / 2;
      const projectedHeight = finalHeight * scale;
      const projectedWidth = (width / dataArray.length * 4) * scale;
      
      // Create depth gradient
      const alpha = Math.max(0.3, scale);
      const gradient = ctx.createLinearGradient(0, height, 0, height - projectedHeight);
      gradient.addColorStop(0, `${preset.color.primary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${preset.color.secondary}${Math.floor(alpha * 200).toString(16).padStart(2, '0')}`);
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = preset.color.glow;
      ctx.shadowBlur = 15 * scale;
      
      ctx.fillRect(projectedX, height - projectedHeight, projectedWidth, projectedHeight);
    }
    
    ctx.shadowBlur = 0;
  }

  private applyTrailEffect(ctx: CanvasRenderingContext2D, width: number, height: number, fadeAmount: number): void {
    if (!this.trailCanvas || this.trailCanvas.width !== width || this.trailCanvas.height !== height) {
      this.initializeTrails(width, height);
    }
    
    // Copy current frame to trail canvas
    this.trailCtx!.globalAlpha = fadeAmount;
    this.trailCtx!.globalCompositeOperation = 'source-over';
    this.trailCtx!.drawImage(ctx.canvas, 0, 0);
    
    // Clear main canvas
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    
    // Draw faded trails back to main canvas
    ctx.globalAlpha = 0.8;
    ctx.drawImage(this.trailCanvas!, 0, 0);
    ctx.globalAlpha = 1;
  }

  private drawNeonBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, preset: EqualizerPreset, value: number, index: number, total: number): void {
    const intensity = value / 256;
    
    if (preset.id === 'neon-rainbow') {
      const hue = (index / total) * 360;
      const gradient = ctx.createLinearGradient(0, y + height, 0, y);
      gradient.addColorStop(0, `hsl(${hue}, 100%, ${intensity * 30 + 50}%)`);
      gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 100%, ${intensity * 40 + 60}%)`);
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, ${intensity * 50 + 70}%)`);
      ctx.fillStyle = gradient;
      
      if (value > 100) {
        ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
        ctx.shadowBlur = 25;
      }
    } else {
      const gradient = ctx.createLinearGradient(0, y + height, 0, y);
      gradient.addColorStop(0, `${preset.color.primary}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.5, `${preset.color.secondary}${Math.floor(intensity * 200).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${preset.color.primary}${Math.floor(intensity * 150).toString(16).padStart(2, '0')}`);
      ctx.fillStyle = gradient;
      
      if (value > 150) {
        ctx.shadowColor = preset.color.glow;
        ctx.shadowBlur = 25;
      }
    }
    
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;
  }
}
