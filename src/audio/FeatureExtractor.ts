/**
 * Advanced audio feature extraction
 * Extracts per-band features: Hilbert envelopes, spectral flux, chroma, onsets, tempo
 */

export interface BandFeatures {
  envelope: number; // Hilbert envelope A_b(t)
  flux: number; // Spectral flux F_b(t)
  instantaneousFreq: number; // f_b(t)
  chroma: Float32Array; // 12-D pitch class vector
  energy: number; // Band energy
  centroid: number; // Spectral centroid
}

export interface GlobalFeatures {
  tempo: number; // Estimated tempo in BPM
  beatStrength: number; // Current beat strength (0-1)
  loudness: number; // Overall loudness
  spectralCentroid: number; // Global spectral centroid
  entropy: number; // Shannon entropy of band energy distribution
}

export class FeatureExtractor {
  private numBands: number;
  private previousEnergies: Float32Array;
  private previousPhases: Float32Array;
  private fluxHistory: number[];
  private energyHistory: number[];
  private timeHistory: number[];
  private maxHistoryLength: number;
  
  // EMA filters for smoothing (100-250ms)
  private envelopeEMA: Float32Array;
  private fluxEMA: Float32Array;
  private centroidEMA: Float32Array;
  private alphaEMA: number; // EMA coefficient

  constructor(numBands: number = 36, sampleRate: number = 44100) {
    this.numBands = numBands;
    this.previousEnergies = new Float32Array(numBands);
    this.previousPhases = new Float32Array(numBands);
    this.fluxHistory = [];
    this.energyHistory = [];
    this.timeHistory = [];
    this.maxHistoryLength = Math.floor(sampleRate * 0.1); // 100ms history
    
    // Initialize EMA filters
    const emaTimeConstant = 0.15; // 150ms
    this.alphaEMA = 1 - Math.exp(-1 / (emaTimeConstant * sampleRate / 1024)); // Assuming ~1024 samples per frame
    this.envelopeEMA = new Float32Array(numBands);
    this.fluxEMA = new Float32Array(numBands);
    this.centroidEMA = new Float32Array(numBands);
  }

  /**
   * Extract features from CQT magnitude data
   * @param cqtMagnitudes - Magnitude spectrum from CQT (dB values)
   * @param cqtPhases - Phase spectrum from CQT (optional, for instantaneous frequency)
   * @param time - Current time in seconds
   */
  extractFeatures(
    cqtMagnitudes: Float32Array,
    cqtPhases?: Float32Array,
    time: number = 0
  ): { bands: BandFeatures[]; global: GlobalFeatures } {
    const bands: BandFeatures[] = [];
    const numBands = Math.min(cqtMagnitudes.length, this.numBands);
    
    // Convert dB to linear energy
    const energies = new Float32Array(numBands);
    for (let i = 0; i < numBands; i++) {
      energies[i] = Math.pow(10, cqtMagnitudes[i] / 20);
    }

    // Extract per-band features
    for (let b = 0; b < numBands; b++) {
      const energy = energies[b];
      const prevEnergy = this.previousEnergies[b];
      
      // Hilbert envelope approximation (magnitude of analytic signal)
      // For real-time, use energy as envelope proxy
      const envelope = energy;
      
      // Spectral flux: positive change in energy
      const flux = Math.max(0, energy - prevEnergy);
      
      // Instantaneous frequency from phase difference
      let instantaneousFreq = 0;
      if (cqtPhases && b < cqtPhases.length) {
        const phaseDiff = cqtPhases[b] - this.previousPhases[b];
        // Unwrap phase
        const unwrappedPhase = phaseDiff + (phaseDiff < -Math.PI ? 2 * Math.PI : (phaseDiff > Math.PI ? -2 * Math.PI : 0));
        instantaneousFreq = unwrappedPhase / (2 * Math.PI);
      }
      
      // Chroma: 12-D pitch class vector
      const chroma = this.computeChroma(cqtMagnitudes, b);
      
      // Spectral centroid (weighted average frequency)
      const centroid = this.computeBandCentroid(cqtMagnitudes, b);
      
      // Apply EMA smoothing
      this.envelopeEMA[b] = this.envelopeEMA[b] * (1 - this.alphaEMA) + envelope * this.alphaEMA;
      this.fluxEMA[b] = this.fluxEMA[b] * (1 - this.alphaEMA) + flux * this.alphaEMA;
      this.centroidEMA[b] = this.centroidEMA[b] * (1 - this.alphaEMA) + centroid * this.alphaEMA;
      
      bands.push({
        envelope: this.envelopeEMA[b],
        flux: this.fluxEMA[b],
        instantaneousFreq,
        chroma,
        energy,
        centroid: this.centroidEMA[b]
      });
      
      // Update history
      this.previousEnergies[b] = energy;
      if (cqtPhases && b < cqtPhases.length) {
        this.previousPhases[b] = cqtPhases[b];
      }
    }
    
    // Extract global features
    const global = this.extractGlobalFeatures(energies, cqtMagnitudes, time);
    
    return { bands, global };
  }

