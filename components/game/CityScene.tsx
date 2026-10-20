'use client';
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export default function CityScene({ locations, residents, currentLocationId }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!ref.current || gameRef.current) return;
    const TW = 64, TH = 32;
    const toIso = (x: number, y: number) => ({ sx: (x - y) * (TW / 2), sy: (x + y) * (TH / 2) });

    class MainScene extends Phaser.Scene {
      constructor() { super('Main'); }
      create() {
        const g = this.add.graphics();
        g.lineStyle(1, 0x333355, 0.6);
        for (let x = 0; x < 24; x++) for (let y = 0; y < 24; y++) {
          const { sx, sy } = toIso(x, y);
          g.strokePoints([{ x: sx, y: sy + TH/2 }, { x: sx + TW/2, y: sy }, { x: sx, y: sy - TH/2 }, { x: sx - TW/2, y: sy }, { x: sx, y: sy + TH/2 }]);
        }
        locations.forEach((loc: any) => {
          const { sx, sy } = toIso(loc.coordinates.x, loc.coordinates.y);
          const isCurrent = loc.id === currentLocationId;
          const fill = isCurrent ? 0x7c3aed : 0x3b3b6b;
          const d = this.add.graphics(); d.fillStyle(fill, 0.9);
          d.beginPath(); d.moveTo(sx, sy - TH/2); d.lineTo(sx + TW/2, sy); d.lineTo(sx, sy + TH/2); d.lineTo(sx - TW/2, sy); d.closePath(); d.fillPath();
          this.add.text(sx, sy - 4, loc.name, { fontSize: '11px', color: '#fff' }).setOrigin(0.5);
        });
        const cam = this.cameras.main; cam.setZoom(1.4); cam.centerOn(0, 0);
        let dragging = false, lastX = 0, lastY = 0;
        this.input.on('pointerdown', (p: any) => { dragging = true; lastX = p.x; lastY = p.y; });
        this.input.on('pointerup', () => { dragging = false; });
        this.input.on('pointermove', (p: any) => {
          if (!dragging) return; cam.scrollX -= (p.x - lastX) / cam.zoom; cam.scrollY -= (p.y - lastY) / cam.zoom; lastX = p.x; lastY = p.y;
        });
        this.input.on('wheel', (_p: any, _o: any, _dx: number, dy: number) => { cam.zoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.6, 2.5); });
      }
    }
    gameRef.current = new Phaser.Game({ type: Phaser.AUTO, parent: ref.current, backgroundColor: '#0f0f1a', scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: MainScene });
    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, [locations, residents, currentLocationId]);

  return <div ref={ref} className="w-full h-full" />;
}
