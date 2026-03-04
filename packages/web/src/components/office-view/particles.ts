export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  particles: Particle[] = [];

  emit(p: Particle): void {
    this.particles.push({ ...p });
  }

  tick(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.particles.length = 0;
  }
}
