/**
 * Main application entry point
 * 3D Universe Audio Visualizer - Multiband line-based visualization
 * with chaotic attractors, SDEs, and divergence-free flow fields
 */

import './style.css';
import { AudioProcessor, FeatureExtractor } from './audio';
import { Renderer, BandManager } from './render';
import { UIController } from './ui';
import { ParameterMapper } from './math';

class WavelengthVisualizerApp {
  private audioProcessor: AudioProcessor;
  private featureExtractor: FeatureExtractor;
  private parameterMapper: ParameterMapper;
  private bandManager: BandManager;
  private renderer: Renderer;
  private uiController: UIController;
  private animationFrameId: number | null = null;
  private startTime: number = 0;

  constructor() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Initialize audio processing
    this.audioProcessor = new AudioProcessor();
    const numBands = this.audioProcessor.getNumBands();
    const sampleRate = this.audioProcessor.getSampleRate();
    
    // Initialize feature extraction
    this.featureExtractor = new FeatureExtractor(numBands, sampleRate);
    
    // Initialize parameter mapping
    this.parameterMapper = new ParameterMapper();
    
    // Initialize band manager
    this.bandManager = new BandManager(numBands, 20); // 20 instances per band
    
    // Initialize renderer
    this.renderer = new Renderer(canvas, this.bandManager);
    
    // Initialize UI
    this.uiController = new UIController();

    this.initializeUI();
    this.startTime = performance.now() / 1000;
    this.startRenderLoop();
  }

  private initializeUI(): void {
    this.uiController.setOnAudioFileChange(async (file) => {
      try {
        await this.audioProcessor.loadAudioFile(file);
        console.log('Audio file loaded successfully');
        
        // Reset feature extractor
        this.featureExtractor.reset();
        
        // Reset band manager
        this.bandManager.reset();
      } catch (error) {
        console.error('Failed to load audio file:', error);
      }
    });

    this.uiController.setOnPlayPause((playing) => {
      if (playing) {
        this.audioProcessor.play();
        this.startTime = performance.now() / 1000;
      } else {
        this.audioProcessor.pause();
      }
    });

    this.uiController.setOnReset(() => {
      this.audioProcessor.pause();
      this.featureExtractor.reset();
      this.bandManager.reset();
      this.parameterMapper.reset();
      this.startTime = performance.now() / 1000;
    });

    // Flow intensity control removed (now handled per-band via parameters)
  }

  private startRenderLoop(): void {
    const animate = () => {
      // Get audio data
      const cqtData = this.audioProcessor.getCQTData();
      
      // Calculate current time
      const currentTime = (performance.now() / 1000) - this.startTime;
      
      // Extract features
      const { bands: bandFeatures, global: globalFeatures } = 
        this.featureExtractor.extractFeatures(cqtData, undefined, currentTime);
      
      // Detect onsets
      const onsets = this.featureExtractor.detectOnsets(bandFeatures);
      
      // Update band parameters
      for (let b = 0; b < bandFeatures.length; b++) {
        const bandFeature = bandFeatures[b];
        const hasOnset = onsets[b];
        
        // Map features to visual parameters
        const params = this.parameterMapper.mapBandFeatures(
          b,
          bandFeature,
          globalFeatures,
          hasOnset
        );
        
        // Update band parameters
        this.bandManager.updateBandParameters(b, params);
      }
      
      // Render frame
      this.renderer.render(
        cqtData,
        globalFeatures.tempo,
        globalFeatures.beatStrength
      );

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.audioProcessor.dispose();
    this.renderer.dispose();
  }
}

// Initialize application
const app = new WavelengthVisualizerApp();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app.dispose();
});

// Export for debugging
(window as any).app = app;
