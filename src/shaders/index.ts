// Line shaders for trail rendering
export const lineVertexShader = `
// Vertex shader for line trail rendering
attribute vec3 position;
attribute float bandIndex;
attribute float trailIndex;
attribute vec3 color;
attribute float thickness;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform float trailSize;

varying vec3 vColor;
varying float vAlpha;
varying float vThickness;

// HCL to RGB conversion (simplified)
vec3 hclToRgb(float h, float c, float l) {
    float hRad = h * 2.0 * 3.14159;
    float a = c * cos(hRad);
    float b = c * sin(hRad);
    
    vec3 lab = vec3(l * 100.0, a * 100.0, b * 100.0);
    
    float fy = (lab.x + 16.0) / 116.0;
    float fx = lab.y / 500.0 + fy;
    float fz = fy - lab.z / 200.0;
    
    float xr = fx > 0.206897 ? fx * fx * fx : (fx - 16.0/116.0) / 7.787;
    float yr = fy > 0.206897 ? fy * fy * fy : (fy - 16.0/116.0) / 7.787;
    float zr = fz > 0.206897 ? fz * fz * fz : (fz - 16.0/116.0) / 7.787;
    
    vec3 xyz = vec3(xr * 0.95047, yr * 1.0, zr * 1.08883);
    
    vec3 rgb = vec3(
        3.2404542 * xyz.x - 1.5371385 * xyz.y - 0.4985314 * xyz.z,
        -0.9692660 * xyz.x + 1.8760108 * xyz.y + 0.0415560 * xyz.z,
        0.0556434 * xyz.x - 0.2040259 * xyz.y + 1.0572252 * xyz.z
    );
    
    rgb = vec3(
        rgb.x > 0.0031308 ? 1.055 * pow(rgb.x, 1.0/2.4) - 0.055 : 12.92 * rgb.x,
        rgb.y > 0.0031308 ? 1.055 * pow(rgb.y, 1.0/2.4) - 0.055 : 12.92 * rgb.y,
        rgb.z > 0.0031308 ? 1.055 * pow(rgb.z, 1.0/2.4) - 0.055 : 12.92 * rgb.z
    );
    
    return clamp(rgb, 0.0, 1.0);
}

void main() {
    vec3 rgb = hclToRgb(color.x, color.y, color.z);
    vColor = rgb;
    
    float normalizedIndex = trailIndex / trailSize;
    vAlpha = 1.0 - smoothstep(0.7, 1.0, normalizedIndex);
    
    vThickness = thickness;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    float dist = length(mvPosition.xyz);
    gl_PointSize = (thickness * 10.0) / (1.0 + dist * 0.1);
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const lineFragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vThickness;

uniform float time;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
        discard;
    }
    
    float edgeSoftness = 0.3 / (1.0 + vThickness * 5.0);
    float alpha = 1.0 - smoothstep(0.5 - edgeSoftness, 0.5, dist);
    alpha *= vAlpha;
    
    float fogFactor = 1.0;
    
    vec3 finalColor = vColor;
    gl_FragColor = vec4(finalColor, alpha * fogFactor);
}
`;

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
