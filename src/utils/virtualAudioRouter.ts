
export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
}

export class VirtualAudioRouter {
  private supportedVirtualDevices = [
    'VB-Audio Cable',
    'VB-Cable',
    'Soundflower',
    'BlackHole',
    'JACK Audio',
    'Virtual Audio Cable',
    'Loopback',
    'Audio Hijack',
    'Serato Audio',
    'Traktor Audio',
    'VirtualDJ Audio'
  ];

  async getAvailableAudioDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Audio Input ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'audioinput',
          groupId: device.groupId
        }));
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return [];
    }
  }

  async getVirtualAudioDevices(): Promise<AudioDevice[]> {
    const allDevices = await this.getAvailableAudioDevices();
    return allDevices.filter(device => 
      this.supportedVirtualDevices.some(virtualDevice => 
        device.label.toLowerCase().includes(virtualDevice.toLowerCase())
      )
    );
  }

  async connectToVirtualDevice(deviceId: string): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 44100,
        channelCount: 2
      }
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  detectDJSoftware(): string[] {
    const detectedSoftware: string[] = [];
    
    // Check for common DJ software indicators in audio device names
    const commonDJSoftware = [
      'Serato', 'Traktor', 'VirtualDJ', 'djay', 'Mixxx', 
      'Cross DJ', 'rekordbox', 'Pioneer', 'Native Instruments'
    ];

    // This is a basic detection - in a real app you might check running processes
    // or use more sophisticated detection methods
    return detectedSoftware;
  }

  getSetupInstructions(): { software: string; instructions: string[] }[] {
    return [
      {
        software: 'VB-Audio Cable (Windows/Mac)',
        instructions: [
          'Download VB-Audio Cable from vb-audio.com',
          'Install and restart your computer',
          'Set VB-Cable as output in your DJ software/music app',
          'Select VB-Cable Input in this visualizer',
          'Start playing music in your DJ software'
        ]
      },
      {
        software: 'BlackHole (Mac)',
        instructions: [
          'Install BlackHole from github.com/ExistentialAudio/BlackHole',
          'Create Multi-Output Device in Audio MIDI Setup',
          'Set BlackHole as output in your music app',
          'Select BlackHole in this visualizer',
          'Start playing music'
        ]
      },
      {
        software: 'Serato DJ',
        instructions: [
          'In Serato: Setup → Audio → Output → Record Out',
          'Set Record Out to virtual audio device',
          'Make sure Record Out is enabled',
          'Select the virtual device in this visualizer',
          'Start DJing!'
        ]
      }
    ];
  }
}
