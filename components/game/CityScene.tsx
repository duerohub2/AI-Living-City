'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

type Citizen = {
  name: string; sprite: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text;
  home: Phaser.Math.Vector2; work: Phaser.Math.Vector2; money: number; wage: number;
  employed: boolean; destination: Phaser.Math.Vector2; nextDecision: number;
};

export default function CityScene({ onEnterBuilding }: { onEnterBuilding: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!ref.current || gameRef.current) return;
    class MainScene extends Phaser.Scene {
      private hero: Phaser.GameObjects.Image | null = null;
      private target = new Phaser.Math.Vector2();
      private readonly TW = 64; private readonly TH = 32; private readonly MAP_SIZE = 25;
      private citizens: Citizen[] = []; private clockText: Phaser.GameObjects.Text | null = null;
      private simMinutes = 8 * 60; private lastPaidHour = -1; private lastSimHour = -1;
      private clickedBuilding = false; private dragging = false;
      private pointerStart = new Phaser.Math.Vector2(); private movedPointer = false; private pinchDistance = 0; private zoomHandler: ((event: Event) => void) | null = null;

      private iso(x: number, y: number) { return new Phaser.Math.Vector2((x-y)*32,(x+y)*16); }
      private road(x:number,y:number) { return (x>=11&&x<=13)||(y>=11&&y<=13); }
      private drawTile(x:number,y:number) {
        const p=this.iso(x,y), g=this.add.graphics();
        const park=x>=17&&y>=16&&x<=23&&y<=22, plaza=x>=9&&x<=15&&y>=9&&y<=15;
        const color=this.road(x,y)?(((x+y)%2)?0x858990:0x777c83):park?(((x+y)%2)?0x75b96b:0x69af62):plaza?(((x+y)%2)?0xd9c9a8:0xcdbd9b):(((x+y)%2)?0x8ac477:0x80b96d);
        g.fillStyle(color,1); g.lineStyle(1,0x36573d,0.17); g.beginPath();
        g.moveTo(p.x,p.y-16);g.lineTo(p.x+32,p.y);g.lineTo(p.x,p.y+16);g.lineTo(p.x-32,p.y);g.closePath();g.fillPath();g.strokePath();g.setDepth(p.y-1);
      }
      private tree(x:number,y:number,s=1) {
        const p=this.iso(x,y);
        this.add.ellipse(p.x+3,p.y,22*s,8*s,0x28452b,0.22).setDepth(p.y+1);
        this.add.rectangle(p.x,p.y-12*s,5*s,13*s,0x805333).setDepth(p.y+2);
        this.add.ellipse(p.x,p.y-25*s,25*s,27*s,0x347b45).setDepth(p.y+3);
        this.add.ellipse(p.x-4*s,p.y-29*s,13*s,13*s,0x59a95e).setDepth(p.y+4);
      }
      preload(){this.load.image('hero','/assets/sprites/npc_008.png');this.load.image('store','/assets/sprites/building_010.png');}
      create(){
        for(let y=0;y<this.MAP_SIZE;y++)for(let x=0;x<this.MAP_SIZE;x++)this.drawTile(x,y);
        for(let i=0;i<15;i++){const x=17+i%6,y=17+Math.floor(i/6)*2;if(!(x===19&&y<21))this.tree(x,y,0.82+(i%3)*0.08);}
        // Dense residential and commercial blocks around the main roads.
        const blocks: Array<[number,number,number]> = [[3,3,.72],[6,3,.8],[3,7,.76],[7,7,.7],[18,3,.78],[21,5,.82],[18,8,.7],[5,17,.78],[8,19,.72],[14,18,.8],[16,22,.76],[22,21,.82],[4,23,.7],[8,3,.68],[20,12,.76],[5,10,.72],[8,14,.74],[16,7,.78],[22,9,.7],[3,14,.75],[7,23,.72],[15,3,.78],[18,15,.74],[23,17,.8]];
        blocks.forEach(([x,y,scale],i)=>{const p=this.iso(x,y);const b=this.add.image(p.x,p.y-3,'store').setOrigin(.5,1).setScale(scale).setTint([0xffffff,0xe7d8b8,0xcce2c1,0xf0c9a8,0xc9d8e8][i%5]).setDepth(p.y+12+i);});
        [[2,2],[5,2],[2,5],[22,3],[22,7],[3,17],[6,21],[20,23],[23,14],[16,5]].forEach(([x,y])=>this.tree(x,y,.9));
        [[10,12],[14,12],[12,10],[12,14]].forEach(([x,y])=>{const p=this.iso(x,y);this.add.ellipse(p.x,p.y+1,12,5,0x273c31,.2).setDepth(p.y+1);this.add.rectangle(p.x,p.y-10,3,18,0x3e4549).setDepth(p.y+2);this.add.circle(p.x,p.y-20,5,0xffe7a0).setDepth(p.y+3);});
        const storePos=this.iso(12,12),building=this.add.image(storePos.x,storePos.y-4,'store');
        building.setOrigin(.5,1).setScale(1.2).setDepth(storePos.y+15).setInteractive({useHandCursor:true});
        building.on('pointerdown',()=>{this.clickedBuilding=true;onEnterBuilding();});
        const heroPos=this.iso(15,15);this.hero=this.add.image(heroPos.x,heroPos.y,'hero').setOrigin(.5,1).setScale(.12).setDepth(heroPos.y+30);this.target.copy(heroPos);
        const people=[
          {name:'Ayu',home:[3,20],money:120,wage:28,employed:true,tint:0xffc4d1},
          {name:'Bima',home:[21,4],money:75,wage:24,employed:true,tint:0xb7e4ff},
          {name:'Citra',home:[22,18],money:48,wage:20,employed:true,tint:0xffe6a6},
          {name:'Dani',home:[4,6],money:22,wage:18,employed:true,tint:0xcaf0b1},
          {name:'Eka',home:[9,22],money:15,wage:16,employed:false,tint:0xd9c8ff},
          {name:'Fajar',home:[2,12],money:95,wage:25,employed:true,tint:0xffd0a1},
        ];
        this.citizens=people.map((d,i)=>{const home=this.iso(d.home[0],d.home[1]);const sprite=this.add.image(home.x,home.y,'hero').setOrigin(.5,1).setScale(.105).setTint(d.tint).setDepth(home.y+20+i);const label=this.add.text(home.x,home.y-24,d.name,{fontFamily:'Arial,sans-serif',fontSize:'10px',color:'#fffdf4',backgroundColor:'#254a34',padding:{x:4,y:3}}).setOrigin(.5,1).setDepth(home.y+30+i);return{name:d.name,sprite,label,home,work:storePos.clone(),money:d.money,wage:d.wage,employed:d.employed,destination:home.clone(),nextDecision:this.time.now+1000+i*650};});
        this.clockText=this.add.text(18,18,'08:00 • KOTA HIDUP',{fontFamily:'Arial,sans-serif',fontSize:'13px',fontStyle:'bold',color:'#f8f6ed',backgroundColor:'#203c2ddd',padding:{x:12,y:9}}).setScrollFactor(0).setDepth(10000);
        this.cameras.main.setZoom(.9);this.cameras.main.centerOn(heroPos.x,heroPos.y);this.cameras.main.setBounds(-880,-32,1760,920);
        this.input.addPointer(1);
        this.input.on('wheel',(_p:Phaser.Input.Pointer,_objects:Phaser.GameObjects.GameObject[],_dx:number,dy:number)=>{this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom+(dy<0?.08:-.08),.55,1.65));});
        this.zoomHandler=((event:Event)=>{const amount=(event as CustomEvent<number>).detail;this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom+amount,.55,1.65));}) as EventListener;
        window.addEventListener('city-map-zoom',this.zoomHandler);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{if(this.zoomHandler)window.removeEventListener('city-map-zoom',this.zoomHandler);});
        this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{this.dragging=true;this.movedPointer=false;this.pointerStart.set(p.x,p.y);});
        this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{const p1=this.input.pointer1,p2=this.input.pointer2;if(p1?.isDown&&p2?.isDown){const distance=Phaser.Math.Distance.Between(p1.x,p1.y,p2.x,p2.y);if(this.pinchDistance>0){const change=distance-this.pinchDistance;if(Math.abs(change)>2)this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom+change*.002,.55,1.65));}this.pinchDistance=distance;this.dragging=false;return;}if(!p.isDown){this.pinchDistance=0;return;}if(!this.dragging)return;const dx=p.x-this.pointerStart.x,dy=p.y-this.pointerStart.y;if(Math.abs(dx)+Math.abs(dy)>5)this.movedPointer=true;if(this.movedPointer){this.cameras.main.scrollX-=dx/this.cameras.main.zoom;this.cameras.main.scrollY-=dy/this.cameras.main.zoom;this.pointerStart.set(p.x,p.y);}});
        this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{this.dragging=false;if(this.movedPointer||this.clickedBuilding||!this.hero){this.clickedBuilding=false;return;}const world=this.cameras.main.getWorldPoint(p.x,p.y);this.target.set(world.x,world.y);});
      }
      update(_time:number,delta:number){
        if(this.hero){const d=Phaser.Math.Distance.Between(this.hero.x,this.hero.y,this.target.x,this.target.y);if(d>5){const a=Phaser.Math.Angle.Between(this.hero.x,this.hero.y,this.target.x,this.target.y),step=Math.min(d,180*delta/1000);this.hero.x+=Math.cos(a)*step;this.hero.y+=Math.sin(a)*step;this.hero.setDepth(this.hero.y+30);}}
        this.simMinutes=(this.simMinutes+delta/250)%(24*60);const hour=Math.floor(this.simMinutes/60),working=hour>=8&&hour<17;
        this.citizens.forEach((c,i)=>{if(this.time.now>=c.nextDecision){const dest=c.employed&&working?c.work:c.home;this.moveCitizen(c,new Phaser.Math.Vector2(dest.x+(i%3-1)*9,dest.y+(i%2?4:-4)));}const dx=c.destination.x-c.sprite.x,dy=c.destination.y-c.sprite.y,d=Math.hypot(dx,dy);if(d>2){const step=Math.min(d,48*delta/1000);c.sprite.x+=dx/d*step;c.sprite.y+=dy/d*step;}c.sprite.setDepth(c.sprite.y+20+i);c.label.setPosition(c.sprite.x,c.sprite.y-24);c.label.setDepth(c.sprite.y+30+i);});
        if(hour!==this.lastPaidHour){this.lastPaidHour=hour;if(hour===17)this.citizens.forEach(c=>{if(c.employed)c.money+=c.wage;});}
        if(hour===0&&this.lastSimHour!==0)this.citizens.forEach(c=>{c.money=Math.max(0,c.money-(c.employed?12:18));if(c.money<=0&&c.employed){c.employed=false;c.nextDecision=0;}if(!c.employed&&c.money>=12&&Phaser.Math.Between(1,100)<=8){c.employed=true;c.nextDecision=0;}});
        this.lastSimHour=hour;if(this.clockText)this.clockText.setText(`${String(hour).padStart(2,'0')}:${String(Math.floor(this.simMinutes%60)).padStart(2,'0')} • KOTA HIDUP`);
      }
      private moveCitizen(c:Citizen,dest:Phaser.Math.Vector2){c.destination.copy(dest);c.nextDecision=this.time.now+Phaser.Math.Between(4500,9000);}
    }
    gameRef.current=new Phaser.Game({type:Phaser.AUTO,parent:ref.current,backgroundColor:'#b6d6a0',scale:{mode:Phaser.Scale.FIT,width:800,height:800,autoCenter:Phaser.Scale.CENTER_BOTH},scene:MainScene,pixelArt:true,roundPixels:true});
    return()=>{gameRef.current?.destroy(true);gameRef.current=null;};
  },[onEnterBuilding]);
  return <div ref={ref} className="city-canvas" style={{width:800,height:800,maxWidth:'100%',imageRendering:'pixelated'}} />;
}
