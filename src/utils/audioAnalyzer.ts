
export interface FrequencyBands {
  subBass: number;     // 20-60 Hz
  bass: number;        // 60-250 Hz
  lowMid: number;      // 250-500 Hz
  highMid: number;     // 500-2000 Hz
  presence: number;    // 2000-4000 Hz
  brilliance: number;  // 4000+ Hz
}

export class EnhancedAudioAnalyzer {
  private analyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Uint8Array;
  private sampleRate: number;

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.bufferLength = analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.sampleRate = analyser.context.sampleRate;
  }

  getFrequencyBands(): FrequencyBands {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    const nyquist = this.sampleRate / 2;
    const binSize = nyquist / this.bufferLength;
    
    // Calculate frequency ranges in bins
    const subBassEnd = Math.floor(60 / binSize);
    const bassEnd = Math.floor(250 / binSize);
    const lowMidEnd = Math.floor(500 / binSize);
    const highMidEnd = Math.floor(2000 / binSize);
    const presenceEnd = Math.floor(4000 / binSize);
    
    return {
      subBass: this.getAverageInRange(0, subBassEnd),
      bass: this.getAverageInRange(subBassEnd, bassEnd),
      lowMid: this.getAverageInRange(bassEnd, lowMidEnd),
      highMid: this.getAverageInRange(lowMidEnd, highMidEnd),
      presence: this.getAverageInRange(highMidEnd, presenceEnd),
      brilliance: this.getAverageInRange(presenceEnd, this.bufferLength)
    };
  }

  private getAverageInRange(start: number, end: number): number {
    let sum = 0;
    let count = 0;
    for (let i = start; i < Math.min(end, this.bufferLength); i++) {
      sum += this.dataArray[i];
      count++;
    }
    return count > 0 ? sum / count / 255 : 0;
  }

  getFullSpectrum(): Uint8Array {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getWaveform(): Uint8Array {
    const waveformData = new Uint8Array(this.bufferLength);
    this.analyser.getByteTimeDomainData(waveformData);
    return waveformData;
  }
}
