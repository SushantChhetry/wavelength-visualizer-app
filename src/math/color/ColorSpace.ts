/**
 * Color space conversions
 * HCL (Hue, Chroma, Luminance) and L*a*b* for perceptually uniform colors
 */

/**
 * Convert HCL to RGB
 * H: Hue [0, 1]
 * C: Chroma [0, 1]
 * L: Luminance [0, 1]
 */
export function hclToRgb(h: number, c: number, l: number): [number, number, number] {
  // Normalize H to [0, 2π]
  const hRad = h * 2 * Math.PI;
  
  // Convert HCL to L*a*b* first
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  
  // Convert L*a*b* to RGB
  return labToRgb(l * 100, a * 100, b * 100);
}

/**
 * Convert L*a*b* to RGB
 * L: [0, 100]
 * a: [-100, 100]
 * b: [-100, 100]
 */
export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  // Convert L*a*b* to XYZ
  const [x, y, z] = labToXyz(L, a, b);
  
  // Convert XYZ to RGB
  return xyzToRgb(x, y, z);
}

/**
 * Convert L*a*b* to XYZ
 */
function labToXyz(L: number, a: number, b: number): [number, number, number] {
  // D65 white point
  const Xn = 0.95047;
  const Yn = 1.0;
  const Zn = 1.08883;

  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const xr = fx > 0.206897 ? fx * fx * fx : (fx - 16/116) / 7.787;
  const yr = fy > 0.206897 ? fy * fy * fy : (fy - 16/116) / 7.787;
  const zr = fz > 0.206897 ? fz * fz * fz : (fz - 16/116) / 7.787;

  return [
    xr * Xn,
    yr * Yn,
    zr * Zn
  ];
}

/**
 * Convert XYZ to RGB (sRGB)
 */
function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  // sRGB transformation matrix
  const r =  3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const b =  0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  // Apply gamma correction
  const gamma = (c: number) => {
    if (c <= 0.0031308) {
      return 12.92 * c;
    }
    return 1.055 * Math.pow(c, 1/2.4) - 0.055;
  };

  return [
    Math.max(0, Math.min(1, gamma(r))),
    Math.max(0, Math.min(1, gamma(g))),
    Math.max(0, Math.min(1, gamma(b)))
  ];
}

/**
 * Convert RGB to HCL
 */
export function rgbToHcl(r: number, g: number, b: number): [number, number, number] {
  // Convert RGB to L*a*b*
  const [L, a, bLab] = rgbToLab(r, g, b);
  
  // Convert L*a*b* to HCL
  const h = Math.atan2(bLab, a) / (2 * Math.PI);
  const c = Math.sqrt(a * a + bLab * bLab) / 100;
  const l = L / 100;
  
  return [
    h < 0 ? h + 1 : h, // Normalize to [0, 1]
    Math.min(1, c),
    Math.min(1, Math.max(0, l))
  ];
}

/**
 * Convert RGB to L*a*b*
 */
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Convert RGB to XYZ
  const [x, y, z] = rgbToXyz(r, g, b);
  
  // Convert XYZ to L*a*b*
  return xyzToLab(x, y, z);
}

/**
 * Convert RGB to XYZ
 */
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  // Inverse gamma correction
  const invGamma = (c: number) => {
    if (c <= 0.04045) {
      return c / 12.92;
    }
    return Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLin = invGamma(r);
  const gLin = invGamma(g);
  const bLin = invGamma(b);

  // sRGB to XYZ matrix
  const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin;
  const z = 0.0193339 * rLin + 0.1191920 * gLin + 0.9503041 * bLin;

  return [x, y, z];
}

/**
 * Convert XYZ to L*a*b*
 */
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  // D65 white point
  const Xn = 0.95047;
  const Yn = 1.0;
  const Zn = 1.08883;

  const xr = x / Xn;
  const yr = y / Yn;
  const zr = z / Zn;

  const fx = xr > 0.008856 ? Math.pow(xr, 1/3) : (7.787 * xr + 16/116);
  const fy = yr > 0.008856 ? Math.pow(yr, 1/3) : (7.787 * yr + 16/116);
  const fz = zr > 0.008856 ? Math.pow(zr, 1/3) : (7.787 * zr + 16/116);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [L, a, b];
}

