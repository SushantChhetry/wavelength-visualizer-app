# Architecture

This document describes the architecture of the Wavelength Visualizer application.

## Overview

The application follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│                    (HTML + CSS + UI)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   Main Controller                        │
│                    (main.ts)                             │
└───┬──────────────────┬──────────────────┬───────────────┘
    │                  │                  │
    ↓                  ↓                  ↓
┌────────────┐  ┌────────────┐  ┌─────────────────┐
│   Audio    │  │    Math    │  │     Render      │
│  Module    │  │   Module   │  │     Module      │
└────────────┘  └────────────┘  └─────────────────┘
    │                  │                  │
    ↓                  ↓                  ↓
┌────────────┐  ┌────────────┐  ┌─────────────────┐
│  WebAudio  │  │  Curl Noise│  │   Three.js      │
│    API     │  │    + SDE   │  │  + GLSL Shaders │
└────────────┘  └────────────┘  └─────────────────┘
```

## Module Details

### 1. Audio Module (`src/audio/`)

**Responsibilities:**
- Load and decode audio files
- Process audio in real-time
- Extract frequency data
- Apply CQT transformation
- Compute wavelet transform

**Key Classes:**
- `AudioProcessor`: Main audio processing class

**External Dependencies:**
- WebAudio API (Browser native)

**Data Flow:**
```
Audio File → ArrayBuffer → AudioBuffer → AnalyserNode → FrequencyData
                                                              ↓
                                                         CQT/Wavelet
```

### 2. Math Module (`src/math/`)

**Responsibilities:**
- Mathematical utilities
- Curl noise generation
- SDE integration
- Vector operations

**Key Components:**
- `curlNoise3D()`: 3D curl noise function
- `SDEIntegrator`: Euler-Maruyama integration
- `lerp()`, `clamp()`, `map()`: Utility functions

**Mathematical Foundations:**

**Curl Noise:**
```typescript
curl(F) = ∇ × F
// Computed using finite differences:
∂F/∂x ≈ (F(x+ε) - F(x-ε)) / 2ε
```

**SDE Integration (Euler-Maruyama):**
```typescript
X_{n+1} = X_n + μ(X_n, t_n)Δt + σ(X_n, t_n)ΔW_n
// where ΔW_n ~ N(0, Δt)
```

### 3. Render Module (`src/render/`)

**Responsibilities:**
- WebGL rendering setup
- Particle system management
- Camera control
- Frame rendering

**Key Classes:**
- `Renderer`: Main rendering class
- `ParticleSystem`: Particle position/velocity management

**Rendering Pipeline:**
```
Particle Data → Buffer Geometry → Shader Material → GPU → Screen
                                         ↑
                                    GLSL Shaders
```

### 4. Shaders Module (`src/shaders/`)

**Responsibilities:**
- GLSL shader code
- Vertex transformations
- Fragment coloring

**Shaders:**
- `particle.vert`: Vertex shader with curl noise
- `particle.frag`: Fragment shader with soft particles

**GPU Processing:**
```
Per-vertex: Position → Curl Flow → Transform → Projection
Per-fragment: Color → Alpha blending → Output
```

### 5. UI Module (`src/ui/`)

**Responsibilities:**
- User interaction handling
- Control panel management
- Event dispatching

**Key Classes:**
- `UIController`: Main UI controller

**Events:**
- Audio file selection
- Play/pause control
- Reset functionality
- Flow intensity adjustment

## Data Flow

### Initialization
```
1. Create AudioProcessor
2. Create Renderer with canvas
3. Create UIController
4. Wire up event handlers
5. Start render loop
```

### Audio Processing Loop
```
1. Get frequency data from AnalyserNode
2. Apply CQT transformation
3. Calculate audio intensity
4. Pass to renderer
```

### Render Loop
```
1. Update time
2. Get audio intensity
3. Update particle positions with SDE
4. Apply curl noise flow
5. Update shader uniforms
6. Render scene
7. Request next frame
```

## Performance Considerations

### WebGL Optimizations
- Use BufferGeometry for efficient GPU memory
- Batch particle rendering
- Minimize uniform updates
- Use additive blending for soft particles

### Audio Processing
- Reuse Float32Array buffers
- Limit FFT size to balance quality/performance
- Cache wavelet computations

### Particle System
- Fixed particle count
- Efficient array operations
- Boundary conditions for position wrapping

## WebGPU Considerations

The application is designed to support WebGPU when available:

1. **Compute Shaders**: Particle updates could be moved to compute shaders
2. **Buffer Management**: More efficient buffer updates with WebGPU
3. **Pipeline State**: Reduced state changes with WebGPU pipelines

Future enhancement: Add WebGPU backend detection and implementation.

## Testing Strategy

### Unit Tests
- Math utilities (curl noise, SDE, interpolation)
- Audio processing functions
- Particle system logic

### Integration Tests
- Audio → Math → Render pipeline
- UI event handling
- Resource lifecycle management

### Performance Tests
- FPS monitoring
- Memory usage
- Audio latency

## Deployment Architecture

### Frontend (Vercel)
```
Source → Build (Vite) → Static Files → Vercel CDN
```

### Backend (Railway)
```
Source → Docker Build → Container → Railway Platform
```

## Browser Compatibility

**Minimum Requirements:**
- WebGL 2.0 support
- WebAudio API support
- ES2020 JavaScript features
- File API support

**Tested Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

1. **Audio Files**: Client-side processing only, no server upload
2. **XSS Prevention**: No dynamic HTML injection
3. **CSP**: Content Security Policy headers in deployment
4. **HTTPS**: Required for AudioContext in production

## Future Enhancements

1. **WebGPU Backend**: Full GPU compute pipeline
2. **Advanced Wavelets**: More wavelet families
3. **Export**: Save visualizations as video
4. **Presets**: Predefined visual styles
5. **MIDI Support**: Real-time MIDI input
6. **Spatial Audio**: 3D audio positioning
