/**
 * Line System: Manages instanced line segments with trail buffers
 * Replaces particle system with line-based rendering
 */

import * as THREE from 'three';
import { TrailBuffer } from './TrailBuffer';
import { BandManager } from './BandManager';
import { EngineMixer } from './EngineMixer';
import { FlowField } from '../math/flow/FlowField';
import { SDEIntegrator } from '../math/mathUtils';
import { HashSeededRNG } from '../math/HashSeededRNG';
import { CollisionAvoidance } from '../math/CollisionAvoidance';

export class LineSystem {
  private bandManager: BandManager;
  private trailBuffer: TrailBuffer;
  private engineMixer: EngineMixer;
  private flowFields: FlowField[];
  private sdeIntegrators: SDEIntegrator[];
  private collisionAvoidance: CollisionAvoidance;
  private time: number = 0;
  private dt: number = 0.016; // ~60fps

  // Three.js geometry and material
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private instancedMesh: THREE.Points | null = null;

  constructor(bandManager: BandManager) {
    this.bandManager = bandManager;
    const totalInstances = bandManager.getTotalInstances();
    this.trailBuffer = new TrailBuffer(totalInstances, 64);
    this.engineMixer = new EngineMixer();
    this.collisionAvoidance = new CollisionAvoidance();

    // Create flow field and SDE integrator per band
    const numBands = bandManager.getNumBands();
    this.flowFields = [];
    this.sdeIntegrators = [];

    for (let b = 0; b < numBands; b++) {
      this.flowFields.push(new FlowField());
      this.sdeIntegrators.push(new SDEIntegrator(b));
    }
  }

