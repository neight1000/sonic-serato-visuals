
import React, { useEffect, useRef } from 'react';
import { EqualizerPreset } from '@/utils/presets';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  type: 'bass' | 'treble' | 'sparkle';
  color: string;
  twinkle: number;
  twinkleSpeed: number;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleSystemProps {
  bassEnergy: number;
  trebleEnergy: number;
  isBeat: boolean;
  preset: EqualizerPreset;
  width: number;
  height: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  bassEnergy,
  trebleEnergy,
  isBeat,
  preset,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Add new bass particles (larger, slower, bottom-up)
      if (bassEnergy > 0.1) {
        for (let i = 0; i < Math.floor(bassEnergy * 3); i++) {
          particlesRef.current.push(createBassParticle());
        }
      }
      
      // Add new treble sparkle particles (smaller, faster, scattered)
      if (trebleEnergy > 0.05) {
        for (let i = 0; i < Math.floor(trebleEnergy * 12); i++) {
          particlesRef.current.push(createSparkleParticle());
        }
      }
      
      // Beat explosion effect with pixie dust burst
      if (isBeat) {
        for (let i = 0; i < 15; i++) {
          particlesRef.current.push(createBeatParticle());
        }
      }
      
      // Update and draw particles with pixie dust effects
      particlesRef.current = particlesRef.current.filter(particle => {
        // Update position with floating motion
        particle.x += particle.vx + Math.sin(particle.life * 0.1) * 0.3;
        particle.y += particle.vy;
        particle.life--;
        particle.vy += particle.type === 'sparkle' ? 0.02 : 0.08; // Less gravity for sparkles
        
        // Update twinkle and rotation for pixie dust effect
        particle.twinkle += particle.twinkleSpeed;
        particle.rotation += particle.rotationSpeed;
        
        const alpha = (particle.life / particle.maxLife) * (0.7 + 0.3 * Math.sin(particle.twinkle));
        
        // Draw pixie dust with sparkle effect
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        if (particle.type === 'sparkle') {
          // Draw star-like sparkle
          drawStar(ctx, 0, 0, particle.size, particle.color);
          
          // Add glow effect for sparkles
          ctx.globalAlpha = alpha * 0.5;
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = particle.size * 2;
          drawStar(ctx, 0, 0, particle.size * 0.7, particle.color);
        } else {
          // Draw glowing orbs for bass particles
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(0.7, particle.color + '80');
          gradient.addColorStop(1, particle.color + '00');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
        
        return particle.life > 0 && particle.y < height + 50;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
      const spikes = 4;
      const outerRadius = size;
      const innerRadius = size * 0.4;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - outerRadius);
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        ctx.lineTo(
          x + Math.cos(angle - Math.PI / 2) * radius,
          y + Math.sin(angle - Math.PI / 2) * radius
        );
      }
      
      ctx.closePath();
      ctx.fill();
    };

    const createBassParticle = (): Particle => ({
      x: Math.random() * width,
      y: height + 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(Math.random() * 2 + 1.5),
      size: Math.random() * 6 + 3,
      life: Math.random() * 80 + 40,
      maxLife: Math.random() * 80 + 40,
      type: 'bass',
      color: preset.id === 'rainbow-spectrum' 
        ? `hsl(${Math.random() * 60 + 200}, 90%, 65%)` 
        : preset.color.primary,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.05 + Math.random() * 0.05,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    });

    const createSparkleParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.7,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 2 + 1,
      life: Math.random() * 60 + 30,
      maxLife: Math.random() * 60 + 30,
      type: 'sparkle',
      color: preset.id === 'rainbow-spectrum' 
        ? `hsl(${Math.random() * 360}, 100%, 80%)` 
        : preset.color.secondary,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.1 + Math.random() * 0.1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05
    });

    const createBeatParticle = (): Particle => ({
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: Math.random() * 4 + 2,
      life: Math.random() * 70 + 35,
      maxLife: Math.random() * 70 + 35,
      type: 'sparkle',
      color: preset.id === 'rainbow-spectrum' 
        ? `hsl(${Math.random() * 360}, 100%, 75%)` 
        : preset.color.glow,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.15 + Math.random() * 0.1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08
    });

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bassEnergy, trebleEnergy, isBeat, preset, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};
