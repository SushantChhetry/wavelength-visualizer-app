export const vertexShader = `
attribute vec3 position;
attribute vec3 velocity;
attribute float phase;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform float flowIntensity;

varying vec3 vColor;
varying float vAlpha;

vec3 curlNoise(vec3 p, float t) {
    float e = 0.001;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    
    float px = sin((p.x + dx.x) * 2.0 + t * 0.5) * cos((p.y + dx.y) * 2.0);
    float py = sin((p.x + dy.x) * 2.0 + t * 0.5) * cos((p.y + dy.y) * 2.0);
    float pz = sin((p.x + dz.x) * 2.0 + t * 0.5) * cos((p.y + dz.y) * 2.0);
    
    float nx = sin((p.x - dx.x) * 2.0 + t * 0.5) * cos((p.y - dx.y) * 2.0);
    float ny = sin((p.x - dy.x) * 2.0 + t * 0.5) * cos((p.y - dy.y) * 2.0);
    float nz = sin((p.x - dz.x) * 2.0 + t * 0.5) * cos((p.y - dz.y) * 2.0);
    
    return vec3(
        (py - ny) / (2.0 * e),
        (pz - nz) / (2.0 * e),
        (px - nx) / (2.0 * e)
    );
}

void main() {
    vec3 flow = curlNoise(position, time) * flowIntensity;
    vec3 newPosition = position + velocity * 0.01 + flow * 0.05;
    
    vColor = vec3(
        0.5 + 0.5 * sin(phase + time * 0.5),
        0.5 + 0.5 * cos(phase + time * 0.3),
        0.5 + 0.5 * sin(phase + time * 0.7)
    );
    
    float dist = length(newPosition);
    vAlpha = 1.0 - smoothstep(0.0, 5.0, dist);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    gl_PointSize = 3.0 / (1.0 + dist * 0.1);
}
`;

export const fragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;

uniform float audioIntensity;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
        discard;
    }
    
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= vAlpha;
    
    vec3 color = vColor * (0.7 + 0.3 * audioIntensity);
    
    gl_FragColor = vec4(color, alpha);
}
`;
