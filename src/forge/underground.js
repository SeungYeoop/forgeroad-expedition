const clamp = value => Math.max(0, Math.min(1, value));

// Use the player's position so weather changes at the entrance, independently of camera lag.
export function undergroundState(scene) {
  const { world, player } = scene;
  if (!world || !player) return { amount: 0, biome: null };
  const chunk = world.chunkOfLocal(player.cx);
  const data = world.loaded.get(chunk)?.data ?? world.gen.get(chunk);
  const ug = data.ug;
  return {
    amount: ug?.biome ? clamp((player.cy - ug.top * 16 + 8) / 80) : 0,
    biome: ug?.biome ?? null,
  };
}

export const CAVE_STYLES = {
  lush: { fog: 0x426e57, glow: 0x9be68b, tint: 0x698579, particles: [0xa6ef9b, 0x65b9a2], rise: true },
  drip: { fog: 0x516779, glow: 0x9dcbdc, tint: 0x858499, particles: [0xc4c4b4, 0x8dadae], drips: true },
  geode: { fog: 0x64517b, glow: 0xd7a3ff, tint: 0x88769e, particles: [0xd6abff, 0xa0cbff], crystal: true },
  deep: { fog: 0x294b58, glow: 0x55dfd1, tint: 0x56717f, particles: [0x60d7cd, 0x80a9bf] },
  mine: { fog: 0x5a4a44, glow: 0xffa860, tint: 0x8a7a78, particles: [0xffb060, 0xc0a080], drips: true },
  magma: { fog: 0x6b3632, glow: 0xff9a49, tint: 0x956c71, particles: [0xffb357, 0xff6237], rise: true },
};
