
export type AudioInputType = 'microphone' | 'file' | 'stream';

export interface AudioInputOptions {
  type: AudioInputType;
  file?: File;
  streamUrl?: string;
}

export class AudioInputManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioNode | null = null;
  private audioElement: HTMLAudioElement | null = null;

  async initializeInput(options: AudioInputOptions): Promise<{ audioContext: AudioContext; analyser: AnalyserNode }> {
    this.cleanup();

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    switch (options.type) {
      case 'microphone':
        await this.initializeMicrophone();
        break;
      case 'file':
        if (options.file) {
          await this.initializeFile(options.file);
        }
        break;
      case 'stream':
        if (options.streamUrl) {
          await this.initializeStream(options.streamUrl);
        }
        break;
    }

    if (this.source) {
      this.source.connect(this.analyser);
    }

    return { audioContext: this.audioContext, analyser: this.analyser };
  }

  private async initializeMicrophone(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
    this.source = this.audioContext!.createMediaStreamSource(stream);
  }

  private async initializeFile(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    
    this.audioElement = new Audio();
    this.audioElement.src = URL.createObjectURL(file);
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.loop = true;
    
    this.source = this.audioContext!.createMediaElementSource(this.audioElement);
    
    // Connect to destination so we can hear the audio
    this.source.connect(this.audioContext!.destination);
  }

  private async initializeStream(streamUrl: string): Promise<void> {
    this.audioElement = new Audio();
    this.audioElement.src = streamUrl;
    this.audioElement.crossOrigin = 'anonymous';
    
    this.source = this.audioContext!.createMediaElementSource(this.audioElement);
    this.source.connect(this.audioContext!.destination);
  }

  play(): void {
    if (this.audioElement) {
      this.audioElement.play();
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
