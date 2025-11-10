// Fragment shader for particle system
precision highp float;

varying vec3 vColor;
varying float vAlpha;

uniform float audioIntensity;

void main() {
    // Circular particles
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
        discard;
    }
    
    // Soft edges
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= vAlpha;
    
    // Modulate color with audio intensity
    vec3 color = vColor * (0.7 + 0.3 * audioIntensity);
    
    gl_FragColor = vec4(color, alpha);
}
