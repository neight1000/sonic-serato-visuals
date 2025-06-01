
export class BeatDetector {
  private analyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Uint8Array;
  private sampleRate: number;
  private beatThreshold: number = 1.2; // Reduced from 1.3 for more sensitive beat detection
  private lastBeatTime: number = 0;
  private energyHistory: number[] = [];
  private readonly historySize = 30; // Reduced from 43 for more responsive average

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.bufferLength = analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.sampleRate = analyser.context.sampleRate;
  }

  detectBeat(): { isBeat: boolean; energy: number; bassEnergy: number; trebleEnergy: number } {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate energy in different frequency ranges with better scaling
    const bassRange = Math.floor(this.bufferLength * 0.15); // Slightly larger bass range
    const trebleStart = Math.floor(this.bufferLength * 0.5); // Lower treble start for more coverage
    
    let totalEnergy = 0;
    let bassEnergy = 0;
    let trebleEnergy = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const value = this.dataArray[i] / 255;
      // Use logarithmic scaling for better energy detection
      const logValue = Math.log(value * 9 + 1) / Math.log(10);
      totalEnergy += logValue * logValue;
      
      if (i < bassRange) {
        bassEnergy += logValue * logValue;
      } else if (i > trebleStart) {
        trebleEnergy += logValue * logValue;
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
    
    // Calculate average energy with weighted recent values
    let weightedSum = 0;
    let weightSum = 0;
    for (let i = 0; i < this.energyHistory.length; i++) {
      const weight = (i + 1) / this.energyHistory.length; // More weight to recent values
      weightedSum += this.energyHistory[i] * weight;
      weightSum += weight;
    }
    const averageEnergy = weightedSum / weightSum;
    
    // Enhanced beat detection
    const now = Date.now();
    const timeSinceLastBeat = now - this.lastBeatTime;
    const isBeat = totalEnergy > (averageEnergy * this.beatThreshold) && timeSinceLastBeat > 250; // Reduced cooldown
    
    if (isBeat) {
      this.lastBeatTime = now;
    }
    
    return { isBeat, energy: totalEnergy, bassEnergy, trebleEnergy };
  }
}
