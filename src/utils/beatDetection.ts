
export class BeatDetector {
  private analyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Uint8Array;
  private sampleRate: number;
  private beatThreshold: number = 1.3;
  private lastBeatTime: number = 0;
  private energyHistory: number[] = [];
  private readonly historySize = 43;

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.bufferLength = analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.sampleRate = analyser.context.sampleRate;
  }

  detectBeat(): { isBeat: boolean; energy: number; bassEnergy: number; trebleEnergy: number } {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate energy in different frequency ranges
    const bassRange = Math.floor(this.bufferLength * 0.1); // Low frequencies
    const trebleStart = Math.floor(this.bufferLength * 0.6); // High frequencies
    
    let totalEnergy = 0;
    let bassEnergy = 0;
    let trebleEnergy = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const value = this.dataArray[i] / 255;
      totalEnergy += value * value;
      
      if (i < bassRange) {
        bassEnergy += value * value;
      } else if (i > trebleStart) {
        trebleEnergy += value * value;
      }
    }
    
    totalEnergy /= this.bufferLength;
    bassEnergy /= bassRange;
    trebleEnergy /= (this.bufferLength - trebleStart);
    
    // Add to energy history
    this.energyHistory.push(totalEnergy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    // Calculate average energy
    const averageEnergy = this.energyHistory.reduce((sum, energy) => sum + energy, 0) / this.energyHistory.length;
    
    // Detect beat
    const now = Date.now();
    const timeSinceLastBeat = now - this.lastBeatTime;
    const isBeat = totalEnergy > (averageEnergy * this.beatThreshold) && timeSinceLastBeat > 300;
    
    if (isBeat) {
      this.lastBeatTime = now;
    }
    
    return { isBeat, energy: totalEnergy, bassEnergy, trebleEnergy };
  }
}
