/**
 * Audio processing module using WebAudio API
 * Handles CQT (Constant-Q Transform) and wavelet analysis
 */

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private frequencyData: Float32Array | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.frequencyData = new Float32Array(bufferLength);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) {
      console.warn('Audio not ready to play');
      return;
    }

    // Stop previous playback if exists
    if (this.source) {
      this.source.stop();
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    this.source.start(0);
  }

  pause(): void {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
  }

  getFrequencyData(): Float32Array | null {
    if (!this.analyser || !this.frequencyData) {
      return null;
    }
    // @ts-ignore - TypeScript strict typing issue with ArrayBufferLike
    this.analyser.getFloatFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  /**
   * Apply Constant-Q Transform approximation
   * Returns frequency bins with logarithmic spacing
   */
  getCQTData(): Float32Array {
    const freqData = this.getFrequencyData();
    if (!freqData) {
      return new Float32Array(32);
    }

    // Simple CQT approximation: logarithmic binning
    const numBins = 32;
    const cqtData = new Float32Array(numBins);
    const freqDataLength = freqData.length;

    for (let i = 0; i < numBins; i++) {
      const start = Math.floor((freqDataLength * i * i) / (numBins * numBins));
      const end = Math.floor((freqDataLength * (i + 1) * (i + 1)) / (numBins * numBins));
      
      let sum = 0;
      let count = 0;
      for (let j = start; j < end && j < freqDataLength; j++) {
        sum += freqData[j];
        count++;
      }
      
      cqtData[i] = count > 0 ? sum / count : -100;
    }

    return cqtData;
  }

  /**
   * Wavelet transform approximation
   * Returns time-frequency representation
   */
  getWaveletData(): number[][] {
    const cqtData = this.getCQTData();
    const scales = 8;
    const waveletData: number[][] = [];

    for (let scale = 0; scale < scales; scale++) {
      const scaleData: number[] = [];
      const windowSize = Math.pow(2, scale + 1);

      for (let i = 0; i < cqtData.length - windowSize; i++) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          sum += cqtData[i + j];
        }
        scaleData.push(sum / windowSize);
      }

      waveletData.push(scaleData);
    }

    return waveletData;
  }

  dispose(): void {
    if (this.source) {
      this.source.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