  /**
   * Initialize Three.js geometry and material
   */
  initializeGeometry(vertexShader: string, fragmentShader: string): void {
    const totalInstances = this.bandManager.getTotalInstances();
    const trailSize = this.trailBuffer.getBufferSize();

    // Create geometry for line segments
    // Each instance has trailSize points
    const geometry = new THREE.BufferGeometry();
    
    // Positions will be updated each frame (one per trail point)
    const numVertices = totalInstances * trailSize;
    const positions = new Float32Array(numVertices * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Per-vertex attributes: band index, trail index, color, thickness
    const bandIndices = new Float32Array(numVertices);
    const trailIndices = new Float32Array(numVertices);
    const colors = new Float32Array(numVertices * 3);
    const thicknesses = new Float32Array(numVertices);

    let vertexIdx = 0;
    for (const band of this.bandManager.getBands()) {
      for (let i = 0; i < band.instancesPerBand; i++) {
        // For each trail point
        for (let t = 0; t < trailSize; t++) {
          bandIndices[vertexIdx] = band.bandIndex;
          trailIndices[vertexIdx] = t;
          colors[vertexIdx * 3] = 0.5; // H
          colors[vertexIdx * 3 + 1] = 0.5; // C
          colors[vertexIdx * 3 + 2] = 0.7; // L
          thicknesses[vertexIdx] = 0.1;
          vertexIdx++;
        }
      }
    }

    geometry.setAttribute('bandIndex', new THREE.BufferAttribute(bandIndices, 1));
    geometry.setAttribute('trailIndex', new THREE.BufferAttribute(trailIndices, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('thickness', new THREE.BufferAttribute(thicknesses, 1));

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        trailSize: { value: trailSize }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Create points mesh for trail rendering
    const pointsMesh = new THREE.Points(geometry, material);

    this.geometry = geometry;
    this.material = material;
    this.instancedMesh = pointsMesh;
  }

  /**
   * Update line system: integrate positions, update trails
   */
  update(
    time: number,
    cqtData: Float32Array,
    tempo: number,
    beatStrength: number
  ): void {
    this.time = time;
    const dt = this.dt;

    // Update flow fields
    const bands = this.bandManager.getBands();
    for (let b = 0; b < bands.length; b++) {
      const band = bands[b];
      const params = band.parameters;

      this.flowFields[b].update(
        time,
        params.flowFrequency,
        beatStrength,
        params.flowIntensity
      );
    }

    // Collect all positions for collision avoidance
    const allPositions: [number, number, number][] = [];
    let instanceIdx = 0;

    // Update each band's instances
    for (const band of bands) {
      const attractor = band.attractor;
      const flowField = this.flowFields[band.bandIndex];
      const sdeIntegrator = this.sdeIntegrators[band.bandIndex];
      const params = band.parameters;

      // Compute seed for this frame/band
      const seed = HashSeededRNG.generateSeed(
        cqtData,
        band.bandIndex,
        tempo,
        Math.floor(time * 60) // Global seed changes every second
      );

      for (let i = 0; i < band.instancesPerBand; i++) {
        // Get current position (from attractor state for first instance, or trail for others)
        let position: [number, number, number];
        if (i === 0) {
          // First instance follows attractor
          const state = attractor.getState();
          position = [state.x, state.y, state.z];
        } else {
          // Other instances offset from first
          const firstState = attractor.getState();
          const offset = (i - 1) * 0.1;
          position = [
            firstState.x + offset,
            firstState.y + offset,
            firstState.z + offset
          ];
        }

        // Compute drift from mixed engines
        const weights = this.engineMixer.computeWeightsFromFeatures(params);
        const drift = this.engineMixer.computeDrift(
          position,
          attractor,
          flowField,
          sdeIntegrator,
          params,
          weights
        );

        // Apply collision avoidance
        const avoidanceForce = this.collisionAvoidance.computeForce(
          position,
          allPositions
        );
        drift[0] += avoidanceForce[0];
        drift[1] += avoidanceForce[1];
        drift[2] += avoidanceForce[2];

        // Integrate with SDE
        const newPosition = sdeIntegrator.step(
          position,
          drift,
          params.diffusion,
          dt * params.driftSpeed,
          seed + i // Unique seed per instance
        );

        // Update attractor (for first instance)
        if (i === 0) {
          attractor.step({
            sigma: params.lorenzSigma,
            rho: params.lorenzRho,
            beta: params.lorenzBeta
          });
        }

        // Add to trail buffer
        this.trailBuffer.addPoint(instanceIdx, newPosition);
        allPositions.push(newPosition);

        instanceIdx++;
      }
    }

    // Update geometry
    this.updateGeometry();
  }

  /**
   * Update Three.js geometry from trail buffer
   */
  private updateGeometry(): void {
    if (!this.geometry) return;

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const totalInstances = this.bandManager.getTotalInstances();
    const trailSize = this.trailBuffer.getBufferSize();

    let vertexIdx = 0;
    for (let instanceIdx = 0; instanceIdx < totalInstances; instanceIdx++) {
      const trail = this.trailBuffer.getTrail(instanceIdx);

      // Copy trail positions to geometry
      for (let t = 0; t < trailSize; t++) {
        const trailIdx = t * 3;
        if (trailIdx < trail.length) {
          positionAttr.array[vertexIdx * 3] = trail[trailIdx];
          positionAttr.array[vertexIdx * 3 + 1] = trail[trailIdx + 1];
          positionAttr.array[vertexIdx * 3 + 2] = trail[trailIdx + 2];
        } else {
          // Fill with zeros if trail is incomplete
          positionAttr.array[vertexIdx * 3] = 0;
          positionAttr.array[vertexIdx * 3 + 1] = 0;
          positionAttr.array[vertexIdx * 3 + 2] = 0;
        }
        vertexIdx++;
      }
    }

    positionAttr.needsUpdate = true;
  }

  /**
   * Update colors and thicknesses from band parameters
   */
  updateStyling(): void {
    if (!this.geometry) return;

    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const thicknessAttr = this.geometry.getAttribute('thickness') as THREE.BufferAttribute;
    const trailSize = this.trailBuffer.getBufferSize();

    let vertexIdx = 0;
    for (const band of this.bandManager.getBands()) {
      const params = band.parameters;
      // HCL values (will be converted to RGB in shader)
      const h = params.colorHue;
      const c = params.colorChroma;
      const l = params.colorLuminance;

      for (let i = 0; i < band.instancesPerBand; i++) {
        // Update all trail points for this instance
        for (let t = 0; t < trailSize; t++) {
          colorAttr.array[vertexIdx * 3] = h;
          colorAttr.array[vertexIdx * 3 + 1] = c;
          colorAttr.array[vertexIdx * 3 + 2] = l;
          thicknessAttr.array[vertexIdx] = params.thickness;
          vertexIdx++;
        }
      }
    }

    colorAttr.needsUpdate = true;
    thicknessAttr.needsUpdate = true;
  }

  /**
   * Get Three.js mesh for rendering
   */
  getMesh(): THREE.Points | null {
    return this.instancedMesh;
  }

  /**
   * Update shader uniforms
   */
  updateUniforms(): void {
    if (this.material) {
      this.material.uniforms.time.value = this.time;
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}

