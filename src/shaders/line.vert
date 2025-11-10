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

// HCL to RGB conversion (simplified, full conversion in fragment shader)
vec3 hclToRgb(float h, float c, float l) {
    float hRad = h * 2.0 * 3.14159;
    float a = c * cos(hRad);
    float b = c * sin(hRad);
    
    // Simplified L*a*b* to RGB (approximation)
    // Full conversion would be more accurate but expensive
    vec3 lab = vec3(l * 100.0, a * 100.0, b * 100.0);
    
    // Approximate conversion
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
    
    // Gamma correction
    rgb = vec3(
        rgb.x > 0.0031308 ? 1.055 * pow(rgb.x, 1.0/2.4) - 0.055 : 12.92 * rgb.x,
        rgb.y > 0.0031308 ? 1.055 * pow(rgb.y, 1.0/2.4) - 0.055 : 12.92 * rgb.y,
        rgb.z > 0.0031308 ? 1.055 * pow(rgb.z, 1.0/2.4) - 0.055 : 12.92 * rgb.z
    );
    
    return clamp(rgb, 0.0, 1.0);
}

void main() {
    // Convert HCL to RGB
    vec3 rgb = hclToRgb(color.x, color.y, color.z);
    vColor = rgb;
    
    // Alpha based on trail position (fade out older points)
    float normalizedIndex = trailIndex / trailSize;
    vAlpha = 1.0 - smoothstep(0.7, 1.0, normalizedIndex);
    
    // Thickness
    vThickness = thickness;
    
    // Transform position
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Point size based on thickness and distance
    float dist = length(mvPosition.xyz);
    gl_PointSize = (thickness * 10.0) / (1.0 + dist * 0.1);
    
    gl_Position = projectionMatrix * mvPosition;
}

