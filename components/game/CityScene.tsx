'use client';
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export default function CityScene({ onEnterBuilding }: { onEnterBuilding: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!ref.current || gameRef.current) return;

    class MainScene extends Phaser.Scene {
      private hero: Phaser.GameObjects.Image | null = null;
      private target = new Phaser.Math.Vector2(0, 0);
      private TW = 64;
      private TH = 32;

      preload() {
        this.load.image('hero', '/assets/sprites/npc_008.png');
        this.load.image('store', '/assets/sprites/building_010.png');
      }

      create() {
        // 1. Peta Isometrik
        for (let y = 0; y < 15; y++) {
          for (let x = 0; x < 15; x++) {
            const isoX = (x - y) * (this.TW / 2);
            const isoY = (x + y) * (this.TH / 2);
            let g = this.add.graphics();
            g.fillStyle((x+y)%2===0 ? 0x2ecc71 : 0x27ae60, 1);
            g.lineStyle(1, 0x1a5c3a, 0.3);
            g.beginPath();
            g.moveTo(isoX, isoY - this.TH / 2); g.lineTo(isoX + this.TW / 2, isoY);
            g.lineTo(isoX, isoY + this.TH / 2); g.lineTo(isoX - this.TW / 2, isoY);
            g.closePath(); g.fillPath(); g.strokePath();
          }
        }

        // 2. Gedung Toko (Dibesarkan)
        const bx = (5 - 5) * (this.TW / 2);
        const by = (5 + 5) * (this.TH / 2);
        const building = this.add.image(bx, by, 'store');
        building.setOrigin(0.5, 1);
        building.setScale(1.2); // <--- SKALA GEDUNG DIBESARKAN
        building.setDepth(by);
        building.setInteractive({ useHandCursor: true });
        building.on('pointerdown', () => onEnterBuilding());

        // 3. Karakter (Dikecilkan)
        const cx = (8 - 8) * (this.TW / 2);
        const cy = (8 + 8) * (this.TH / 2);
        this.hero = this.add.image(cx, cy, 'hero');
        this.hero.setOrigin(0.5, 1);
        this.hero.setScale(0.12); // <--- SKALA KARAKTER DIKECILKAN
        this.hero.setDepth(cy);
        this.target.set(cx, cy);

        // 4. Kamera
        this.cameras.main.setZoom(1.2);
        this.cameras.main.centerOn(cx, cy);

        // 5. Kontrol Jalan & Geser
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
          if (!this.hero) return;
          const wp = this.cameras.main.getWorldPoint(p.x, p.y);
          this.target.set(wp.x, wp.y);
        });

        let dragging = false, lx = 0, ly = 0;
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { dragging = true; lx = p.x; ly = p.y; });
        this.input.on('pointerup', () => { dragging = false; });
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
          if (!dragging || !p.isDown) return;
          this.cameras.main.scrollX -= (p.x - lx) / this.cameras.main.zoom;
          this.cameras.main.scrollY -= (p.y - ly) / this.cameras.main.zoom;
          lx = p.x; ly = p.y;
        });
      }

      update() {
        if (!this.hero) return;
        const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.target.x, this.target.y);
        if (d > 5) {
          const a = Phaser.Math.Angle.Between(this.hero.x, this.hero.y, this.target.x, this.target.y);
          this.hero.x += Math.cos(a) * 4;
          this.hero.y += Math.sin(a) * 4;
          this.hero.setDepth(this.hero.y);
        }
      }
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO, parent: ref.current, backgroundColor: '#2d2d44',
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: MainScene,
    });
    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, [onEnterBuilding]);

  return <div ref={ref} className="w-full h-full absolute inset-0" />;
}
