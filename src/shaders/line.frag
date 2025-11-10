// Fragment shader for line trail rendering
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vThickness;

uniform float time;

void main() {
    // Circular particles with soft edges
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
        discard;
    }
    
    // Soft edges based on thickness
    float edgeSoftness = 0.3 / (1.0 + vThickness * 5.0);
    float alpha = 1.0 - smoothstep(0.5 - edgeSoftness, 0.5, dist);
    alpha *= vAlpha;
    
    // Depth fog (exponential)
    // This would require depth information, simplified here
    float fogFactor = 1.0; // Would be computed from depth
    
    // Final color with alpha
    vec3 finalColor = vColor;
    gl_FragColor = vec4(finalColor, alpha * fogFactor);
}

