import referenceMap from './models.json' with { type: 'json' };

export const MODEL_MAP = Object.freeze({ ...referenceMap, guanyu:67, lubu:68, sunce:7, caocao:58, simayi:36 });
export function modelPath(id, evolution = 1) {
  if (!Object.hasOwn(MODEL_MAP, id)) throw new Error(`No 3D model mapping for ${id}`);
  const tier = Math.max(1, Math.min(3, Math.trunc(Number(evolution) || 1)));
  return `models/${String(MODEL_MAP[id]).padStart(2, '0')}-e${tier}.glb`;
}
export function unitPosition(side, slot) {
  if (!['p', 'e'].includes(side) || !Number.isInteger(slot) || slot < 0 || slot > 5) throw new RangeError('Invalid formation slot');
  const row = slot < 3 ? 2.1 : 5.5;
  return { x: (slot % 3 - 1) * 3.25, y: 0, z: side === 'p' ? row : -row };
}
export function clipByName(clips, name) {
  return clips.find(c => c.name === name || c.name.endsWith(`__${name}`));
}
