
export class BeatDetector {
  private analyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Uint8Array;
  private sampleRate: number;
  private beatThreshold: number = 1.15; // Reduced for more responsive but not oversensitive detection
  private lastBeatTime: number = 0;
  private energyHistory: number[] = [];
  private readonly historySize = 20; // Reduced for faster response

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.bufferLength = analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.sampleRate = analyser.context.sampleRate;
  }

  detectBeat(): { isBeat: boolean; energy: number; bassEnergy: number; trebleEnergy: number } {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Optimized energy calculation
    const bassRange = Math.floor(this.bufferLength * 0.1);
    const trebleStart = Math.floor(this.bufferLength * 0.6);
    
    let totalEnergy = 0;
    let bassEnergy = 0;
    let trebleEnergy = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const value = this.dataArray[i] / 255;
      // Simplified energy calculation for better performance
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
    
    // Add to energy history
    this.energyHistory.push(totalEnergy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    // Simple average calculation for better performance
    const averageEnergy = this.energyHistory.reduce((sum, energy) => sum + energy, 0) / this.energyHistory.length;
    
    // Optimized beat detection
    const now = Date.now();
    const timeSinceLastBeat = now - this.lastBeatTime;
    const isBeat = totalEnergy > (averageEnergy * this.beatThreshold) && timeSinceLastBeat > 200;
    
    if (isBeat) {
      this.lastBeatTime = now;
    }
    
    return { isBeat, energy: totalEnergy, bassEnergy, trebleEnergy };
  }
}
