
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
  visualMode: 'bars' | 'wave' | 'circular' | '3d';
}

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  {
    id: 'neon-nights',
    name: 'NEON NIGHTS',
    description: 'Classic synthwave neon pink and cyan bars',
    bands: [0.8, 0.9, 0.7, 0.6, 0.8, 0.9, 0.7, 0.5],
    color: {
      primary: '#ff0080',
      secondary: '#00ffff',
      glow: '#ff0080'
    },
    visualMode: 'bars'
  },
  {
    id: 'electric-dreams',
    name: 'ELECTRIC DREAMS',
    description: 'Electric blue neon spectrum waves',
    bands: [0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.5],
    color: {
      primary: '#0080ff',
      secondary: '#80e0ff',
      glow: '#0080ff'
    },
    visualMode: 'wave'
  },
  {
    id: 'neon-rainbow',
    name: 'NEON RAINBOW',
    description: 'Vibrant neon rainbow circular display',
    bands: [0.7, 0.9, 0.6, 0.8, 0.9, 0.7, 0.8, 0.6],
    color: {
      primary: '#ff4000',
      secondary: '#ff8000',
      glow: '#ffff00'
    },
    visualMode: 'circular'
  },
  {
    id: 'cyber-matrix',
    name: 'CYBER MATRIX',
    description: 'Green matrix-style 3D neon bars',
    bands: [0.9, 0.8, 0.7, 0.9, 0.6, 0.8, 0.9, 0.7],
    color: {
      primary: '#00ff41',
      secondary: '#00cc33',
      glow: '#00ff41'
    },
    visualMode: '3d'
  },
  {
    id: 'plasma-storm',
    name: 'PLASMA STORM',
    description: 'Purple plasma energy waveforms',
    bands: [0.8, 0.6, 0.9, 0.7, 0.8, 0.9, 0.6, 0.8],
    color: {
      primary: '#8a2be2',
      secondary: '#da70d6',
      glow: '#9370db'
    },
    visualMode: 'wave'
  },
  {
    id: 'solar-flare',
    name: 'SOLAR FLARE',
    description: 'Intense orange-red solar energy bars',
    bands: [0.7, 0.8, 0.9, 0.6, 0.7, 0.9, 0.8, 0.7],
    color: {
      primary: '#ff4500',
      secondary: '#ffa500',
      glow: '#ff6347'
    },
    visualMode: 'bars'
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