  /**
   * Compute chroma (12-D pitch class) from CQT magnitudes
   * Maps frequency bins to 12 pitch classes (C, C#, D, ..., B)
   */
  private computeChroma(cqtMagnitudes: Float32Array, bandIndex: number): Float32Array {
    // Use cqtMagnitudes for energy calculation
    const chroma = new Float32Array(12);
    
    // Map band index to pitch class
    // Assuming CQT starts at A4 (440Hz) or similar reference
    // For simplicity, use modulo 12 mapping
    const pitchClass = bandIndex % 12;
    
    // Distribute energy to nearby pitch classes with Gaussian weighting
    for (let i = 0; i < 12; i++) {
      let dist = Math.abs(i - pitchClass);
      dist = Math.min(dist, 12 - dist); // Wrap around
      const weight = Math.exp(-dist * dist / 2.0);
      chroma[i] = weight * Math.pow(10, cqtMagnitudes[bandIndex] / 20);
    }
    
    // Normalize
    const sum = chroma.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < 12; i++) {
        chroma[i] /= sum;
      }
    }
    
    return chroma;
  }

  /**
   * Compute spectral centroid for a band
   */
  private computeBandCentroid(_cqtMagnitudes: Float32Array, bandIndex: number): number {
    // Simplified: use band index as frequency proxy
    // In a full implementation, would use actual frequency mapping
    return bandIndex;
  }

  /**
   * Extract global features: tempo, beat strength, loudness, entropy
   */
  private extractGlobalFeatures(
    energies: Float32Array,
    _cqtMagnitudes: Float32Array,
    time: number
  ): GlobalFeatures {
    // Loudness: RMS of energies
    let loudness = 0;
    for (let i = 0; i < energies.length; i++) {
      loudness += energies[i] * energies[i];
    }
    loudness = Math.sqrt(loudness / energies.length);
    
    // Spectral centroid: weighted average of band indices
    let weightedSum = 0;
    let energySum = 0;
    for (let i = 0; i < energies.length; i++) {
      weightedSum += i * energies[i];
      energySum += energies[i];
    }
    const spectralCentroid = energySum > 0 ? weightedSum / energySum : 0;
    
    // Entropy: Shannon entropy of energy distribution
    let entropy = 0;
    if (energySum > 0) {
      for (let i = 0; i < energies.length; i++) {
        const p = energies[i] / energySum;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      }
    }
    
    // Tempo and beat strength: analyze flux history
    this.fluxHistory.push(energies.reduce((a, b) => a + b, 0));
    this.energyHistory.push(loudness);
    this.timeHistory.push(time);
    
    // Keep history bounded
    if (this.fluxHistory.length > this.maxHistoryLength) {
      this.fluxHistory.shift();
      this.energyHistory.shift();
      this.timeHistory.shift();
    }
    
    const { tempo, beatStrength } = this.estimateTempo();
    
    return {
      tempo,
      beatStrength,
      loudness,
      spectralCentroid,
      entropy
    };
  }

  /**
   * Estimate tempo from flux history using autocorrelation
   */
  private estimateTempo(): { tempo: number; beatStrength: number } {
    if (this.fluxHistory.length < 10) {
      return { tempo: 120, beatStrength: 0 };
    }
    
    // Simple peak detection in flux history
    let maxFlux = 0;
    let beatStrength = 0;
    
    for (let i = 1; i < this.fluxHistory.length - 1; i++) {
      const flux = this.fluxHistory[i];
      if (flux > this.fluxHistory[i - 1] && flux > this.fluxHistory[i + 1]) {
        if (flux > maxFlux) {
          maxFlux = flux;
        }
      }
    }
    
    // Normalize beat strength
    const avgFlux = this.fluxHistory.reduce((a, b) => a + b, 0) / this.fluxHistory.length;
    beatStrength = avgFlux > 0 ? Math.min(1, maxFlux / (avgFlux * 3)) : 0;
    
    // Estimate tempo from peak intervals (simplified)
    // In full implementation, would use autocorrelation or FFT of flux
    const tempo = 120; // Default, would be computed from peak intervals
    
    return { tempo, beatStrength };
  }

  /**
   * Detect onsets (sudden energy increases)
   */
  detectOnsets(bands: BandFeatures[]): boolean[] {
    const onsets = new Array(bands.length).fill(false);
    
    for (let i = 0; i < bands.length; i++) {
      // Onset if flux exceeds threshold
      const threshold = 0.1; // Adjust based on testing
      if (bands[i].flux > threshold) {
        onsets[i] = true;
      }
    }
    
    return onsets;
  }

  /**
   * Reset feature extractor state
   */
  reset(): void {
    this.previousEnergies.fill(0);
    this.previousPhases.fill(0);
    this.fluxHistory = [];
    this.energyHistory = [];
    this.timeHistory = [];
    this.envelopeEMA.fill(0);
    this.fluxEMA.fill(0);
    this.centroidEMA.fill(0);
  }
}

