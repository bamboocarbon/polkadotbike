export const LBS_PER_KG = 2.20462;
export const KM_PER_MI = 1.60934;

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}
export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}
export function kmToMi(km: number): number {
  return km / KM_PER_MI;
}
export function miToKm(mi: number): number {
  return mi * KM_PER_MI;
}
