'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

type Citizen = {
  name: string;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  home: Phaser.Math.Vector2;
  work: Phaser.Math.Vector2;
  money: number;
  wage: number;
  employed: boolean;
  destination: Phaser.Math.Vector2;
  nextDecision: number;
};

export default function CityScene({ onEnterBuilding }: { onEnterBuilding: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!ref.current || gameRef.current) return;

    class MainScene extends Phaser.Scene {
      private hero: Phaser.GameObjects.Image | null = null;
      private target = new Phaser.Math.Vector2(0, 0);
      private readonly TW = 64;
      private readonly TH = 32;
      private citizens: Citizen[] = [];
      private hud: Phaser.GameObjects.Text | null = null;
      private simMinutes = 8 * 60;
      private lastPaidHour = -1;
      private lastSimHour = -1;
      private clickedBuilding = false;
      private dragging = false;
      private pointerStart = new Phaser.Math.Vector2();
      private movedPointer = false;

      private iso(x: number, y: number) {
        return new Phaser.Math.Vector2((x - y) * (this.TW / 2), (x + y) * (this.TH / 2));
      }

      private moveCitizen(citizen: Citizen, destination: Phaser.Math.Vector2) {
        citizen.destination.copy(destination);
        citizen.nextDecision = this.time.now + Phaser.Math.Between(4500, 9000);
      }

      preload() {
        this.load.image('hero', '/assets/sprites/npc_008.png');
        this.load.image('store', '/assets/sprites/building_010.png');
      }

      create() {
        // Isometric green city map.
        for (let y = 0; y < 15; y++) {
          for (let x = 0; x < 15; x++) {
            const p = this.iso(x, y);
            const tile = this.add.graphics();
            tile.fillStyle((x + y) % 2 === 0 ? 0x2ecc71 : 0x27ae60, 1);
            tile.lineStyle(1, 0x1a5c3a, 0.3);
            tile.beginPath();
            tile.moveTo(p.x, p.y - this.TH / 2);
            tile.lineTo(p.x + this.TW / 2, p.y);
            tile.lineTo(p.x, p.y + this.TH / 2);
            tile.lineTo(p.x - this.TW / 2, p.y);
            tile.closePath();
            tile.fillPath();
            tile.strokePath();
            tile.setDepth(p.y - 1);
          }
        }

        // Store acts as the first workplace and shopping destination.
        const storePos = this.iso(5, 5);
        const building = this.add.image(storePos.x, storePos.y, 'store');
        building.setOrigin(0.5, 1).setScale(1.2).setDepth(storePos.y + 5);
        building.setInteractive({ useHandCursor: true });
        building.on('pointerdown', () => {
          this.clickedBuilding = true;
          onEnterBuilding();
        });

        const heroPos = this.iso(8, 8);
        this.hero = this.add.image(heroPos.x, heroPos.y, 'hero');
        this.hero.setOrigin(0.5, 1).setScale(0.12).setDepth(heroPos.y + 10);
        this.target.copy(heroPos);

        // A handful of citizens with different homes, wages and starting savings.
        const startingCitizens = [
          { name: 'Ayu', home: [2, 11], money: 120, wage: 28, employed: true, tint: 0xffb6c1 },
          { name: 'Bima', home: [11, 3], money: 75, wage: 24, employed: true, tint: 0xadd8e6 },
          { name: 'Citra', home: [12, 10], money: 48, wage: 20, employed: true, tint: 0xffe082 },
          { name: 'Dani', home: [3, 4], money: 22, wage: 18, employed: true, tint: 0xc5e1a5 },
          { name: 'Eka', home: [9, 12], money: 15, wage: 16, employed: false, tint: 0xd1c4e9 },
          { name: 'Fajar', home: [1, 7], money: 95, wage: 25, employed: true, tint: 0xffcc80 },
        ];

        this.citizens = startingCitizens.map((data, index) => {
          const home = this.iso(data.home[0], data.home[1]);
          const sprite = this.add.image(home.x, home.y, 'hero')
            .setOrigin(0.5, 1).setScale(0.105).setTint(data.tint).setDepth(home.y + 20 + index);
          const label = this.add.text(home.x, home.y - 24, data.name, {
            fontSize: '10px', color: '#ffffff', backgroundColor: '#17351f',
            padding: { x: 3, y: 2 },
          }).setOrigin(0.5, 1).setDepth(home.y + 30 + index);
          return {
            name: data.name, sprite, label, home, work: storePos.clone(),
            money: data.money, wage: data.wage, employed: data.employed,
            destination: home.clone(), nextDecision: this.time.now + 1000 + index * 600,
          };
        });

        this.hud = this.add.text(12, 12, '', {
          fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
          backgroundColor: '#102018dd', padding: { x: 10, y: 8 }, lineSpacing: 4,
        }).setScrollFactor(0).setDepth(10000);

        this.cameras.main.setZoom(1.2);
        this.cameras.main.centerOn(heroPos.x, heroPos.y);

        // Distinguish a tap-to-move from a drag-to-pan gesture.
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
          this.dragging = true;
          this.movedPointer = false;
          this.pointerStart.set(p.x, p.y);
        });
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
          if (!this.dragging || !p.isDown) return;
          const dx = p.x - this.pointerStart.x;
          const dy = p.y - this.pointerStart.y;
          if (Math.abs(dx) + Math.abs(dy) > 5) this.movedPointer = true;
          if (this.movedPointer) {
            this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
            this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
            this.pointerStart.set(p.x, p.y);
          }
        });
        this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
          this.dragging = false;
          if (this.movedPointer || this.clickedBuilding || !this.hero) {
            this.clickedBuilding = false;
            return;
          }
          const world = this.cameras.main.getWorldPoint(p.x, p.y);
          this.target.set(world.x, world.y);
        });
      }

      update(time: number, delta: number) {
        if (this.hero) {
          const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.target.x, this.target.y);
          if (distance > 5) {
            const angle = Phaser.Math.Angle.Between(this.hero.x, this.hero.y, this.target.x, this.target.y);
            const step = Math.min(distance, 180 * delta / 1000);
            this.hero.x += Math.cos(angle) * step;
            this.hero.y += Math.sin(angle) * step;
            this.hero.setDepth(this.hero.y + 10);
          }
        }

        // Accelerated in-game clock: one game minute every 250 ms.
        this.simMinutes = (this.simMinutes + delta / 250) % (24 * 60);
        const hour = Math.floor(this.simMinutes / 60);
        const isWorkHours = hour >= 8 && hour < 17;

        this.citizens.forEach((citizen, index) => {
          if (time >= citizen.nextDecision) {
            const shouldWork = citizen.employed && isWorkHours;
            const destination = shouldWork
              ? citizen.work
              : citizen.home;
            // Small offsets keep residents from stacking on the same pixel.
            this.moveCitizen(citizen, new Phaser.Math.Vector2(
              destination.x + (index % 3 - 1) * 9,
              destination.y + (index % 2 ? 4 : -4),
            ));
          }

          const dx = citizen.destination.x - citizen.sprite.x;
          const dy = citizen.destination.y - citizen.sprite.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 2) {
            const step = Math.min(distance, 48 * delta / 1000);
            citizen.sprite.x += dx / distance * step;
            citizen.sprite.y += dy / distance * step;
          }
          citizen.sprite.setDepth(citizen.sprite.y + 20 + index);
          citizen.label.setPosition(citizen.sprite.x, citizen.sprite.y - 24);
          citizen.label.setDepth(citizen.sprite.y + 30 + index);
        });

        // Pay wages once when the simulated workday ends; charge living costs once per game day.
        if (hour !== this.lastPaidHour) {
          this.lastPaidHour = hour;
          if (hour === 17) {
            this.citizens.forEach((citizen) => {
              if (citizen.employed) citizen.money += citizen.wage;
            });
          }
        }

        // Charge costs once when the clock crosses into midnight.
        if (hour === 0 && this.lastSimHour !== 0) {
          this.citizens.forEach((citizen) => {
            citizen.money = Math.max(0, citizen.money - (citizen.employed ? 12 : 18));
            if (citizen.money <= 0 && citizen.employed) {
              citizen.employed = false;
              citizen.nextDecision = 0;
            }
            // Unemployed residents can find work again once they have enough savings.
            if (!citizen.employed && citizen.money >= 12 && Phaser.Math.Between(1, 100) <= 8) {
              citizen.employed = true;
              citizen.nextDecision = 0;
            }
          });
        }
        this.lastSimHour = hour;

        if (this.hud) {
          const employed = this.citizens.filter((c) => c.employed).length;
          const totalMoney = this.citizens.reduce((sum, c) => sum + c.money, 0);
          const struggling = this.citizens.filter((c) => c.money < 20).length;
          const clock = `${String(hour).padStart(2, '0')}:${String(Math.floor(this.simMinutes % 60)).padStart(2, '0')}`;
          this.hud.setText([
            `KOTA KITA  •  ${clock}`,
            `Warga bekerja: ${employed}/${this.citizens.length}`,
            `Uang warga: ${Math.round(totalMoney)} koin`,
            `Kesulitan ekonomi: ${struggling} warga`,
            ...this.citizens.map((c) => `${c.name}: ${c.employed ? 'Bekerja' : 'Menganggur'} • ${Math.round(c.money)}`),
          ]);
        }
      }
    }

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ref.current,
      backgroundColor: '#2d2d44',
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      scene: MainScene,
      pixelArt: true,
      roundPixels: true,
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [onEnterBuilding]);

  return <div ref={ref} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />;
}
