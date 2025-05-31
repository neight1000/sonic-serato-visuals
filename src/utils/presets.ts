
export interface EqualizerPreset {
  id: string;
  name: string;
  description: string;
  bands: number[];
  color: {
    primary: string;
    secondary: string;
    glow: string;
  };
  visualMode: 'bars' | 'wave' | 'circular';
}

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  {
    id: 'neon-nights',
    name: 'NEON NIGHTS',
    description: 'Classic 80s synthwave vibes',
    bands: [0.8, 0.9, 0.7, 0.6, 0.8, 0.9, 0.7, 0.5],
    color: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      glow: '#ff00ff'
    },
    visualMode: 'bars'
  },
  {
    id: 'retro-wave',
    name: 'RETRO WAVE',
    description: 'Vintage analog warmth',
    bands: [0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.5],
    color: {
      primary: '#ffaa00',
      secondary: '#ff4500',
      glow: '#ffaa00'
    },
    visualMode: 'wave'
  },
  {
    id: 'cyber-pulse',
    name: 'CYBER PULSE',
    description: 'Futuristic digital energy',
    bands: [0.9, 0.8, 0.6, 0.7, 0.9, 0.8, 0.7, 0.8],
    color: {
      primary: '#00ff41',
      secondary: '#00ffaa',
      glow: '#00ff41'
    },
    visualMode: 'circular'
  }
];

export const getNextPreset = (currentId: string): EqualizerPreset => {
  const currentIndex = EQUALIZER_PRESETS.findIndex(preset => preset.id === currentId);
  const nextIndex = (currentIndex + 1) % EQUALIZER_PRESETS.length;
  return EQUALIZER_PRESETS[nextIndex];
};

export const getPreviousPreset = (currentId: string): EqualizerPreset => {
  const currentIndex = EQUALIZER_PRESETS.findIndex(preset => preset.id === currentId);
  const prevIndex = currentIndex === 0 ? EQUALIZER_PRESETS.length - 1 : currentIndex - 1;
  return EQUALIZER_PRESETS[prevIndex];
};
