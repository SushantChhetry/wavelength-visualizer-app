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
  private phaseData: Float32Array | null = null;
  private gainNode: GainNode | null = null;
  private playbackOffset: number = 0;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  
  // CQT parameters
  private numBands: number = 36;
  private minFreq: number = 55; // Hz
  private maxFreq: number = 8000; // Hz
  private binsPerOctave: number = 12;
  private sampleRate: number = 44100;
  
  // CQT frequency mapping cache
  private cqtFreqMap: number[] | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new AudioContext();
      this.sampleRate = this.audioContext.sampleRate;
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096; // Increased for better frequency resolution
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.frequencyData = new Float32Array(bufferLength);
      this.phaseData = new Float32Array(bufferLength);
      
      this.initCQTFreqMap();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Initialize CQT frequency mapping
   * Maps linear FFT bins to constant-Q bins
   */
  private initCQTFreqMap(): void {
    const nyquist = this.sampleRate / 2;
    const fftSize = this.analyser?.fftSize || 4096;
    const fftBinWidth = nyquist / (fftSize / 2);
    
    // Calculate number of CQT bands
    const maxOctaves = Math.log2(this.maxFreq / this.minFreq);
    this.numBands = Math.floor(maxOctaves * this.binsPerOctave);
    
    // Create frequency mapping: for each CQT band, which FFT bins contribute
    this.cqtFreqMap = [];
    
    for (let band = 0; band < this.numBands; band++) {
      // Center frequency of this CQT band
      const centerFreq = this.minFreq * Math.pow(2, band / this.binsPerOctave);
      
      // Bandwidth is proportional to center frequency (constant Q)
      const Q = Math.pow(2, 1 / this.binsPerOctave) - 1;
      const bandwidth = centerFreq / Q;
      
      // Map to FFT bins
      const startFreq = centerFreq - bandwidth / 2;
      const endFreq = centerFreq + bandwidth / 2;
      
      const startBin = Math.floor(startFreq / fftBinWidth);
      const endBin = Math.ceil(endFreq / fftBinWidth);
      
      this.cqtFreqMap.push((startBin << 16) | (endBin & 0xFFFF)); // Pack two shorts
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Stop any current playback
    this.pause();
    this.playbackOffset = 0;

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser || !this.gainNode) {
      console.warn('Audio not ready to play');
      return;
    }

    // If already playing, do nothing
    if (this.isPlaying) {
      return;
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Stop previous playback if exists
    if (this.source) {
      this.source.stop();
      this.source = null;
    }

    // Create new source (AudioBufferSourceNode can only be started once)
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    
    // Connect: source -> analyser -> gain -> destination
    this.source.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    // Handle end of playback
    this.source.onended = () => {
      this.isPlaying = false;
      this.playbackOffset = 0;
      this.source = null;
    };
    
    // Start playback from current offset
    const duration = this.audioBuffer.duration;
    const remainingTime = duration - this.playbackOffset;
    
    if (remainingTime > 0) {
      this.startTime = this.audioContext.currentTime - this.playbackOffset;
      this.source.start(0, this.playbackOffset);
      this.isPlaying = true;
    } else {
      // Audio has finished
      this.isPlaying = false;
      this.playbackOffset = 0;
    }
  }

  pause(): void {
    if (this.source && this.isPlaying) {
      // Calculate current playback position
      if (this.audioContext && this.audioBuffer) {
        const elapsed = this.audioContext.currentTime - this.startTime;
        this.playbackOffset = Math.min(elapsed, this.audioBuffer.duration);
      }
      
      this.source.stop();
      this.source = null;
      this.isPlaying = false;
    }
  }

  stop(): void {
    this.pause();
    this.playbackOffset = 0;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getVolume(): number {
    return this.gainNode?.gain.value ?? 1.0;
  }

  getCurrentTime(): number {
    if (!this.isPlaying || !this.audioContext || !this.audioBuffer) {
      return this.playbackOffset;
    }
    const elapsed = this.audioContext.currentTime - this.startTime;
    return Math.min(elapsed, this.audioBuffer.duration);
  }

  getDuration(): number {
    return this.audioBuffer?.duration ?? 0;
  }

  seek(time: number): void {
    if (!this.audioBuffer) return;
    
    const wasPlaying = this.isPlaying;
    this.pause();
    
    this.playbackOffset = Math.max(0, Math.min(time, this.audioBuffer.duration));
    
    if (wasPlaying) {
      this.play();
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
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
   * Get phase data for instantaneous frequency calculation
   */
  getPhaseData(): Float32Array | null {
    if (!this.analyser || !this.phaseData) {
      return null;
    }
    
    // Use AnalyserNode's getByteTimeDomainData to get real/imaginary parts
    // For phase, we'd need a custom FFT or use ScriptProcessorNode
    // For now, return null and compute phase difference from magnitude changes
    return null;
  }

  /**
   * Apply Constant-Q Transform
   * Returns frequency bins with logarithmic spacing (24-36 bands covering 55Hz-8kHz)
   */
  getCQTData(): Float32Array {
    const freqData = this.getFrequencyData();
    if (!freqData || !this.cqtFreqMap) {
      return new Float32Array(this.numBands);
    }

    const cqtData = new Float32Array(this.numBands);
    const freqDataLength = freqData.length;

    for (let band = 0; band < this.numBands; band++) {
      const packed = this.cqtFreqMap[band];
      const startBin = (packed >> 16) & 0xFFFF;
      const endBin = packed & 0xFFFF;
      
      // Aggregate FFT bins for this CQT band
      let sum = 0;
      let count = 0;
      let maxMag = -Infinity;
      
      for (let j = startBin; j <= endBin && j < freqDataLength; j++) {
        const mag = freqData[j];
        sum += mag;
        maxMag = Math.max(maxMag, mag);
        count++;
      }
      
      // Use max magnitude for better peak detection, or average
      // Average works better for smooth envelopes
      cqtData[band] = count > 0 ? sum / count : -100;
    }

    return cqtData;
  }

  /**
   * Get number of CQT bands
   */
  getNumBands(): number {
    return this.numBands;
  }

  /**
   * Get sample rate
   */
  getSampleRate(): number {
    return this.sampleRate;
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
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
