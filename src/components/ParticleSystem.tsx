
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
  type: 'bass' | 'treble';
  color: string;
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
      
      // Add new particles based on energy
      if (bassEnergy > 0.1) {
        for (let i = 0; i < Math.floor(bassEnergy * 5); i++) {
          particlesRef.current.push(createBassParticle());
        }
      }
      
      if (trebleEnergy > 0.05) {
        for (let i = 0; i < Math.floor(trebleEnergy * 8); i++) {
          particlesRef.current.push(createTrebleParticle());
        }
      }
      
      // Beat explosion effect
      if (isBeat) {
        for (let i = 0; i < 10; i++) {
          particlesRef.current.push(createBeatParticle());
        }
      }
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vy += 0.1; // gravity
        
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        return particle.life > 0;
      });
      
      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    const createBassParticle = (): Particle => ({
      x: Math.random() * width,
      y: height + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: -(Math.random() * 3 + 2),
      size: Math.random() * 8 + 4,
      life: Math.random() * 60 + 30,
      maxLife: Math.random() * 60 + 30,
      type: 'bass',
      color: preset.id === 'rainbow-spectrum' 
        ? `hsl(${Math.random() * 60 + 200}, 70%, 60%)` 
        : preset.color.primary
    });

    const createTrebleParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.3,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2 - 1,
      size: Math.random() * 3 + 1,
      life: Math.random() * 40 + 20,
      maxLife: Math.random() * 40 + 20,
      type: 'treble',
      color: preset.id === 'rainbow-spectrum' 
        ? `hsl(${Math.random() * 60 + 40}, 80%, 70%)` 
        : preset.color.secondary
    });

    const createBeatParticle = (): Particle => ({
      x: width / 2,
      y: height / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      size: Math.random() * 6 + 3,
      life: Math.random() * 50 + 25,
      maxLife: Math.random() * 50 + 25,
      type: 'bass',
      color: preset.id === 'rainbow-spectrum' 
        ? `hsl(${Math.random() * 360}, 90%, 70%)` 
        : preset.color.glow
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
