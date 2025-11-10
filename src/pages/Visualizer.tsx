import { useEffect, useRef, useState } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { AudioProcessor, FeatureExtractor } from '../audio';
import { Renderer, BandManager } from '../render';
import { ParameterMapper } from '../math';
import { AudioControls } from '../components/AudioControls';
import { Navbar } from '../components/Navbar';

const theme = createTheme({
  primaryColor: 'cyan',
  colors: {
    dark: [
      '#000000',
      '#0a0a0a',
      '#1a1a1a',
      '#2a2a2a',
      '#3a3a3a',
      '#4a4a4a',
      '#5a5a5a',
      '#6a6a6a',
      '#7a7a7a',
      '#8a8a8a',
    ],
  },
  defaultRadius: 'md',
  fontFamily: 'var(--font-body)',
  headings: {
    fontFamily: 'var(--font-heading)',
  },
});

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const featureExtractorRef = useRef<FeatureExtractor | null>(null);
  const parameterMapperRef = useRef<ParameterMapper | null>(null);
  const bandManagerRef = useRef<BandManager | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas element not found');
      return;
    }

    try {
      // Initialize audio processing
      const audioProcessor = new AudioProcessor();
      audioProcessorRef.current = audioProcessor;
      
      const numBands = audioProcessor.getNumBands();
      const sampleRate = audioProcessor.getSampleRate();
      
      // Initialize feature extraction
      const featureExtractor = new FeatureExtractor(numBands, sampleRate);
      featureExtractorRef.current = featureExtractor;
      
      // Initialize parameter mapping
      const parameterMapper = new ParameterMapper();
      parameterMapperRef.current = parameterMapper;
      
      // Initialize band manager
      const bandManager = new BandManager(numBands, 20);
      bandManagerRef.current = bandManager;
      
      // Initialize renderer
      const renderer = new Renderer(canvasRef.current, bandManager);
      rendererRef.current = renderer;
      
      startTimeRef.current = performance.now() / 1000;
      startRenderLoop();
    } catch (error) {
      console.error('Error initializing visualizer:', error);
      setError(`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioProcessorRef.current) {
        audioProcessorRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update current time periodically
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (audioProcessorRef.current) {
        const time = audioProcessorRef.current.getCurrentTime();
        setCurrentTime(time);
        const dur = audioProcessorRef.current.getDuration();
        if (dur > 0) {
          setDuration(dur);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const startRenderLoop = () => {
    const animate = () => {
      const audioProcessor = audioProcessorRef.current;
      const featureExtractor = featureExtractorRef.current;
      const parameterMapper = parameterMapperRef.current;
      const bandManager = bandManagerRef.current;
      const renderer = rendererRef.current;

      if (!audioProcessor || !featureExtractor || !parameterMapper || !bandManager || !renderer) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // Get audio data
      const cqtData = audioProcessor.getCQTData();
      
      // Calculate current time
      const currentTime = (performance.now() / 1000) - startTimeRef.current;
      
      // Extract features
      const { bands: bandFeatures, global: globalFeatures } = 
        featureExtractor.extractFeatures(cqtData, undefined, currentTime);
      
      // Detect onsets
      const onsets = featureExtractor.detectOnsets(bandFeatures);
      
      // Update band parameters
      for (let b = 0; b < bandFeatures.length; b++) {
        const bandFeature = bandFeatures[b];
        const hasOnset = onsets[b];
        
        // Map features to visual parameters
        const params = parameterMapper.mapBandFeatures(
          b,
          bandFeature,
          globalFeatures,
          hasOnset
        );
        
        // Update band parameters
        bandManager.updateBandParameters(b, params);
      }
      
      // Render frame
      renderer.render(
        cqtData,
        globalFeatures.tempo,
        globalFeatures.beatStrength
      );

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!audioProcessorRef.current) {
        throw new Error('Audio processor not initialized');
      }

      await audioProcessorRef.current.loadAudioFile(file);
      setLoadedFileName(file.name);
      setDuration(audioProcessorRef.current.getDuration());
      setCurrentTime(0);
      
      // Reset feature extractor
      if (featureExtractorRef.current) {
        featureExtractorRef.current.reset();
      }
      
      // Reset band manager
      if (bandManagerRef.current) {
        bandManagerRef.current.reset();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio file';
      setError(errorMessage);
      console.error('Failed to load audio file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioProcessorRef.current) return;

    if (isPlaying) {
      audioProcessorRef.current.pause();
      setIsPlaying(false);
    } else {
      audioProcessorRef.current.play();
      setIsPlaying(true);
      startTimeRef.current = performance.now() / 1000;
    }
  };

  const handleStop = () => {
    if (!audioProcessorRef.current) return;
    
    audioProcessorRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (featureExtractorRef.current) {
      featureExtractorRef.current.reset();
    }
    if (bandManagerRef.current) {
      bandManagerRef.current.reset();
    }
    if (parameterMapperRef.current) {
      parameterMapperRef.current.reset();
    }
    
    startTimeRef.current = performance.now() / 1000;
  };

  const handleSeek = (time: number) => {
    if (!audioProcessorRef.current) return;
    audioProcessorRef.current.seek(time);
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!audioProcessorRef.current) return;
    audioProcessorRef.current.setVolume(newVolume);
    setVolume(newVolume);
  };

  return (
    <MantineProvider theme={theme}>
      <Navbar />
      <div id="app" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <canvas 
          ref={canvasRef} 
          id="canvas"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none' as const
          }}
        ></canvas>
        <AudioControls
          onFileUpload={handleFileUpload}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          loadedFileName={loadedFileName}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </MantineProvider>
  );
}

