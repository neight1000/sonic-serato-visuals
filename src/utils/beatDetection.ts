
export class BeatDetector {
  private analyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Uint8Array;
  private sampleRate: number;
  private beatThreshold: number = 1.3;
  private lastBeatTime: number = 0;
  private energyHistory: number[] = [];
  private readonly historySize = 10;

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.bufferLength = analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.sampleRate = analyser.context.sampleRate;
  }

  detectBeat(): { isBeat: boolean; energy: number; bassEnergy: number; trebleEnergy: number } {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    const bassRange = Math.floor(this.bufferLength * 0.15);
    const trebleStart = Math.floor(this.bufferLength * 0.7);
    
    let totalEnergy = 0;
    let bassEnergy = 0;
    let trebleEnergy = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const value = this.dataArray[i] / 255;
      const energyValue = value * value;
      totalEnergy += energyValue;
      
      if (i < bassRange) {
        bassEnergy += energyValue;
      } else if (i > trebleStart) {
        trebleEnergy += energyValue;
      }
    }
    
    totalEnergy /= this.bufferLength;
    bassEnergy /= bassRange;
    trebleEnergy /= (this.bufferLength - trebleStart);
    
    this.energyHistory.push(totalEnergy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    const averageEnergy = this.energyHistory.reduce((sum, energy) => sum + energy, 0) / this.energyHistory.length;
    
    const now = Date.now();
    const timeSinceLastBeat = now - this.lastBeatTime;
    const isBeat = totalEnergy > (averageEnergy * this.beatThreshold) && timeSinceLastBeat > 150;
    
    if (isBeat) {
      this.lastBeatTime = now;
    }
    
    return { isBeat, energy: totalEnergy, bassEnergy, trebleEnergy };
  }
}
