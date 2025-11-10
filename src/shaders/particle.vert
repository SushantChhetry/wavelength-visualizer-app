// Vertex shader for particle system
attribute vec3 position;
attribute vec3 velocity;
attribute float phase;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform float flowIntensity;

varying vec3 vColor;
varying float vAlpha;

// Curl noise function (simplified for GLSL)
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
    // Apply curl noise flow
    vec3 flow = curlNoise(position, time) * flowIntensity;
    vec3 newPosition = position + velocity * 0.01 + flow * 0.05;
    
    // Color based on velocity and position
    vColor = vec3(
        0.5 + 0.5 * sin(phase + time * 0.5),
        0.5 + 0.5 * cos(phase + time * 0.3),
        0.5 + 0.5 * sin(phase + time * 0.7)
    );
    
    // Alpha based on distance from center
    float dist = length(newPosition);
    vAlpha = 1.0 - smoothstep(0.0, 5.0, dist);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    gl_PointSize = 3.0 / (1.0 + dist * 0.1);
}
