
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
    id: 'electric-dreams',
    name: 'ELECTRIC DREAMS',
    description: 'Neon blue electric energy',
    bands: [0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.5],
    color: {
      primary: '#0080ff',
      secondary: '#00e6ff',
      glow: '#0080ff'
    },
    visualMode: 'wave'
  },
  {
    id: 'rainbow-spectrum',
    name: 'RAINBOW SPECTRUM',
    description: 'Vintage 90s multicolor magic',
    bands: [0.7, 0.9, 0.6, 0.8, 0.9, 0.7, 0.8, 0.6],
    color: {
      primary: '#ff0080',
      secondary: '#00ff80',
      glow: '#ff4000'
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
