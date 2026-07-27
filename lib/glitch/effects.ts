import type { EffectDef } from './types'

/**
 * Every effect is an isolated fragment stage. The renderer wraps `code` with the
 * prelude below plus a main() that mixes the stage against its own input using
 * u_amount, so stages are freely reorderable at runtime.
 */
export const SHADER_PRELUDE = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D u_tex;   // output of the previous stage
uniform sampler2D u_prev;  // final frame of the previous tick (history)
uniform vec2 u_res;
uniform float u_time;
uniform float u_seed;
uniform float u_audio;
uniform float u_amount;
uniform float u_p0;
uniform float u_p1;
uniform float u_p2;
uniform float u_p3;

vec3 src(vec2 uv){ return texture2D(u_tex, clamp(uv, 0.001, 0.999)).rgb; }
vec3 hist(vec2 uv){ return texture2D(u_prev, clamp(uv, 0.001, 0.999)).rgb; }
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21) + u_seed * 0.137);
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float hash1(float x){ return fract(sin(x * 12.9898 + u_seed) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * vnoise(p); p *= 2.02; a *= 0.5; }
  return v;
}
vec2 rot(vec2 p, float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c) * p; }
`

export const EFFECTS: EffectDef[] = [
  /* ---------------------------------------------------------------- temporal */
  {
    id: 'datamosh',
    name: 'Datamosh',
    category: 'temporal',
    blurb: 'Drops keyframes and lets macroblocks smear along fake motion vectors.',
    params: [
      { key: 'corruption', label: 'Corruption', min: 0, max: 1, step: 0.01, default: 0.7 },
      { key: 'block', label: 'Block Size', min: 4, max: 96, step: 1, default: 26 },
      { key: 'persistence', label: 'Persistence', min: 0, max: 0.99, step: 0.01, default: 0.88 },
      { key: 'frequency', label: 'I-Frame Drop', min: 0, max: 1, step: 0.01, default: 0.6 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 blocks = max(u_res / max(u_p1, 2.0), vec2(2.0));
  vec2 cell = floor(uv * blocks);
  float t = floor(u_time * mix(2.0, 24.0, u_p3));
  // fake motion vector per macroblock, re-rolled on every synthetic GOP
  float n = hash(cell + t * 3.77);
  float ang = hash(cell * 1.7 + t) * 6.2831;
  float mag = u_p0 * (0.35 + u_audio * 1.2) * (0.4 + n) / max(blocks.x, 1.0) * 6.0;
  vec2 mv = vec2(cos(ang), sin(ang)) * mag;
  vec3 moshed = hist(uv + mv);
  vec3 fresh = src(uv);
  // blocks whose "residual" survived keep streaming the old frame
  float keep = step(1.0 - u_p3 * 0.95, hash(cell * 0.31 + floor(t * 0.5)));
  float p = u_p2 * mix(0.55, 1.0, keep);
  return mix(fresh, moshed, clamp(p, 0.0, 0.985));
}`,
  },
  {
    id: 'echo',
    name: 'Temporal Echo',
    category: 'temporal',
    blurb: 'Ghost trails of previous frames with directional drift.',
    params: [
      { key: 'decay', label: 'Decay', min: 0, max: 0.99, step: 0.01, default: 0.82 },
      { key: 'driftX', label: 'Drift X', min: -0.05, max: 0.05, step: 0.001, default: 0.004 },
      { key: 'driftY', label: 'Drift Y', min: -0.05, max: 0.05, step: 0.001, default: 0 },
      { key: 'tint', label: 'Ghost Tint', min: 0, max: 1, step: 0.01, default: 0.4 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec3 c = src(uv);
  vec3 g = hist(uv + vec2(u_p1, u_p2));
  g = mix(g, g * vec3(0.55, 0.95, 1.25), u_p3);
  return max(c, g * u_p0);
}`,
  },
  {
    id: 'feedback',
    name: 'Infinite Feedback',
    category: 'temporal',
    blurb: 'Recursive zoom + rotation tunnel fed by its own output.',
    params: [
      { key: 'zoom', label: 'Zoom', min: -0.2, max: 0.2, step: 0.001, default: 0.03 },
      { key: 'rotate', label: 'Rotate', min: -0.5, max: 0.5, step: 0.005, default: 0.05 },
      { key: 'decay', label: 'Decay', min: 0, max: 0.99, step: 0.01, default: 0.9 },
      { key: 'hue', label: 'Hue Drift', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 p = uv - 0.5;
  p = rot(p * (1.0 - u_p0 * (1.0 + u_audio)), u_p1 * (1.0 + u_audio));
  vec3 fb = hist(p + 0.5);
  fb = mix(fb, fb.gbr, u_p3 * 0.5);
  return max(src(uv), fb * u_p2);
}`,
  },
  {
    id: 'holdframe',
    name: 'Frame Freeze',
    category: 'temporal',
    blurb: 'Stutters and holds slices of the signal on a rhythmic grid.',
    params: [
      { key: 'rate', label: 'Rate', min: 0.5, max: 16, step: 0.1, default: 4 },
      { key: 'bands', label: 'Bands', min: 1, max: 24, step: 1, default: 6 },
      { key: 'hold', label: 'Hold', min: 0, max: 1, step: 0.01, default: 0.7 },
      { key: 'slide', label: 'Slide', min: 0, max: 0.3, step: 0.005, default: 0.02 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  float band = floor(uv.y * u_p1);
  float t = floor(u_time * u_p0);
  float frozen = step(1.0 - u_p2, hash(vec2(band, t)));
  vec2 off = vec2((hash(vec2(t, band) * 1.3) - 0.5) * u_p3, 0.0);
  return mix(src(uv), hist(uv + off), frozen);
}`,
  },

  /* ------------------------------------------------------------ compression */
  {
    id: 'blockshift',
    name: 'MPEG Corruption',
    category: 'compression',
    blurb: 'Macroblock displacement and channel desync, like a broken stream.',
    params: [
      { key: 'block', label: 'Block Size', min: 4, max: 128, step: 1, default: 32 },
      { key: 'density', label: 'Density', min: 0, max: 1, step: 0.01, default: 0.3 },
      { key: 'shift', label: 'Shift', min: 0, max: 0.5, step: 0.005, default: 0.09 },
      { key: 'rate', label: 'Rate', min: 0.5, max: 30, step: 0.1, default: 8 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 blocks = max(u_res / max(u_p0, 2.0), vec2(2.0));
  vec2 cell = floor(uv * blocks);
  float t = floor(u_time * u_p3);
  float pick = hash(cell + t * 7.13);
  float on = step(1.0 - u_p1 * (0.5 + u_audio), pick);
  vec2 off = vec2((hash(cell * 2.1 + t) - 0.5) * u_p2, (hash(cell * 3.3 + t) - 0.5) * u_p2 * 0.25) * on;
  vec3 c;
  c.r = src(uv + off * 1.15).r;
  c.g = src(uv + off).g;
  c.b = src(uv + off * 0.8).b;
  return mix(c, c.gbr, on * step(0.75, pick));
}`,
  },
  {
    id: 'jpeg',
    name: 'JPEG Rot',
    category: 'compression',
    blurb: '8x8 quantisation, chroma bleed and blocky banding artifacts.',
    params: [
      { key: 'block', label: 'Block', min: 2, max: 64, step: 1, default: 8 },
      { key: 'quant', label: 'Quantise', min: 1, max: 24, step: 0.5, default: 7 },
      { key: 'bleed', label: 'Chroma Bleed', min: 0, max: 1, step: 0.01, default: 0.6 },
      { key: 'ring', label: 'Ringing', min: 0, max: 1, step: 0.01, default: 0.4 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 bs = max(u_p0, 2.0) / u_res;
  vec2 cell = floor(uv / bs) * bs + bs * 0.5;
  vec3 avg = vec3(0.0);
  for (int i = 0; i < 4; i++){
    float f = float(i);
    avg += src(cell + (vec2(hash(cell + f), hash(cell.yx + f)) - 0.5) * bs);
  }
  avg *= 0.25;
  vec3 c = src(uv);
  vec3 chroma = mix(c, avg, u_p2);
  float l = lum(c);
  float q = max(u_p1, 1.0);
  l = floor(l * q + 0.5) / q;
  vec3 outc = chroma - lum(chroma) + l;
  float edge = abs(lum(src(uv + vec2(bs.x, 0.0))) - lum(src(uv - vec2(bs.x, 0.0))));
  return outc + edge * u_p3 * vec3(0.9, 1.0, 1.15);
}`,
  },
  {
    id: 'pixelsort',
    name: 'Pixel Sort',
    category: 'compression',
    blurb: 'Luminance threshold sorting that drags pixels into long smears.',
    params: [
      { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'length', label: 'Span', min: 0, max: 0.5, step: 0.005, default: 0.12 },
      { key: 'vertical', label: 'Vertical', min: 0, max: 1, step: 1, default: 0 },
      { key: 'invert', label: 'Invert Mask', min: 0, max: 1, step: 1, default: 0 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 dir = u_p2 > 0.5 ? vec2(0.0, 1.0) : vec2(1.0, 0.0);
  float span = u_p1 * (0.5 + u_audio * 0.8);
  vec3 best = src(uv);
  float bl = lum(best);
  float found = 0.0;
  for (int i = 1; i <= 22; i++){
    float f = float(i) / 22.0;
    vec2 s = uv - dir * span * f;
    vec3 c = src(s);
    float l = lum(c);
    float pass = u_p3 > 0.5 ? step(l, u_p0) : step(u_p0, l);
    if (pass > 0.5 && l > bl){ bl = l; best = c; found = 1.0; }
  }
  return mix(src(uv), best, found);
}`,
  },
  {
    id: 'pixelate',
    name: 'Pixel Collapse',
    category: 'compression',
    blurb: 'Resolution decay with optional per-block luminance quantisation.',
    params: [
      { key: 'size', label: 'Cell', min: 1, max: 128, step: 1, default: 12 },
      { key: 'aspect', label: 'Aspect', min: 0.25, max: 4, step: 0.05, default: 1 },
      { key: 'levels', label: 'Levels', min: 2, max: 64, step: 1, default: 64 },
      { key: 'jitter', label: 'Jitter', min: 0, max: 1, step: 0.01, default: 0 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 cs = vec2(max(u_p0, 1.0) * u_p1, max(u_p0, 1.0)) / u_res;
  vec2 cell = floor(uv / cs);
  vec2 j = (vec2(hash(cell), hash(cell.yx)) - 0.5) * u_p3 * cs * 2.0;
  vec3 c = src(cell * cs + cs * 0.5 + j);
  float q = max(u_p2, 2.0);
  return floor(c * q + 0.5) / q;
}`,
  },

  /* ---------------------------------------------------------------- analog */
  {
    id: 'vhs',
    name: 'VHS',
    category: 'analog',
    blurb: 'Head-switching noise, chroma bleed, tracking wobble and dropouts.',
    params: [
      { key: 'wobble', label: 'Wobble', min: 0, max: 1, step: 0.01, default: 0.4 },
      { key: 'bleed', label: 'Chroma Bleed', min: 0, max: 1, step: 0.01, default: 0.6 },
      { key: 'tracking', label: 'Tracking', min: 0, max: 1, step: 0.01, default: 0.35 },
      { key: 'noise', label: 'Tape Noise', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  float line = uv.y * u_res.y;
  float wob = (vnoise(vec2(line * 0.06, u_time * 2.0)) - 0.5) * 0.03 * u_p0;
  wob += sin(uv.y * 90.0 + u_time * 6.0) * 0.0015 * u_p0;
  vec2 p = uv + vec2(wob, 0.0);
  vec3 c;
  float b = 0.006 * u_p1;
  c.r = src(p + vec2(b, 0.0)).r;
  c.g = src(p).g;
  c.b = src(p - vec2(b * 0.6, 0.0)).b;
  // tracking band crawling up the frame
  float bandPos = fract(u_time * 0.12);
  float band = smoothstep(0.06, 0.0, abs(fract(uv.y + bandPos) - 0.5) - 0.44);
  c = mix(c, c * 0.5 + vec3(hash(uv * 400.0 + u_time)) * 0.9, band * u_p2);
  float drop = step(0.995 - u_p3 * 0.02, hash(vec2(floor(line), floor(u_time * 20.0))));
  c = mix(c, vec3(hash(uv * 900.0 + u_time * 3.0)) * 0.85, drop * u_p2);
  c += (hash(uv * 700.0 + u_time * 11.0) - 0.5) * 0.22 * u_p3;
  c *= 1.0 - 0.25 * u_p3 * vnoise(vec2(uv.y * 200.0, u_time * 5.0));
  return c;
}`,
  },
  {
    id: 'tape',
    name: 'Tape Damage',
    category: 'analog',
    blurb: 'Physical tears, creases and burnt emulsion bands.',
    params: [
      { key: 'intensity', label: 'Damage', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'frequency', label: 'Frequency', min: 0, max: 1, step: 0.01, default: 0.4 },
      { key: 'tear', label: 'Tear', min: 0, max: 0.5, step: 0.005, default: 0.15 },
      { key: 'burn', label: 'Burn', min: 0, max: 1, step: 0.01, default: 0.4 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  float t = floor(u_time * mix(1.0, 16.0, u_p1));
  float bandId = floor(uv.y * 40.0);
  float active = step(1.0 - u_p1 * 0.4, hash(vec2(bandId, t)));
  float shift = (hash(vec2(bandId * 1.7, t)) - 0.5) * u_p2 * active;
  vec3 c = src(uv + vec2(shift, 0.0));
  float crease = smoothstep(0.985, 1.0, vnoise(vec2(uv.y * 8.0, u_time * 0.2)) + 0.02);
  c = mix(c, vec3(1.0, 0.94, 0.82), crease * u_p0 * 0.8);
  float burn = fbm(vec2(uv.x * 3.0, uv.y * 3.0 + u_time * 0.05));
  c = mix(c, c * vec3(1.35, 0.72, 0.35) + 0.06, smoothstep(0.62, 0.95, burn) * u_p3);
  c *= 1.0 - active * u_p0 * 0.35;
  return c;
}`,
  },
  {
    id: 'crt',
    name: 'CRT',
    category: 'analog',
    blurb: 'Tube curvature, aperture grille, vignette and phosphor glow.',
    params: [
      { key: 'curve', label: 'Curvature', min: 0, max: 1, step: 0.01, default: 0.3 },
      { key: 'mask', label: 'Grille', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'glow', label: 'Phosphor', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 p = uv * 2.0 - 1.0;
  vec2 off = abs(p.yx) / vec2(6.0, 4.0);
  p += p * off * off * u_p0 * 2.0;
  vec2 cuv = p * 0.5 + 0.5;
  if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) return vec3(0.0);
  vec3 c = src(cuv);
  vec3 g = (src(cuv + vec2(0.003, 0.0)) + src(cuv - vec2(0.003, 0.0)) + src(cuv + vec2(0.0, 0.004))) / 3.0;
  c += g * u_p3 * 0.6;
  float mx = fract(cuv.x * u_res.x / 3.0);
  vec3 grille = vec3(smoothstep(0.5, 0.0, abs(mx - 0.16)), smoothstep(0.5, 0.0, abs(mx - 0.5)), smoothstep(0.5, 0.0, abs(mx - 0.83)));
  c *= mix(vec3(1.0), 0.4 + grille * 1.35, u_p1);
  float vig = 1.0 - u_p2 * dot(p * 0.55, p * 0.55);
  return c * clamp(vig, 0.0, 1.5);
}`,
  },
  {
    id: 'scanlines',
    name: 'Scanlines',
    category: 'analog',
    blurb: 'Interlace lines with a rolling sync bar.',
    params: [
      { key: 'density', label: 'Density', min: 50, max: 1200, step: 1, default: 400 },
      { key: 'strength', label: 'Strength', min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: 'roll', label: 'Roll', min: 0, max: 2, step: 0.01, default: 0.3 },
      { key: 'interlace', label: 'Interlace', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec3 c = src(uv);
  float s = sin((uv.y + u_time * u_p2 * 0.1) * u_p0 * 3.14159);
  c *= 1.0 - u_p1 * 0.5 * (0.5 + 0.5 * s);
  float field = step(0.5, fract(uv.y * u_res.y * 0.5 + u_time * 30.0));
  c *= mix(1.0, field * 0.6 + 0.7, u_p3);
  float sync = smoothstep(0.02, 0.0, abs(fract(uv.y - u_time * 0.07) - 0.5) - 0.48);
  return c + sync * u_p2 * 0.25;
}`,
  },
  {
    id: 'noise',
    name: 'Digital Noise',
    category: 'analog',
    blurb: 'Grain, chroma sparkle and dead-pixel snow.',
    params: [
      { key: 'amount', label: 'Grain', min: 0, max: 1, step: 0.01, default: 0.3 },
      { key: 'color', label: 'Chroma', min: 0, max: 1, step: 0.01, default: 0.4 },
      { key: 'snow', label: 'Snow', min: 0, max: 1, step: 0.01, default: 0.1 },
      { key: 'scale', label: 'Scale', min: 0.5, max: 8, step: 0.1, default: 1 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec3 c = src(uv);
  vec2 np = uv * u_res / max(u_p3, 0.5);
  float n = hash(np + u_time * 60.0) - 0.5;
  vec3 cn = vec3(hash(np + u_time * 61.0), hash(np + u_time * 62.0), hash(np + u_time * 63.0)) - 0.5;
  c += mix(vec3(n), cn, u_p1) * u_p0 * 0.6;
  float snow = step(1.0 - u_p2 * 0.08, hash(np * 1.7 + u_time * 90.0));
  return mix(c, vec3(1.0), snow);
}`,
  },

  /* --------------------------------------------------------------- optical */
  {
    id: 'rgbsplit',
    name: 'RGB Split',
    category: 'optical',
    blurb: 'Directional channel separation with jitter.',
    params: [
      { key: 'offset', label: 'Offset', min: 0, max: 0.2, step: 0.001, default: 0.012 },
      { key: 'angle', label: 'Angle', min: 0, max: 6.283, step: 0.01, default: 0 },
      { key: 'jitter', label: 'Jitter', min: 0, max: 1, step: 0.01, default: 0.2 },
      { key: 'radial', label: 'Radial', min: 0, max: 1, step: 0.01, default: 0 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  float amt = u_p0 * (1.0 + u_audio * 1.5);
  amt *= 1.0 + (hash1(floor(u_time * 20.0)) - 0.5) * u_p2 * 2.0;
  vec2 dir = vec2(cos(u_p1), sin(u_p1));
  vec2 rad = normalize(uv - 0.5 + 1e-5) * length(uv - 0.5) * 2.0;
  vec2 d = mix(dir, rad, u_p3) * amt;
  return vec3(src(uv + d).r, src(uv).g, src(uv - d).b);
}`,
  },
  {
    id: 'lens',
    name: 'Lens & Aberration',
    category: 'optical',
    blurb: 'Barrel distortion with wavelength-dependent scaling.',
    params: [
      { key: 'distort', label: 'Distortion', min: -0.6, max: 0.6, step: 0.005, default: 0.15 },
      { key: 'aberration', label: 'Aberration', min: 0, max: 0.1, step: 0.001, default: 0.012 },
      { key: 'zoom', label: 'Zoom', min: 0.5, max: 1.5, step: 0.005, default: 1 },
      { key: 'edge', label: 'Edge Falloff', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    code: /* glsl */ `
vec2 warp(vec2 uv, float k, float scale){
  vec2 p = (uv - 0.5) * scale;
  float r2 = dot(p, p);
  return p * (1.0 + k * r2) + 0.5;
}
vec3 effect(vec2 uv){
  float k = u_p0;
  float a = u_p1;
  vec3 c;
  c.r = src(warp(uv, k * (1.0 + a * 4.0), u_p2)).r;
  c.g = src(warp(uv, k, u_p2)).g;
  c.b = src(warp(uv, k * (1.0 - a * 4.0), u_p2)).b;
  float r = length(uv - 0.5) * 1.41;
  return c * (1.0 - u_p3 * r * r);
}`,
  },
  {
    id: 'bloom',
    name: 'Bloom',
    category: 'optical',
    blurb: 'Highlight bleed for over-driven, luminous glitches.',
    params: [
      { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.6 },
      { key: 'intensity', label: 'Intensity', min: 0, max: 3, step: 0.01, default: 1 },
      { key: 'radius', label: 'Radius', min: 0.5, max: 12, step: 0.1, default: 4 },
      { key: 'tint', label: 'Tint', min: 0, max: 1, step: 0.01, default: 0.2 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec3 base = src(uv);
  vec2 px = u_p2 / u_res;
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 16; i++){
    float f = float(i);
    float ang = f * 2.39996;
    float rad = sqrt(f / 16.0);
    vec2 o = vec2(cos(ang), sin(ang)) * rad * px * 4.0;
    vec3 s = src(uv + o);
    float b = max(lum(s) - u_p0, 0.0);
    float w = 1.0 - rad * 0.6;
    sum += s * b * w;
    wsum += w;
  }
  vec3 glow = sum / max(wsum, 0.001) * u_p1 * (1.0 + u_audio);
  glow = mix(glow, glow * vec3(0.7, 1.05, 1.4), u_p3);
  return base + glow;
}`,
  },

  /* ------------------------------------------------------------ distortion */
  {
    id: 'wavewarp',
    name: 'Wave Warp',
    category: 'distortion',
    blurb: 'Sine displacement in both axes, like heat or bad sync.',
    params: [
      { key: 'amp', label: 'Amplitude', min: 0, max: 0.2, step: 0.001, default: 0.02 },
      { key: 'freq', label: 'Frequency', min: 1, max: 120, step: 0.5, default: 18 },
      { key: 'speed', label: 'Speed', min: 0, max: 8, step: 0.05, default: 1.5 },
      { key: 'axis', label: 'Axis Blend', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  float a = u_p0 * (1.0 + u_audio);
  float x = sin(uv.y * u_p1 + u_time * u_p2) * a;
  float y = cos(uv.x * u_p1 * 0.7 - u_time * u_p2 * 0.8) * a * u_p3;
  return src(uv + vec2(x, y));
}`,
  },
  {
    id: 'displace',
    name: 'Noise Displace',
    category: 'distortion',
    blurb: 'FBM-driven displacement field, from shimmer to full dissolve.',
    params: [
      { key: 'scale', label: 'Scale', min: 0.5, max: 20, step: 0.1, default: 4 },
      { key: 'strength', label: 'Strength', min: 0, max: 0.3, step: 0.002, default: 0.04 },
      { key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.02, default: 0.4 },
      { key: 'chroma', label: 'Chroma Sep', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 q = uv * u_p0 + u_time * u_p2;
  vec2 d = vec2(fbm(q), fbm(q + 17.3)) - 0.5;
  d *= u_p1 * 2.0 * (1.0 + u_audio);
  vec3 c;
  c.r = src(uv + d * (1.0 + u_p3 * 0.5)).r;
  c.g = src(uv + d).g;
  c.b = src(uv + d * (1.0 - u_p3 * 0.5)).b;
  return c;
}`,
  },
  {
    id: 'liquid',
    name: 'Liquid Flow',
    category: 'distortion',
    blurb: 'Domain-warped advection that melts the frame.',
    params: [
      { key: 'scale', label: 'Scale', min: 0.5, max: 12, step: 0.1, default: 3 },
      { key: 'strength', label: 'Strength', min: 0, max: 0.4, step: 0.002, default: 0.08 },
      { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01, default: 0.25 },
      { key: 'swirl', label: 'Swirl', min: 0, max: 4, step: 0.02, default: 1.2 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 p = uv * u_p0;
  float t = u_time * u_p2;
  vec2 w1 = vec2(fbm(p + t), fbm(p + 5.2 - t));
  vec2 w2 = vec2(fbm(p + 4.0 * w1 + 1.7), fbm(p + 4.0 * w1 + 9.2));
  vec2 d = (w2 - 0.5) * u_p1 * 2.0;
  d = rot(d, (w1.x - 0.5) * u_p3 * 3.14159);
  return src(uv + d * (1.0 + u_audio));
}`,
  },
  {
    id: 'slice',
    name: 'Slice Shift',
    category: 'distortion',
    blurb: 'Hard horizontal slice offsets, the classic screen tear.',
    params: [
      { key: 'slices', label: 'Slices', min: 2, max: 200, step: 1, default: 32 },
      { key: 'shift', label: 'Shift', min: 0, max: 0.5, step: 0.005, default: 0.08 },
      { key: 'rate', label: 'Rate', min: 0.2, max: 30, step: 0.1, default: 6 },
      { key: 'density', label: 'Density', min: 0, max: 1, step: 0.01, default: 0.4 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  float s = floor(uv.y * u_p0);
  float t = floor(u_time * u_p2);
  float r = hash(vec2(s, t));
  float on = step(1.0 - u_p3 * (0.6 + u_audio * 0.8), r);
  float off = (hash(vec2(s * 3.1, t)) - 0.5) * u_p1 * 2.0 * on;
  return src(vec2(fract(uv.x + off), uv.y));
}`,
  },

  /* ---------------------------------------------------------------- dither */
  {
    id: 'ascii',
    name: 'ASCII',
    category: 'dither',
    blurb: 'Terminal glyph rendering driven by cell luminance.',
    params: [
      { key: 'cell', label: 'Cell', min: 4, max: 40, step: 1, default: 10 },
      { key: 'contrast', label: 'Contrast', min: 0.2, max: 3, step: 0.05, default: 1.2 },
      { key: 'colored', label: 'Keep Color', min: 0, max: 1, step: 0.01, default: 0.2 },
      { key: 'bg', label: 'Background', min: 0, max: 1, step: 0.01, default: 0 },
    ],
    code: /* glsl */ `
float glyph(float l, vec2 f){
  // procedural glyph ramp: void, dot, dash, cross, hash, block
  float g = 0.0;
  vec2 c = abs(f - 0.5);
  if (l > 0.92) g = 1.0;
  else if (l > 0.75) g = step(c.x, 0.42) * step(c.y, 0.42);
  else if (l > 0.58) g = max(step(c.x, 0.12), step(c.y, 0.12));
  else if (l > 0.42) g = max(step(abs(f.x - f.y), 0.11), step(abs(f.x + f.y - 1.0), 0.11));
  else if (l > 0.26) g = step(c.y, 0.09);
  else if (l > 0.12) g = step(length(c), 0.12);
  return g;
}
vec3 effect(vec2 uv){
  vec2 cs = vec2(max(u_p0, 3.0)) / u_res;
  vec2 cell = floor(uv / cs);
  vec2 f = fract(uv / cs);
  vec3 c = src(cell * cs + cs * 0.5);
  float l = clamp(pow(lum(c), 1.0 / u_p1), 0.0, 1.0);
  float g = glyph(l, f);
  vec3 ink = mix(vec3(0.62, 1.0, 0.86) * (0.5 + l), c * 1.4, u_p2);
  return mix(vec3(u_p3 * 0.08), ink, g);
}`,
  },
  {
    id: 'halftone',
    name: 'Halftone',
    category: 'dither',
    blurb: 'Rotated print dots per channel.',
    params: [
      { key: 'scale', label: 'Scale', min: 20, max: 400, step: 1, default: 120 },
      { key: 'angle', label: 'Angle', min: 0, max: 1.57, step: 0.01, default: 0.4 },
      { key: 'sharp', label: 'Sharpness', min: 0.01, max: 1, step: 0.01, default: 0.4 },
      { key: 'mono', label: 'Mono', min: 0, max: 1, step: 0.01, default: 0 },
    ],
    code: /* glsl */ `
float dots(vec2 uv, float a, float v, float s){
  vec2 p = rot(uv * u_res / u_res.y, a) * s;
  vec2 g = fract(p) - 0.5;
  return smoothstep(0.5, 0.5 - u_p2, length(g) * 2.0 / max(sqrt(v), 0.001));
}
vec3 effect(vec2 uv){
  vec3 c = src(uv);
  float s = u_p0;
  vec3 d = vec3(dots(uv, u_p1, c.r, s), dots(uv, u_p1 + 1.05, c.g, s), dots(uv, u_p1 + 2.1, c.b, s));
  float m = dots(uv, u_p1, lum(c), s);
  return mix(d, vec3(m), u_p3);
}`,
  },
  {
    id: 'dither',
    name: 'Ordered Dither',
    category: 'dither',
    blurb: '4x4 Bayer dithering down to a tight palette.',
    params: [
      { key: 'levels', label: 'Levels', min: 2, max: 16, step: 1, default: 3 },
      { key: 'strength', label: 'Strength', min: 0, max: 1, step: 0.01, default: 1 },
      { key: 'scale', label: 'Pixel Scale', min: 1, max: 8, step: 1, default: 2 },
      { key: 'mono', label: 'Mono', min: 0, max: 1, step: 0.01, default: 0.4 },
    ],
    code: /* glsl */ `
float bayer(vec2 p){
  vec2 i = mod(floor(p), 4.0);
  float x = i.x, y = i.y;
  float v = 0.0;
  v += step(0.5, mod(x, 2.0)) * 8.0;
  v += step(0.5, mod(y, 2.0)) * 4.0;
  v += step(1.5, x) * 2.0;
  v += step(1.5, y) * 1.0;
  return v / 16.0;
}
vec3 effect(vec2 uv){
  vec3 c = src(uv);
  c = mix(c, vec3(lum(c)), u_p3);
  float b = (bayer(uv * u_res / max(u_p2, 1.0)) - 0.5) * u_p1;
  float q = max(u_p0 - 1.0, 1.0);
  return floor(c * q + b + 0.5) / q;
}`,
  },
  {
    id: 'edge',
    name: 'Edge Detect',
    category: 'dither',
    blurb: 'Sobel outlines over a crushed base.',
    params: [
      { key: 'strength', label: 'Strength', min: 0, max: 8, step: 0.05, default: 2 },
      { key: 'width', label: 'Width', min: 0.5, max: 6, step: 0.1, default: 1 },
      { key: 'base', label: 'Keep Base', min: 0, max: 1, step: 0.01, default: 0.15 },
      { key: 'tint', label: 'Tint', min: 0, max: 1, step: 0.01, default: 0.5 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec2 px = u_p1 / u_res;
  float tl = lum(src(uv + px * vec2(-1.0, -1.0)));
  float t = lum(src(uv + px * vec2(0.0, -1.0)));
  float tr = lum(src(uv + px * vec2(1.0, -1.0)));
  float l = lum(src(uv + px * vec2(-1.0, 0.0)));
  float r = lum(src(uv + px * vec2(1.0, 0.0)));
  float bl = lum(src(uv + px * vec2(-1.0, 1.0)));
  float b = lum(src(uv + px * vec2(0.0, 1.0)));
  float br = lum(src(uv + px * vec2(1.0, 1.0)));
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  float e = clamp(length(vec2(gx, gy)) * u_p0, 0.0, 1.0);
  vec3 col = mix(vec3(e), vec3(e) * vec3(0.55, 1.0, 0.95), u_p3);
  return col + src(uv) * u_p2;
}`,
  },

  /* ----------------------------------------------------------------- color */
  {
    id: 'grade',
    name: 'Color Grade',
    category: 'color',
    blurb: 'Hue rotation, saturation, contrast and lift for the final look.',
    params: [
      { key: 'hue', label: 'Hue', min: -3.14, max: 3.14, step: 0.01, default: 0 },
      { key: 'sat', label: 'Saturation', min: 0, max: 2.5, step: 0.01, default: 1.1 },
      { key: 'contrast', label: 'Contrast', min: 0, max: 2.5, step: 0.01, default: 1.1 },
      { key: 'lift', label: 'Lift', min: -0.3, max: 0.3, step: 0.005, default: 0 },
    ],
    code: /* glsl */ `
vec3 hueRot(vec3 c, float a){
  float s = sin(a), co = cos(a);
  mat3 m = mat3(
    0.299 + 0.701 * co + 0.168 * s, 0.587 - 0.587 * co + 0.330 * s, 0.114 - 0.114 * co - 0.497 * s,
    0.299 - 0.299 * co - 0.328 * s, 0.587 + 0.413 * co + 0.035 * s, 0.114 - 0.114 * co + 0.292 * s,
    0.299 - 0.300 * co + 1.250 * s, 0.587 - 0.588 * co - 1.050 * s, 0.114 + 0.886 * co - 0.203 * s
  );
  return clamp(m * c, 0.0, 4.0);
}
vec3 effect(vec2 uv){
  vec3 c = src(uv);
  c = hueRot(c, u_p0 + u_audio * 0.4);
  c = mix(vec3(lum(c)), c, u_p1);
  c = (c - 0.5) * u_p2 + 0.5 + u_p3;
  return c;
}`,
  },
  {
    id: 'posterize',
    name: 'Posterize / Threshold',
    category: 'color',
    blurb: 'Hard level reduction with an optional luminance cut.',
    params: [
      { key: 'levels', label: 'Levels', min: 2, max: 24, step: 1, default: 5 },
      { key: 'cut', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0 },
      { key: 'soft', label: 'Softness', min: 0.001, max: 0.4, step: 0.001, default: 0.05 },
      { key: 'duotone', label: 'Duotone', min: 0, max: 1, step: 0.01, default: 0 },
    ],
    code: /* glsl */ `
vec3 effect(vec2 uv){
  vec3 c = src(uv);
  float q = max(u_p0 - 1.0, 1.0);
  c = floor(c * q + 0.5) / q;
  if (u_p1 > 0.001){
    float m = smoothstep(u_p1 - u_p2, u_p1 + u_p2, lum(c));
    c = mix(c, vec3(m), 0.9);
  }
  vec3 duo = mix(vec3(0.04, 0.07, 0.12), vec3(0.35, 1.0, 0.92), lum(c));
  return mix(c, duo, u_p3);
}`,
  },
]

export const EFFECT_MAP: Record<string, EffectDef> = Object.fromEntries(EFFECTS.map((e) => [e.id, e]))

export const EFFECT_IDS = EFFECTS.map((e) => e.id)

export const CATEGORY_LABELS: Record<string, string> = {
  temporal: 'Temporal',
  compression: 'Compression',
  analog: 'Analog',
  optical: 'Optical',
  distortion: 'Distortion',
  dither: 'Dither / Glyph',
  color: 'Color',
}

export function defaultParams(effectId: string): Record<string, number> {
  const def = EFFECT_MAP[effectId]
  if (!def) return {}
  return Object.fromEntries(def.params.map((p) => [p.key, p.default]))
}
