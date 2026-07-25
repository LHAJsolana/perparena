export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    this.state = hashSeed(seed);
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  integer(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number) {
    return min + this.next() * (max - min);
  }

  pick<T>(items: readonly T[]) {
    return items[this.integer(0, items.length - 1)];
  }
}

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
