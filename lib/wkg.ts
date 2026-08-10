import wkgData from '@/data/wkg-categories.json';

export type Gender = 'male' | 'female';
export type WeightUnit = 'kg' | 'lbs';

export interface WkgCategory {
  label: string;
  min: number;
  max: number;
  color: string;
  desc: string;
}

export const CATS: Record<Gender, WkgCategory[]> = wkgData.cats as Record<Gender, WkgCategory[]>;
const AGE_FACTORS: Record<Gender, [number, number][]> = wkgData.ageFactors as Record<Gender, [number, number][]>;

export const LBS = 2.20462;

export function toKg(v: number, unit: WeightUnit): number {
  return unit === 'lbs' ? v / LBS : v;
}
export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? kg * LBS : kg;
}
export function fmtWt(kg: number, unit: WeightUnit): string {
  return unit === 'lbs' ? `${(kg * LBS).toFixed(1)} lbs` : `${kg.toFixed(1)} kg`;
}
export function unitLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? 'lbs' : 'kg';
}

// Age grading factors — peak = 1.0 at ~30 (male) / ~28 (female). Based on
// typical FTP decline curves for endurance athletes. Interpolated linearly
// between the anchor points in data/wkg-categories.json.
export function getAgeFactor(age: number, gender: Gender): number {
  const pts = AGE_FACTORS[gender];
  if (age <= pts[0][0]) return pts[0][1];
  if (age >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    if (age <= pts[i][0]) {
      const t = (age - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
      return pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]);
    }
  }
  return 1.0;
}

export function getCat(wkg: number, gender: Gender): { cat: WkgCategory; idx: number } {
  const cats = CATS[gender];
  for (let i = cats.length - 1; i >= 0; i--) {
    if (wkg >= cats[i].min) return { cat: cats[i], idx: i };
  }
  return { cat: cats[0], idx: 0 };
}
