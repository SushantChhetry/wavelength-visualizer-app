import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import mermaid from 'mermaid';
import { Navbar } from '../components/Navbar';
import './About.css';

export function About() {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#00ffff',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#00ffff',
        lineColor: '#00ffff',
        secondaryColor: '#1a1a1a',
        tertiaryColor: '#2a2a2a',
        background: '#000000',
        mainBkg: '#0a0a0a',
        textColor: '#ffffff',
      },
    });

    if (mermaidRef.current) {
      const diagram = `graph TB
    UI["User Interface<br/>HTML + CSS + UI"] --> Main["Main Controller<br/>main.ts"]
    Main --> Audio["Audio Module<br/>WebAudio API"]
    Main --> Math["Math Module<br/>Curl Noise + SDE"]
    Main --> Render["Render Module<br/>Three.js + GLSL"]
    Audio --> CQT["CQT/Wavelet Transform"]
    Math --> Flow["Flow Field Generation"]
    Render --> GPU["GPU Rendering"]
    CQT --> Flow
    Flow --> GPU
    GPU --> Display["Display"]`;
      
      const id = `mermaid-${Date.now()}`;
      mermaidRef.current.className = 'mermaid';
      mermaidRef.current.id = id;
      mermaidRef.current.textContent = diagram;
      
      mermaid.run({
        nodes: [mermaidRef.current],
      }).catch((err) => {
        console.error('Error rendering mermaid diagram:', err);
      });
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <div className="about-page">
      <Navbar />
      <motion.div
        className="about-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.section className="about-section" variants={itemVariants}>
          <h1>What is This?</h1>
          <div className="section-content">
            <p>
              Wavelength Visualizer is an immersive real-time audio visualization application that transforms sound into flowing, organic particle systems. 
              Built with cutting-edge web technologies, it processes audio in real-time using advanced mathematical transformations including Constant-Q Transform (CQT), 
              wavelet analysis, curl noise, and Stochastic Differential Equations (SDE).
            </p>
            <p>
              The application creates a mesmerizing visual representation of audio frequencies, where each sound wave becomes a dynamic, flowing particle system 
              that responds organically to the music's rhythm, tempo, and frequency spectrum.
            </p>
            <p>
              Experience your music in a new dimension where mathematics meets art, and sound becomes visible.
            </p>
          </div>
        </motion.section>

        <motion.section className="about-section" variants={itemVariants}>
          <h2>Who am I?</h2>
          <div className="section-content">
            <p>
              [This section is a placeholder. Please add your personal information, background, and what inspired you to create this project.]
            </p>
            <p>
              Whether you're a developer, artist, musician, or simply someone fascinated by the intersection of technology and creativity, 
              this project represents a passion for exploring the boundaries of what's possible when code becomes art.
            </p>
          </div>
        </motion.section>

        <motion.section className="about-section" variants={itemVariants}>
          <h2>Architecture</h2>
          <div className="section-content">
            <p>
              The application follows a modular architecture with clear separation of concerns, enabling efficient audio processing, 
              mathematical computation, and real-time rendering.
            </p>
            <div className="mermaid-container" ref={mermaidRef}></div>
            <div className="architecture-details">
              <div className="detail-card">
                <h3>Audio Module</h3>
                <p>
                  Handles audio file loading, decoding, and real-time processing using the WebAudio API. 
                  Extracts frequency data and applies CQT transformation for logarithmic frequency bins.
                </p>
              </div>
              <div className="detail-card">
                <h3>Math Module</h3>
                <p>
                  Generates curl noise vector fields for divergence-free flow and applies SDE integration 
                  using the Euler-Maruyama method for organic particle motion.
                </p>
              </div>
              <div className="detail-card">
                <h3>Render Module</h3>
                <p>
                  Manages WebGL rendering using Three.js, particle system management, and custom GLSL shaders 
                  for GPU-accelerated visualization.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section className="about-section" variants={itemVariants}>
          <h2>Terminology & Definitions</h2>
          <div className="section-content">
            <div className="term-grid">
              <div className="term-card">
                <h3>Constant-Q Transform (CQT)</h3>
                <p>
                  A time-frequency representation where the frequency bins are logarithmically spaced, matching human perception of pitch. 
                  The center frequency of bin k is given by: <code>f_k = f_0 × 2^(k/b)</code>
                </p>
              </div>
              <div className="term-card">
                <h3>Wavelet Transform</h3>
                <p>
                  Decomposes a signal into different frequency scales, providing both time and frequency information. 
                  The transform is computed as: <code>W(a,b) = ∫ f(t) × ψ*((t-b)/a) dt</code>
                </p>
              </div>
              <div className="term-card">
                <h3>Curl Noise</h3>
                <p>
                  Generates divergence-free vector fields for smooth, flowing motion. The curl operator creates rotational flow: 
                  <code>curl(F) = ∇ × F</code>, ensuring the flow field has no sources or sinks.
                </p>
              </div>
              <div className="term-card">
                <h3>Stochastic Differential Equations (SDE)</h3>
                <p>
                  Models particle motion with both deterministic drift and random diffusion: 
                  <code>dx = μ(x,t)dt + σ(x,t)dW</code>, where μ is drift, σ is volatility, and dW is Brownian motion.
                </p>
              </div>
              <div className="term-card">
                <h3>Euler-Maruyama Method</h3>
                <p>
                  A numerical method for solving SDEs: <code>X&#123;n+1&#125; = X_n + μ(X_n, t_n)Δt + σ(X_n, t_n)ΔW_n</code>, 
                  where ΔW_n follows a normal distribution.
                </p>
              </div>
              <div className="term-card">
                <h3>GLSL Shaders</h3>
                <p>
                  Graphics Language Shading Language programs that run on the GPU, enabling high-performance rendering 
                  of particle systems with custom visual effects and transformations.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section className="about-section poetic-section" variants={itemVariants}>
          <h2>Art & Technology</h2>
          <div className="section-content">
            <div className="poetic-message">
              <p>
                In the space where mathematics meets melody, where algorithms dance with sound waves, 
                we find something beautiful—a synthesis of precision and poetry.
              </p>
              <p>
                Each frequency becomes a particle, each beat a flow, each moment a transformation. 
                The rigid structure of code gives birth to fluid motion, the deterministic logic 
                creates organic beauty, and the binary world reveals infinite possibility.
              </p>
              <p>
                This is not just visualization—it is a conversation between sound and sight, 
                between the abstract and the tangible, between the artist and the machine.
              </p>
              <p>
                [Feel free to customize this poetic message to reflect your own vision and inspiration.]
              </p>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

