/**
 * Engine Mixer: Combines attractor drift, SDE noise, and flow field contributions
 * Per-band engine parameters with smooth transitions
 */

import type { FlowField } from '../math/flow/FlowField';
import type { LorenzAttractor } from '../math/attractors/LorenzAttractor';
import type { SDEIntegrator } from '../math/mathUtils';
import type { VisualParameters } from '../math/ParameterMapper';

export interface EngineWeights {
  attractor: number; // Weight for Lorenz attractor drift
  flowField: number; // Weight for curl noise flow
  sde: number; // Weight for SDE diffusion
}

export class EngineMixer {
  private defaultWeights: EngineWeights = {
    attractor: 0.4,
    flowField: 0.4,
    sde: 0.2
  };

  /**
   * Mix engines to compute final drift vector
   * @param position - Current position [x, y, z]
   * @param attractor - Lorenz attractor instance
   * @param flowField - Flow field instance
   * @param sdeIntegrator - SDE integrator
   * @param parameters - Visual parameters (includes engine weights via turbulence)
   * @param weights - Optional custom weights
   */
  computeDrift(
    position: [number, number, number],
    attractor: LorenzAttractor,
    flowField: FlowField,
    _sdeIntegrator: SDEIntegrator,
    parameters: VisualParameters,
    weights?: Partial<EngineWeights>
  ): [number, number, number] {
    const w = { ...this.defaultWeights, ...weights };

    // Get attractor drift
    const attractorDrift = attractor.getDrift({
      sigma: parameters.lorenzSigma,
      rho: parameters.lorenzRho,
      beta: parameters.lorenzBeta
    });

    // Get flow field velocity
    const flowVelocity = flowField.evaluate(position[0], position[1], position[2]);

    // Scale by drift speed (band personality)
    const scaledAttractorDrift: [number, number, number] = [
      attractorDrift[0] * parameters.driftSpeed * w.attractor,
      attractorDrift[1] * parameters.driftSpeed * w.attractor,
      attractorDrift[2] * parameters.driftSpeed * w.attractor
    ];

    const scaledFlowVelocity: [number, number, number] = [
      flowVelocity[0] * parameters.flowIntensity * w.flowField,
      flowVelocity[1] * parameters.flowIntensity * w.flowField,
      flowVelocity[2] * parameters.flowIntensity * w.flowField
    ];

    // Combine: drift = attractor + flow
    // SDE noise is applied separately in the integration step
    return [
      scaledAttractorDrift[0] + scaledFlowVelocity[0],
      scaledAttractorDrift[1] + scaledFlowVelocity[1],
      scaledAttractorDrift[2] + scaledFlowVelocity[2]
    ];
  }

  /**
   * Compute weights based on musical features
   * Higher entropy → more SDE, less attractor
   */
  computeWeightsFromFeatures(parameters: VisualParameters): EngineWeights {
    // Turbulence (entropy) affects engine mix
    const turbulence = parameters.turbulence;

    return {
      attractor: 0.5 - turbulence * 0.2, // Less attractor for complex music
      flowField: 0.3 + turbulence * 0.2, // More flow for complex music
      sde: 0.2 + turbulence * 0.1 // More randomness for complex music
    };
  }

  /**
   * Set default weights
   */
  setDefaultWeights(weights: EngineWeights): void {
    this.defaultWeights = { ...weights };
  }
}

