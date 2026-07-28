/* =====================================================================
   THE RAINBOW ROAD - a bird's plea and a "sky dungeon" strung across the
   cloud-sea. A wind-lost bird on the Cloudreach can no longer glide down to
   her favourite islands - the Storm-Eye, a bound storm-core, has soured the high wind and
   blows her off course. Run her rainbow road, clear six tiny sky-isles of
   their trials, and put the Storm-Eye out; the wind calms and her roost is
   hers again. Puzzle 4 wins THE SNARE: your staff-bolts now snare foes.
   The open stretches BETWEEN the isles are patrolled by drifting road-shades
   (see spawnRoadShades) - the storm scattered them the length of the run, so
   the road has to be fought through, not just dashed across.
   ===================================================================== */
const SKY_ISLES = [
  {key:'start', x:60, y:156, r:5},
  {key:'i1',    x:60, y:134, r:4, puzzle:1}, // defeat four sky wraiths
  {key:'i2',    x:76, y:112, r:5, puzzle:2}, // tread the rune-tiles in order
  {key:'i3',    x:44, y:92,  r:5, puzzle:3}, // dodge the cloud-snatcher, cross over
  {key:'i4',    x:76, y:72,  r:6, puzzle:4}, // the Storm-Wraith mini-boss
  {key:'i5',    x:44, y:52,  r:4, puzzle:5}, // three more sky wraiths
  {key:'i6',    x:60, y:28,  r:7, puzzle:6}  // the Storm-Eye
];
function skyIsle(k){ return SKY_ISLES.find(s=>s.key===k); }
/* ---------- gentle side-to-side sway for the little stepping-isles ----------
   The small isles you hop across drift left and right on the high wind - one slow,
   one brisk, alternating up the road. The landing (start) and the two boss-isles
   (i4 the Storm-Perch, i6 the Broken Crown) stay dead still, so a fight never shifts
   under your feet. This is a purely visual, screen-space offset applied in the
   renderer: an isle's tiles, its decor, and whoever stands on it all sway together,
   so footing, dashes and the gaps between isles play exactly as before. */
const SKY_SWING = {
  i1:{amp:7, spd:0.8, phase:0.0},   // slow
  i2:{amp:7, spd:1.7, phase:1.2},   // fast
  i3:{amp:7, spd:0.8, phase:2.4},   // slow
  i5:{amp:7, spd:1.7, phase:3.6}    // fast
};
// horizontal screen-space sway (px) for a world position, if it sits on a swaying isle
function skyIsleSwingAt(wx,wy){
  if(G.worldId!=='skydungeon') return 0;
  for(const s of SKY_ISLES){ const cfg=SKY_SWING[s.key]; if(!cfg) continue;
    if(dist(wx,wy,s.x,s.y) <= s.r+0.6) return cfg.amp*Math.sin(G.time*cfg.spd + cfg.phase); }
  return 0;
}
// the gated bridges: each opens once its island's trial is met
const SKY_GATES = [
  {gate:'g1', a:'i1', b:'i2', flag:'skyG1'},
  {gate:'g2', a:'i2', b:'i3', flag:'skyG2'},
  {gate:'g4', a:'i4', b:'i5', flag:'skyG4'},
  {gate:'g5', a:'i5', b:'i6', flag:'skyG5'}
];
const SKYDUNGEON_ZONES = {
  start: {x:60, y:156, r:6, name:'The Rainbow Landing', lv:[9,11]},
  i1:    {x:60, y:134, r:5, name:'The Wraith-Perch',    lv:[9,11]},
  i2:    {x:76, y:112, r:5, name:'The Rune-Tiles',      lv:[9,11]},
  i3:    {x:44, y:92,  r:6, name:"The Snatcher's Isle", lv:[10,11]},
  i4:    {x:76, y:72,  r:7, name:'The Storm-Perch',     lv:[10,12]},
  i5:    {x:44, y:52,  r:5, name:'The Second Perch',    lv:[10,12]},
  i6:    {x:60, y:28,  r:8, name:'The Broken Crown',    lv:[11,13]}
};
if(typeof WORLD_DEFS!=='undefined'){
  WORLD_DEFS.skydungeon = { W:120, H:172, seed:70551, zones:SKYDUNGEON_ZONES, cloud:1, dungeon:1, dark:0,
    spawn:{x:60.5, y:159.5}, title:'THE RAINBOW ROAD', sub:'A SKY-DUNGEON STRUNG ACROSS THE CLOUD-SEA',
    gen:()=>genSkyDungeonAll() };
}
if(typeof DUNGEON_PARENT!=='undefined'){ /* meta-layer table is local; patched there directly */ }

/* ---------- terrain: tiny cloud-isles laced by a rainbow road ---------- */
function skyIsleTile(x,y){ for(const s of SKY_ISLES){ if(dist(x,y,s.x,s.y)<=s.r+0.4) return true; } return false; }
function skyRoadCarve(ax,ay,bx,by){
  const steps=Math.ceil(dist(ax,ay,bx,by))*2;
  for(let i=0;i<=steps;i++){
    const x=Math.round(lerp(ax,bx,i/steps)), y=Math.round(lerp(ay,by,i/steps));
    for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
      const tx=x+dx, ty=y+dy;
      if(inb(tx,ty) && tileAt(tx,ty)===T.DEEP) setTile(tx,ty,T.SNOW);
    }
  }
}
function genSkyDungeon(){
  for(let i=0;i<MAPW*MAPH;i++) G.map[i]=T.DEEP;   // open sky (transparent backdrop)
  for(const s of SKY_ISLES) carveDisc(s.x,s.y,s.r,T.SNOW,false);
  for(let i=0;i<SKY_ISLES.length-1;i++) skyRoadCarve(SKY_ISLES[i].x,SKY_ISLES[i].y,SKY_ISLES[i+1].x,SKY_ISLES[i+1].y);
  // the rainbow itself - a band of colour laid over every road tile (islands stay cloud-white)
  const pr=mulberry32(SEED+7);
  for(let y=0;y<MAPH;y++) for(let x=0;x<MAPW;x++){
    if(tileAt(x,y)===T.SNOW && !skyIsleTile(x,y)){
      G.decor.push({kind:'rainbow', x:x+0.5, y:y+0.5, hue:((x*11+y*23)%360), sh:pr()*TAU});
    }
  }
}
function skyGateMid(g){ const a=skyIsle(g.a), b=skyIsle(g.b); return {x:(a.x+b.x)/2, y:(a.y+b.y)/2}; }
function skyGatePlugTiles(g){
  const m=skyGateMid(g), out=[];
  for(let y=Math.round(m.y)-3;y<=Math.round(m.y)+3;y++) for(let x=Math.round(m.x)-3;x<=Math.round(m.x)+3;x++){
    if(inb(x,y) && tileAt(x,y)===T.SNOW && !skyIsleTile(x,y) && dist(x+0,y+0,m.x,m.y)<=2.4) out.push([x,y]);
  }
  return out;
}
// break a road segment into floating rainbow PLATFORMS separated by open-sky GAPS you dash across.
// A tile-space state machine keeps every gap run to 2 tiles (a dash clears ~2.8), so the crossing
// is always makeable; the gate area (and the fading bridge) are left as solid road.
function skyPlatformize(a,b){
  const L=Math.hypot(b.x-a.x,b.y-a.y); if(L<1) return;
  const ux=(b.x-a.x)/L, uy=(b.y-a.y)/L, px=-uy, py=ux;
  let gm=null; for(const gg of SKY_GATES){ if((gg.a===a.key&&gg.b===b.key)||(gg.a===b.key&&gg.b===a.key)){ gm=skyGateMid(gg); break; } }
  const stubA=a.r+2.2, stubB=b.r+2.2;   // keep solid footing right at each isle
  // ordered, deduped centre tiles across the middle of the segment
  const seq=[]; let last='';
  for(let s=stubA; s<=L-stubB; s+=0.5){ const cx=a.x+ux*s, cy=a.y+uy*s, tx=Math.round(cx), ty=Math.round(cy), k=tx+','+ty;
    if(k===last) continue; last=k; seq.push([cx,cy]); }
  let mode='plat', run=0;   // 3 platform tiles, then 2 gap tiles, repeating
  for(const [cx,cy] of seq){
    if(mode==='plat' && run>=3){ mode='gap'; run=0; }
    else if(mode==='gap' && run>=2){ mode='plat'; run=0; }
    const nearGate = gm && Math.hypot(cx-gm.x, cy-gm.y) < 3.4;
    if(mode==='gap' && !nearGate){
      for(let w=-2;w<=2;w++){ const gx=Math.round(cx+px*w), gy=Math.round(cy+py*w);
        if(!inb(gx,gy) || skyIsleTile(gx,gy) || tileAt(gx,gy)!==T.SNOW) continue;
        setTile(gx,gy,T.DEEP); setSolid(gx,gy,0); G._skyPits.add(gx+','+gy);   // open-sky gap: walkable, but you fall
        G.decor=G.decor.filter(d=>!(d.kind==='rainbow' && Math.floor(d.x)===gx && Math.floor(d.y)===gy));
      }
    }
    run++;
  }
}
function placeObjectsSkyDungeon(){
  P.story=P.story||{};
  // the wind-lost bird waits at the landing - your ride back down to the Cloudreach
  { const s=skyIsle('start');
    G.decor.push({kind:'skybird', x:s.x+0.5, y:s.y+2.5, up:1, name:'THE WIND-LOST BIRD', labelY:-46}); }
  // a couple of cloud-lamps at the landing
  { const s=skyIsle('start');
    G.decor.push({kind:'lamp', x:s.x-3+0.5, y:s.y+0.5}); G.decor.push({kind:'lamp', x:s.x+3+0.5, y:s.y+0.5}); }
  // PUZZLE 2 - THE FADING RAINBOW BRIDGE: the span from i2 to i3 flickers in and out in a
  // travelling wave. Cross while the tiles are solid; step on a faded one and you drop
  // through the cloud, back to i2 to try again. Each band spans the full width, so there's
  // no edge to sneak along - just time your steps to the wave.
  G._skyFade={tiles:[], speed:0.48, onFrac:0.74, entryX:76.5, entryY:112.5};
  G._skyFadeT=0;
  { const a=skyIsle('i2'), b=skyIsle('i3'), ax=a.x, ay=a.y, L=Math.hypot(b.x-ax,b.y-ay), ux=(b.x-ax)/L, uy=(b.y-ay)/L;
    for(let yy=0;yy<MAPH;yy++) for(let xx=0;xx<MAPW;xx++){
      if(tileAt(xx,yy)!==T.SNOW || skyIsleTile(xx,yy)) continue;
      const rx=xx-ax, ry=yy-ay, along=rx*ux+ry*uy, perp=Math.abs(-rx*uy+ry*ux);
      if(along>L*0.28 && along<L*0.72 && perp<2.2){ const band=Math.round((along-L*0.28)/2.0);
        const f={kind:'fadetile', x:xx+0.5, y:yy+0.5, band, phase:(band*0.3)%1};
        G.decor.push(f); G._skyFade.tiles.push(f); } }
    // strip the static rainbow-road paint from the fading tiles, so a faded tile reads
    // clearly as a gap (not a still-colourful road tile you'd wrongly trust)
    const fadeSet=new Set(G._skyFade.tiles.map(f=>Math.floor(f.x)+','+Math.floor(f.y)));
    G.decor=G.decor.filter(d=>!(d.kind==='rainbow' && fadeSet.has(Math.floor(d.x)+','+Math.floor(d.y))));
  }
  // the gated bridges (g2 is the fading bridge above, so it has no solid ward)
  for(const g of SKY_GATES){
    if(g.gate==='g2') continue;
    const m=skyGateMid(g), tiles=skyGatePlugTiles(g), open=!!P.story[g.flag];
    G.decor.push({kind:'skygate', gate:g.gate, x:m.x, y:m.y, tiles, open, label:'a wind-ward'});
    for(const [x,y] of tiles){ setSolid(x,y, open?0:1); }
  }
  // the Storm-Eye's hoard, on the last isle
  { const s=skyIsle('i6'); G.decor.push({kind:'chest', x:s.x+0.5, y:s.y-3+0.5, sky:1, rich:11}); }
  // ---- FLOATING RAINBOW PLATFORMS ----
  // break each road (except the fading bridge) into rainbow platforms with open-sky GAPS you must
  // DASH across; fall between them and the wind bears you back to the isle behind you.
  G._skyPits=new Set(); G._skyFellHint=0;
  if(!(P.unlocked && P.unlocked.dash)){ P.unlocked=P.unlocked||{}; P.unlocked.dash=true;
    toast('The high wind lifts your step - you can <b>DASH</b> across the gaps (tap <b>Shift</b> / the dodge button).',5000); }
  for(let i=0;i<SKY_ISLES.length-1;i++){ const a=SKY_ISLES[i], b=SKY_ISLES[i+1];
    if(a.key==='i2' && b.key==='i3') continue;   // the fading bridge is its own crossing
    skyPlatformize(a,b);
  }
  G.critters=[];
}
// is this fading tile currently solid footing? (a travelling on-wave across the bands)
function skyFadeSolid(f){
  const F=G._skyFade; if(!F) return true;
  const ph=(((G._skyFadeT||0)*F.speed - f.phase)%1+1)%1;
  return ph < F.onFrac;
}
/* ---------- puzzle 2: THE PRISM WARD - bend the rainbow beam to the ward-crystal ---------- */
function skyBeamTrace(){
  const em=G.decor.find(d=>d.kind==='skyemitter'); if(!em) return;
  const prisms=G.decor.filter(d=>d.kind==='skyprism');
  const tgt=G.decor.find(d=>d.kind==='skyward');
  let x=Math.floor(em.x), y=Math.floor(em.y), dx=em.dir.x, dy=em.dir.y, hit=false;
  const path=[];
  for(let step=0; step<48; step++){
    x+=dx; y+=dy; if(!inb(x,y)) break;
    path.push([x+0.5, y+0.5]);
    if(tgt && Math.floor(tgt.x)===x && Math.floor(tgt.y)===y){ hit=true; break; }
    const pr=prisms.find(p=>Math.floor(p.x)===x && Math.floor(p.y)===y);
    if(pr){ if(pr.mirror==='/'){ const nx=-dy, ny=-dx; dx=nx; dy=ny; } else { const nx=dy, ny=dx; dx=nx; dy=ny; } }
  }
  G._skyBeamPath=path;
  if(tgt) tgt.lit=hit;
  if(hit && !(P.story && P.story.skyG2)){
    P.story=P.story||{}; P.story.skyG2=1; openSkyGate('g2');
    banner('THE PRISM WARD ANSWERS','THE WIND-WARD PARTS');
    if(Snd.quest) Snd.quest();
    if(typeof autoSave==='function') autoSave();
  }
}
function rotateSkyPrism(b){
  b.mirror = (b.mirror==='/')?'\\':'/';
  if(Snd.pickup) Snd.pickup();
  burst(b.x, b.y-0.3, 'hsl('+((G.time*80)%360|0)+',90%,70%)', 10, 1.8);
  skyBeamTrace();
}
function spawnSkyWraith(x,y,puzzle,elite){
  const sp=findOpenNear(Math.round(x),Math.round(y),4) || [Math.round(x),Math.round(y)];
  const m=spawnMob('skywraith', sp[0], sp[1], elite);
  if(m){ m.puzzle=puzzle; m.respawnT=-1; m.lvl=Math.max(9,Math.min(12,P.level)); m.hx=m.x; m.hy=m.y; }
  return m;
}
// The cloud-snatcher only appears once you're deep enough in: the rune-tiles (isle 2)
// must be solved so the wind-ward bridge to its isle has parted. It's invulnerable and
// leashed to its isle, so once spawned it simply persists until the whole road is calm.
function ensureSnatcher(){
  P.story=P.story||{};
  if(P.story.skyDungeonDone) return;          // road's calm - the snatcher is gone
  if(!P.story.skyG2) return;                  // not far enough in yet (rune-tiles unsolved)
  if(G.mobs.some(m=>m.grabber && !m.dead)) return;   // already prowling
  const s=skyIsle('i3');
  // leash is pulled UP (north) and tightened, so it guards the far side of the isle and
  // leaves a safe strip at the southern approach where you step off the bridge.
  const gcx=s.x+0.5, gcy=s.y-2.0, gr=s.r-0.5;
  const sp=findOpenNear(Math.round(gcx),Math.round(gcy),3) || [Math.round(gcx),Math.round(gcy)];
  const g=spawnMob('skygrabber', sp[0], sp[1]);
  if(g){ g.grabber=1; g.invuln=1; g.respawnT=-1; g.gcx=gcx; g.gcy=gcy; g.gr=gr; g.hx=g.gcx; g.hy=g.gcy; g.state='chase'; g.noAggroT=0; }
}
/* ---------- roaming road-shades: patrol the open stretches between the isles ----------
   The rainbow road used to be a quiet dash-and-cross with nothing to fight in-between.
   These drifting sky-shades post along each open stretch and give chase as you near, so
   you meet them one segment at a time AS YOU PROGRESS up the road. The fading bridge
   (i2 -> i3) is left clear on purpose: that crossing is a timing puzzle, and a chasing
   shade there would be unfair. Posts are snapped to solid road so the shades don't nest
   in the dash-gap pits. */
const SKY_ROAD_PATROLS = [
  {a:'start', b:'i1', n:1},   // the first climb off the landing - one lone shade
  {a:'i1',    b:'i2', n:2},   // the run up to the rune-tiles
  {a:'i3',    b:'i4', n:2},   // past the snatcher's isle, on toward the storm-perch
  {a:'i4',    b:'i5', n:2},   // between the two perches
  {a:'i5',    b:'i6', n:2}    // the last approach to the Broken Crown
];
// nearest solid road tile centre to (x,y) - never an isle, never a dash-gap pit
function skySolidRoadNear(x,y){
  const bx=Math.round(x), by=Math.round(y);
  for(let rad=0; rad<6; rad++){
    for(let dy=-rad;dy<=rad;dy++) for(let dx=-rad;dx<=rad;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==rad) continue;
      const tx=bx+dx, ty=by+dy;
      if(!inb(tx,ty)) continue;
      if(tileAt(tx,ty)===T.SNOW && !skyIsleTile(tx,ty) && !(G._skyPits && G._skyPits.has(tx+','+ty)))
        return [tx+0.5, ty+0.5];
    }
  }
  return [x, y];
}
function spawnRoadShades(){
  for(const seg of SKY_ROAD_PATROLS){
    const a=skyIsle(seg.a), b=skyIsle(seg.b);
    if(!a || !b) continue;
    const L=Math.hypot(b.x-a.x, b.y-a.y); if(L<1) continue;
    const ux=(b.x-a.x)/L, uy=(b.y-a.y)/L;
    const s0=a.r+2.6, s1=L-(b.r+2.6);        // the open stretch, clear of each isle's footing
    if(s1<=s0) continue;
    // two patrol posts at ~30% and ~70% along the stretch; each shade drifts between them
    const pA=skySolidRoadNear(a.x+ux*(s0+(s1-s0)*0.30), a.y+uy*(s0+(s1-s0)*0.30));
    const pB=skySolidRoadNear(a.x+ux*(s0+(s1-s0)*0.70), a.y+uy*(s0+(s1-s0)*0.70));
    for(let i=0;i<seg.n;i++){
      const t=(seg.n===1)?0.5:i/(seg.n-1);
      const sx=lerp(pA[0],pB[0],t), sy=lerp(pA[1],pB[1],t);
      const m=spawnMob('skywraith', Math.floor(sx), Math.floor(sy));
      if(!m) continue;
      m.roadwraith=1; m.respawnT=-1;
      m.lvl=Math.max(9,Math.min(12,P.level));
      m.x=sx; m.y=sy; m.hx=sx; m.hy=sy;
      m.pax=pA[0]; m.pay=pA[1]; m.pbx=pB[0]; m.pby=pB[1];
      m.patT=i*1.7; m.patSpd=0.16+0.05*i;     // slow, slightly desynced drift up and down the road
    }
  }
}
function spawnMobsSkyDungeon(){
  P.story=P.story||{};
  const done=!!P.story.skyDungeonDone;
  // P1 - four sky wraiths bar the perch
  if(!P.story.skyG1){ const s=skyIsle('i1');
    for(let i=0;i<4;i++){ const a=i/4*TAU, r2=2.2; spawnSkyWraith(s.x+Math.cos(a)*r2, s.y+Math.sin(a)*r2, 1); } }
  // P3 - the cloud-snatcher: held back until you're further in (see ensureSnatcher).
  // It only wakes once the rune-tiles are solved and the bridge to its isle opens, so
  // it isn't looming over the early islands from the moment you step onto the road.
  ensureSnatcher();
  // P4 - the Storm-Wraith mini-boss
  if(!P.story.skyG4 && !done){ const s=skyIsle('i4');
    const sp=findOpenNear(s.x,s.y,4) || [s.x,s.y];
    const b=spawnMob('stormwraith', sp[0], sp[1]);
    if(b){ b.boss=true; b.bigBoss=true; b.skyminiboss=1; b.bscale=1.7; b.title='THE STORM-WRAITH';
      b.hp=b.maxhp=300; b.dmg=26; b.lvl=11; b.hx=b.x; b.hy=b.y; b.respawnT=-1; b.entrance='descend'; } }
  // P5 - three more sky wraiths
  if(!P.story.skyG5){ const s=skyIsle('i5');
    for(let i=0;i<3;i++){ const a=i/3*TAU, r2=2.0; spawnSkyWraith(s.x+Math.cos(a)*r2, s.y+Math.sin(a)*r2, 5); } }
  // P6 - the Storm-Eye: a shielded storm-core that hovers over its isle. It can't be
  // struck while its shield holds - it spits dodge-only gale-wisps at you, and only drops
  // its guard for a moment each time it DISCHARGES (a telegraphed shockwave). Strike then.
  if(!done){ const s=skyIsle('i6');
    const b=spawnMob('stormeye', s.x, s.y-1);
    if(b){ b.boss=true; b.bigBoss=true; b.skyfinalboss=1; b.bscale=2.4; b.title='THE STORM-EYE'; b.ach='stormbreaker';
      b.hp=b.maxhp=440; b.dmg=24; b.lvl=13; b.hx=s.x; b.hy=s.y-1; b.respawnT=-1;
      b.invuln=1; b.stormeye=1; b.eyeState='hover'; b.eyeT=2.6; b.hover=1; b.float=0; b.entrance='descend'; } }
  // roaming road-shades between the isles - unless the road's already calm
  if(!done) spawnRoadShades();
}
function genSkyDungeonAll(){
  genSkyDungeon(); bakeSolids(); placeObjectsSkyDungeon(); buildFoam();
  spawnMobsSkyDungeon(); buildMapBase();
}

/* ---------- gate logic ---------- */
function openSkyGate(gate){
  const b=G.decor.find(d=>d.kind==='skygate' && d.gate===gate);
  if(!b || b.open) return;
  b.open=true;
  for(const [x,y] of (b.tiles||[])){ setSolid(x,y,0); setTile(x,y,T.SNOW); }
  if(Snd.quest) Snd.quest();
  const m=skyGateMidOf(b);
  shockwave(m.x, m.y, 'rgba(255,255,255,0.9)', 46); G.shake=0.4;
  for(let k=0;k<3;k++) burst(m.x+rnd(-1,1), m.y+rnd(-1,1), 'hsl('+(rnd(0,360)|0)+',90%,70%)', 8, 2.2);
}
function skyGateMidOf(b){ return {x:b.x, y:b.y}; }

/* ---------- puzzle 2: the rune-tiles (tread I..V in order) ---------- */
function pressSkyTile(b){
  const grp=G.decor.filter(d=>d.kind==='skytile' && d.group===(b.group||'sky'));
  if(P.story && P.story.skyG2){ return; }
  if(b.set){ toast('That rune already shines. Tread the others - but the order is yours to find.',2400); return; }
  const nextNeeded=grp.filter(d=>d.set).length+1;
  if(b.ord===nextNeeded){
    b.set=true; if(Snd.pickup) Snd.pickup(); burst(b.x,b.y-0.3,'hsl('+((b.ord*60)%360)+',90%,68%)',12,1.8);
    if(grp.every(d=>d.set)){
      P.story=P.story||{}; P.story.skyG2=1; openSkyGate('g2');
      banner('THE RUNE-TILES ANSWER','THE WIND-WARD PARTS');
      if(typeof autoSave==='function') autoSave();
    }
  } else {
    for(const d of grp) d.set=false;
    if(Snd.hit) Snd.hit(); if(Snd.boss) Snd.boss(); G.shake=0.35;
    burst(b.x,b.y-0.3,'#3a2a4a',14,2);
    const sp=findOpenNear(Math.round(b.x),Math.round(b.y)-1,4) || [Math.round(b.x),Math.round(b.y)];
    const m=spawnMob('skywraith', sp[0], sp[1]);
    if(m){ m.state='chase'; m.respawnT=-1; m.noAggroT=0; m.lvl=Math.max(9,Math.min(12,P.level)); m.hx=m.x; m.hy=m.y;
      shockwave(m.x,m.y,'rgba(140,180,255,0.7)',22); burst(m.x,m.y-0.4,'#bcd8ff',14,1.8); }
    toast('Wrong tile! It sours and a <b>sky wraith</b> tears free of the cloud. The runes go dark - the order resets, and you must guess anew.',4200);
  }
}

/* ---------- falling through the cloud: the drop plays out (control frozen in updatePlayer),
   THEN the wind bears you back to the target isle (see skyFallRespawn + the draw branch in
   drawPlayer). Used by both the platform gaps and the fading bridge. ---------- */
function skyFallStart(tx,ty,hint){
  if(G._skyFall) return;
  if(Snd.boss) Snd.boss(); G.shake=0.5; buzz(16);
  burst(P.x,P.y-0.4,'hsl('+((G.time*120)%360|0)+',90%,70%)',14,2.4); shockwave(P.x,P.y,'rgba(255,255,255,0.8)',38);
  G._skyFall={ t:0, dur:0.85, x:P.x, y:P.y, tx, ty, hint:hint||'' };
  P.click=null; P.moving=false; P.rollT=0;
}
function skyFallRespawn(){
  const z=G._skyFall; G._skyFall=null; if(!z) return;
  P.x=z.tx; P.y=z.ty; P.click=null; P.moving=false;
  G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
  burst(P.x,P.y-0.4,'hsl('+((G.time*120)%360|0)+',90%,70%)',12,2.0); shockwave(P.x,P.y,'rgba(255,255,255,0.7)',30);
  if(z.hint) toast(z.hint,5600);
}

/* ---------- per-frame dungeon logic ---------- */
function updateSkyDungeon(dt){
  P.story=P.story||{};
  // a fall in progress plays out (control frozen), then bears you back to the target isle
  if(G._skyFall){ G._skyFall.t+=dt; if(G._skyFall.t>=G._skyFall.dur) skyFallRespawn(); return; }
  // fall between the floating rainbow platforms -> the wind bears you back to the isle behind you
  if(G._skyPits && G._skyPits.size && !P.dead && (P.rollT||0)<=0 && G._skyPits.has(Math.floor(P.x)+','+Math.floor(P.y))){
    let best=null,bd=1e9;
    for(const is of SKY_ISLES){ if(is.y < P.y-2) continue; const d=dist(P.x,P.y,is.x,is.y); if(d<bd){bd=d;best=is;} }
    if(!best) for(const is of SKY_ISLES){ const d=dist(P.x,P.y,is.x,is.y); if(d<bd){bd=d;best=is;} }
    let hint=''; if(!G._skyFellHint){ G._skyFellHint=1; hint='You drop between the floating rainbow platforms and the wind bears you back. <b>DASH across the gaps</b> - time your jumps from platform to platform.'; }
    skyFallStart(best.x+0.5, best.y+0.5, hint);
    return;
  }
  ensureSnatcher();   // wakes the cloud-snatcher the instant you cross the fading bridge
  // Vath's taunt: once you're past the fading bridge and climbing toward the Storm-Perch,
  // his violet apparition flickers over the road, chuckles, and is gone. Fires once.
  if(!P.story.skyVathTaunt && P.story.skyG2 && !P.story.skyDungeonDone
     && P.y < skyIsle('i3').y - 3 && !G._skyFall && !dlg.open){
    P.story.skyVathTaunt=1;
    skyVathTaunt();
    return;
  }
  // ---- ROAMING ROAD-SHADES ----
  // While a shade isn't hunting you, it drifts slowly up and down its stretch of road by
  // easing its home-anchor between two posts; the generic idle-wander/leash then carries it
  // along. Once it gives chase the generic AI takes over (skipped here).
  for(const m of G.mobs){
    if(m.dead || !m.roadwraith || m.state==='chase') continue;
    m.patT=(m.patT||0)+dt*(m.patSpd||0.18);
    const t=Math.sin(m.patT)*0.5+0.5;
    m.hx=lerp(m.pax,m.pbx,t); m.hy=lerp(m.pay,m.pby,t);
  }
  if(!G._roadHint){
    for(const m of G.mobs){
      if(!m.dead && m.roadwraith && m.state==='chase' && dist(P.x,P.y,m.x,m.y)<7){
        G._roadHint=1;
        toast('A <b>drifting shade</b> peels off the rainbow road and comes for you. The storm scattered them the length of the run - cut through them as you climb.',4600);
        break;
      }
    }
  }
  // ---- THE FADING RAINBOW BRIDGE (i2 -> i3) ----
  if(G._skyFade && !P.story.skyG2){
    G._skyFadeT=(G._skyFadeT||0)+dt;
    // a one-time nudge on first approach
    if(!G._fadeHint && dist(P.x,P.y,76,112)<7){ G._fadeHint=1;
      toast('<b>The Rainbow Bridge fades in and out.</b> Cross while the tiles are lit - step on a faded one and you drop through the cloud. Time your steps to the wave; each band holds only a moment.',6000); }
    // dropped through a faded tile -> back to i2 to try the crossing again. A short GRACE
    // means a tile fading out from under you doesn't drop you the instant it flickers - you
    // get a beat to step or dash clear (paired with the amber "about to fade" warning). This
    // is what made the crossing feel like it dropped you at random.
    if(!P.dead && (P.rollT||0)<=0){
      const f=G._skyFade.tiles.find(t=>Math.floor(t.x)===Math.floor(P.x) && Math.floor(t.y)===Math.floor(P.y));
      if(f && !skyFadeSolid(f)){
        G._fadeGrace=(G._fadeGrace||0)+dt;
        if(G._fadeGrace>0.45){
          G._fadeGrace=0;
          let hint=''; if(!G._fadeFellHint){ G._fadeFellHint=1; hint='You lingered too long on a fading tile and the wind bore you back to the isle. <b>Follow the lit wave</b> across - step off a tile the moment it flickers amber.'; }
          skyFallStart(G._skyFade.entryX, G._skyFade.entryY, hint);
          return;
        }
      } else { G._fadeGrace=0; }
    }
    // reached the far isle - the bridge is behind you, the road opens on
    if(dist(P.x,P.y, skyIsle('i3').x, skyIsle('i3').y) < skyIsle('i3').r-0.5){
      P.story.skyG2=1; if(Snd.quest) Snd.quest();
      banner('THE RAINBOW BRIDGE IS CROSSED','THE ROAD RUNS ON');
      if(typeof autoSave==='function') autoSave();
    }
  }

  // P1 / P5 - open the perch-gate once the wraiths are all felled
  if(!P.story.skyG1 && G.mobs.filter(m=>m.puzzle===1 && !m.dead).length===0){
    P.story.skyG1=1; openSkyGate('g1');
    banner('THE PERCH IS CLEARED','THE WIND-WARD PARTS');
    if(typeof autoSave==='function') autoSave();
  }
  if(!P.story.skyG5 && P.story.skyG4 && G.mobs.filter(m=>m.puzzle===5 && !m.dead).length===0){
    P.story.skyG5=1; openSkyGate('g5');
    banner('THE SECOND PERCH IS CLEARED','THE LAST WIND-WARD PARTS');
    toast('Three more shades gone to mist, and the final wind-ward parts. Only the <b>Broken Crown</b> lies ahead now.',4600);
    if(typeof autoSave==='function') autoSave();
  }
  // P3 - the cloud-snatcher: leashed to its isle, and a touch throws you back to the landing
  for(const m of G.mobs){
    if(m.dead || !m.grabber) continue;
    const d=dist(m.x,m.y,m.gcx,m.gcy);
    if(d>m.gr){ m.x=m.gcx+(m.x-m.gcx)/d*m.gr; m.y=m.gcy+(m.y-m.gcy)/d*m.gr; m.tx=null; } // cannot leave its isle
    // it only grabs at point-blank (and never mid-stun) - so a dash-juke or a sword-stun slips you past
    if(!P.dead && (P.rollT||0)<=0 && (m.stunT||0)<=0 && dist(P.x,P.y,m.x,m.y)<0.6 && (G.time-(m._grabT||0))>0.7){
      m._grabT=G.time;
      const st=skyIsle('start');
      if(Snd.boss) Snd.boss(); G.shake=0.6; buzz(24);
      burst(P.x,P.y-0.5,'#bcd8ff',18,2.6); shockwave(P.x,P.y,'rgba(160,200,255,0.8)',40);
      P.x=st.x+0.5; P.y=st.y+2.5; P.click=null; P.moving=false;
      G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
      shockwave(P.x,P.y,'rgba(160,200,255,0.8)',40);
      toast('The <b>cloud-snatcher</b> closes a cold grip on you and hurls you back down the rainbow road to the landing. <i>It cannot leave its isle - time your run and slip past.</i>',5200);
    }
  }
  updateStormWraith(dt);
  updateStormEye(dt);
  collectStormBead();
}

/* ---------- the Storm-Wraith's snap: a telegraphed lunge you dash out of. If it lands,
   it STUNS you and immediately smacks you a second time - so read the wind-up and roll. */
function updateStormWraith(dt){
  const m=G.mobs.find(x=>x.skyminiboss && !x.dead); if(!m) return;
  m.spT=(m.spT||3.0)-dt;
  // a queued follow-up smack after a landed stun
  if(m.followT>0){ m.followT-=dt;
    if(m.followT<=0 && !P.dead && dist(P.x,P.y,m.x,m.y)<2.2){
      hurtPlayer(Math.round(m.dmg*1.1), m);
      burst(P.x,P.y-0.4,'#c9b0ff',14,2.4); shockwave(m.x,m.y,'rgba(190,170,255,0.7)',24); G.shake=0.4;
    }
  }
  if(m.tele>0){                            // winding up: it hangs, crackling, then lunges
    m.tele-=dt; m.windup=0;
    // telegraph: sparks streak along the aim line so you can read the lunge and roll clear
    const f=1-(m.tele/0.62), px=m.x+(m.lx-m.x)*f, py=m.y+(m.ly-m.y)*f;
    G.parts.push({x:px,y:py,vx:0,vy:0,life:0.22,color:'rgba(200,170,255,0.85)',size:3.2,grav:0});
    if(m.tele<=0){ const l=Math.hypot(m.lx-m.x,m.ly-m.y)||1;
      m.lungeVX=(m.lx-m.x)/l; m.lungeVY=(m.ly-m.y)/l; m.lunge=0.42; if(Snd.boss) Snd.boss(); }
    return;
  }
  if(m.lunge>0){                           // the lunge itself - a fast straight dart
    m.lunge-=dt;
    moveEntity(m, m.lungeVX*9*dt, m.lungeVY*9*dt);
    burst(m.x,m.y-0.3,'rgba(190,170,255,0.6)',2,1.6);
    if(!P.dead && (P.rollT||0)<=0 && (m.stunT||0)<=0 && (P.stunT||0)<=0 && dist(P.x,P.y,m.x,m.y)<1.05){
      m.lunge=0;
      stunPlayer(1.0);                     // caught: dazed...
      hurtPlayer(m.dmg, m);
      m.followT=0.55;                      // ...then a follow-up smack lands while you're reeling
    }
    return;
  }
  // ready another lunge once it's close enough and off cooldown (never mid-stun)
  if(m.spT<=0 && (m.stunT||0)<=0 && dist(P.x,P.y,m.x,m.y)<8 && !P.dead){
    m.spT=3.4; m.tele=0.62; m.lx=P.x; m.ly=P.y;   // telegraph aims where you stand NOW - keep moving
    shockwave(m.x,m.y,'rgba(190,170,255,0.5)',18);
  }
}

/* pick up the Storm-Wraith's dropped stormlight bead: grants the stun, briefly, and
   nudges you to try it (replaces the old wall of text). */
function collectStormBead(){
  const b=G.decor.find(d=>d.kind==='stormbead'); if(!b) return;
  if(P.dead || dist(P.x,P.y,b.x,b.y)>0.9) return;
  G.decor=G.decor.filter(d=>d!==b);
  P.spells=P.spells||{}; P.spells.stun=1;
  if(typeof give==='function') give('stormrune',1);
  // The Snare is a MID-road prize, not the finish: it arms your bolts with the snare and
  // opens the wind-ward on to the last isles. The road ends only when the STORM-EYE
  // itself falls on the Broken Crown (see killMob's skyfinalboss branch) - that is what
  // calms the wind, wins the stormsail, and opens The Leap.
  P.story=P.story||{}; P.story.skyG4=1;
  if(typeof openSkyGate==='function') openSkyGate('g4');
  if(Snd.magic) Snd.magic(); burst(P.x,P.y-0.5,'#c9b0ff',22,2.6);
  banner('THE SNARE','YOUR BOLTS NOW SNARE FOES - PRESS ON TO THE STORM-EYE');
  if(typeof autoSave==='function') autoSave();
  storyCard('<b style="color:#c9b0ff">The snare-spark sinks into your staff - your magic bolts now SNARE, catching a foe fast where it stands.</b><br><br><i>But the wind still howls off the crown above, and the little bird wheels north toward it - toward the great unblinking eye of the storm.</i><br><br>Cross the last wind-wards, clear the Second Perch, and put out <b style="color:#c9b0ff">THE STORM-EYE</b> on the Broken Crown. That is what calms the sky and opens <b>The Leap</b> home.',
    {label:'OK'});
}

/* ---------- THE STORM-EYE (final boss) ----------
   A shielded storm-core that hovers over the Broken Crown. It cannot be struck while
   its shield holds; instead it spits GALE-WISPS - little dodge-only fliers you cannot
   hit, only sidestep. Every few beats it DISCHARGES: a telegraphed wind-up, then a
   dodgeable shockwave - and for that beat its shield is DOWN. Strike it only then. */
function spawnGaleWisp(m){
  // darts straight at where you stand, then flies on past - so you dodge to the side
  const dx=P.x-m.x, dy=(P.y-0.3)-(m.y-0.6), l=Math.hypot(dx,dy)||1, sp=6.2;
  G.projs.push({kind:'galewisp', x:m.x, y:m.y-0.6, vx:dx/l*sp, vy:dy/l*sp, life:2.6,
    dmg:Math.round(m.dmg*0.7), from:'mob', ph:Math.random()*TAU});
}
function updateStormEye(dt){
  const m=G.mobs.find(x=>x.stormeye && !x.dead); if(!m) return;
  const s=skyIsle('i6');
  m.float=(m.float||0)+dt;
  // gentle hover, drifting back over its isle centre
  const hx=s.x, hy=s.y-1, dxh=hx-m.x, dyh=hy-m.y, lh=Math.hypot(dxh,dyh);
  if(lh>0.05) moveEntity(m, dxh*Math.min(1,dt*1.5), dyh*Math.min(1,dt*1.5));
  m.eyeT=(m.eyeT||2.5)-dt;
  if(m.eyeState==='hover'){
    m.invuln=1;
    // spit a wisp every ~1.1s
    m.wispT=(m.wispT||1.1)-dt;
    if(m.wispT<=0 && !P.dead && dist(P.x,P.y,m.x,m.y)<22){ m.wispT=1.05; spawnGaleWisp(m);
      if(Snd.tone) Snd.tone(300,0.06,'sawtooth',0.02,120); }
    if(m.eyeT<=0){ m.eyeState='charge'; m.eyeT=1.0; shockwave(m.x,m.y,'rgba(120,200,255,0.5)',26); if(Snd.boss) Snd.boss(); }
  } else if(m.eyeState==='charge'){
    // telegraphed discharge wind-up: it swells and its eye splits open - shield still up
    m.invuln=1;
    if(m.eyeT<=0){
      m.eyeState='open'; m.eyeT=2.6; m.invuln=0;      // SHIELD DOWN - your window
      shockwave(m.x,m.y,'rgba(180,230,255,0.9)',64); G.shake=0.6;
      // the discharge is a dodgeable ring: knock/hurt only if you're close and not rolling
      if(!P.dead && (P.rollT||0)<=0 && dist(P.x,P.y,m.x,m.y)<3.4){ hurtPlayer(Math.round(m.dmg*1.1), m); }
      for(let k=0;k<10;k++) burst(m.x+rnd(-1.5,1.5), m.y+rnd(-1,1), 'hsl('+(rnd(180,220)|0)+',90%,72%)', 8, 2.4);
    }
  } else { // 'open' - vulnerable, briefly, then re-shield
    m.invuln=0;
    if(m.eyeT<=0){ m.eyeState='hover'; m.eyeT=rnd(3.2,4.4); m.invuln=1;
      burst(m.x,m.y-0.4,'rgba(120,200,255,0.7)',10,2); }
  }
}

/* ---------- Vath's taunt on the rainbow road ----------
   Not a fight - a violet apparition that mocks you for sparing the Sunward dragon,
   then frays apart on the wind. Fires once, deep in the run (see updateSkyDungeon). */
function skyVathTaunt(){
  if(Snd.boss) Snd.boss(); G.shake=0.4;
  const ax=P.x, ay=P.y-3.2;
  if(typeof shockwave==='function') shockwave(ax,ay,'rgba(160,110,240,0.85)',46);
  for(let i=0;i<20;i++){ const a=Math.random()*TAU, s=rnd(1,3.4);
    G.parts.push({x:ax,y:ay,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.5,life:rnd(0.6,1.4),color:'#c77bff',size:rnd(2,4),grav:-0.02}); }
  // a FLOATING violet apparition of Vath - not a fight, a spirit you trade words with. It
  // hangs on the wind ahead, you tap through his taunt, and then it frays apart and vanishes.
  const ghost={kind:'vathghost', x:ax, y:ay, born:G.time};
  G.decor.push(ghost);
  const disperse=()=>{
    closeDialog();
    if(typeof shockwave==='function') shockwave(ghost.x,ghost.y,'rgba(200,170,255,0.7)',40);
    for(let i=0;i<34;i++){ const a=Math.random()*TAU, s=rnd(1.5,5);
      G.parts.push({x:ghost.x,y:ghost.y-0.6,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.7,life:rnd(0.7,1.7),color:Math.random()<0.5?'#c77bff':'#9a6ad0',size:rnd(2,4.5),grav:-0.03}); }
    G.decor=G.decor.filter(d=>d!==ghost);
    if(Snd.magic) Snd.magic();
  };
  P.click=null; P.moving=false;
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='Vath';
  vathGhostPortrait();
  const p3=()=>{ setDialog('<b style="color:#c9a0ff">"No matter. The high wind will wear you thin where I need not lift a hand."</b> <i>The violet frays apart on the gale.</i>',
    [{label:'…', cls:'gold', fn:disperse}]); };
  const p2=()=>{ setDialog('<b style="color:#c9a0ff">"You should have slain that wretched dragon when I bade you. But you never do listen, do you?"</b> <i>The apparition drifts a little closer, patient as a spider on the wind.</i>',
    [{label:'I don\'t take orders from a ghost.', fn:p3}]); };
  setDialog('<i>The rainbow dims. A knot of violet gathers on the wind ahead of you and unspools into a shape you know too well - Vath, or the ghost of him, hanging in the air with that patient half-smile.</i> <b style="color:#c9a0ff">"…Up here, of all places. You ARE a busy little tide."</b>',
    [{label:'What do you want, Vath?', fn:p2}]);
}
function vathGhostPortrait(){
  const el=document.getElementById('dportrait'); if(!el) return;
  const pg=el.getContext('2d'); if(!pg) return;
  pg.fillStyle='#1a1226'; pg.fillRect(0,0,72,72);
  const rg=pg.createRadialGradient(36,32,4,36,36,42); rg.addColorStop(0,'rgba(180,130,240,0.55)'); rg.addColorStop(1,'rgba(90,60,140,0)');
  pg.fillStyle=rg; pg.fillRect(0,0,72,72);
  pg.save(); pg.translate(36,40);
  pg.fillStyle='rgba(74,42,94,0.94)'; pg.beginPath(); pg.moveTo(0,-24); pg.quadraticCurveTo(-21,-16,-16,22); pg.lineTo(16,22); pg.quadraticCurveTo(21,-16,0,-24); pg.closePath(); pg.fill(); // hooded robe
  pg.fillStyle='#2a1c3a'; pg.beginPath(); pg.ellipse(0,-6,9,11,0,0,TAU); pg.fill();   // shadowed face
  pg.fillStyle='rgba(200,150,255,0.5)'; pg.beginPath(); pg.arc(-4,-7,3.6,0,TAU); pg.arc(4,-7,3.6,0,TAU); pg.fill();   // eye-glow
  pg.fillStyle='#e0b0ff'; pg.beginPath(); pg.arc(-4,-7,1.8,0,TAU); pg.arc(4,-7,1.8,0,TAU); pg.fill();
  pg.restore();
}
/* ---------- entering / leaving from the Cloudreach ---------- */
function skyBirdPortrait(){
  const pg=document.getElementById('dportrait').getContext('2d');
  pg.fillStyle='#1a2a3a'; pg.fillRect(0,0,72,72);
  const rg=pg.createRadialGradient(36,30,4,36,36,40); rg.addColorStop(0,'#bfe0ff'); rg.addColorStop(1,'rgba(120,160,220,0)');
  pg.fillStyle=rg; pg.fillRect(0,0,72,72);
  // a small bright bird
  pg.save(); pg.translate(36,42);
  pg.fillStyle='#4aa0e0'; pg.beginPath(); pg.ellipse(0,0,15,11,0,0,TAU); pg.fill();        // body
  pg.fillStyle='#7fd0ff'; pg.beginPath(); pg.ellipse(-3,-2,9,7,0,0,TAU); pg.fill();          // breast
  pg.fillStyle='#3a86c8'; pg.beginPath(); pg.ellipse(-13,-9,9,6,-0.5,0,TAU); pg.fill();       // head
  pg.fillStyle='#ffcf5a'; pg.beginPath(); pg.moveTo(-21,-10); pg.lineTo(-27,-8); pg.lineTo(-21,-6); pg.closePath(); pg.fill(); // beak
  pg.fillStyle='#0a1420'; pg.beginPath(); pg.arc(-15,-10,1.6,0,TAU); pg.fill();               // eye
  pg.fillStyle='#2f6fae'; pg.beginPath(); pg.moveTo(4,-2); pg.quadraticCurveTo(20,-14,16,4); pg.quadraticCurveTo(10,2,4,2); pg.closePath(); pg.fill(); // wing
  pg.restore();
}
function skyBirdDialog(){
  P.click=null; dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='The Wind-Lost Bird';
  skyBirdPortrait();
  const inDungeon2 = (G.worldId==='skydungeon');
  if(inDungeon2){
    setDialog('<i>The little bird ruffles at the rainbow\'s edge.</i> Had enough of the high road? I\'ll carry you back down to the Cloudreach - the rainbow keeps its shape, so your progress waits for you here.',
      [ {label:'Fly back down to the Cloudreach', cls:'gold', fn:()=>{ closeDialog(); exitSkyDungeon(); }},
        {label:'Not yet', ghost:true, fn:closeDialog} ]);
    return;
  }
  if(P.story && P.story.skyDungeonDone){
    setDialog('<i>The bird wheels a happy loop before landing.</i> The high wind runs sweet again - I glide down to my little islands whenever I please, and it\'s all your doing. Ride the rainbow any time you miss the view.',
      [ {label:'Walk the rainbow road', cls:'gold', fn:()=>{ closeDialog(); enterSkyDungeon(); }},
        {label:'Farewell', ghost:true, fn:closeDialog} ]);
    return;
  }
  const accept=()=>{
    P.story=P.story||{}; P.story.birdQuest=1;
    setDialog('<i>The bird beats up onto a rising ribbon of colour that was not there a moment ago.</i> Oh, thank you! Follow me, then - up the rainbow road. Step onto it when you\'re ready, and stay close.',
      [ {label:'Onto the rainbow road', cls:'gold', fn:()=>{ closeDialog(); enterSkyDungeon(); }},
        {label:'In a moment', ghost:true, fn:closeDialog} ]);
    if(Snd.quest) Snd.quest();
    if(typeof autoSave==='function') autoSave();
  };
  setDialog('<i>A bright little bird flutters down, feathers stormtossed.</i> Traveler! The high wind has turned cruel and blows me clean off course before I can reach my little islands - and I cannot set it right on my own. <b>Will you help me?</b>',
    [ {label:'I\'ll help', cls:'gold', fn:accept},
      {label:'Maybe later', ghost:true, fn:closeDialog} ]);
}
function skyBirdSpeak(){ skyBirdDialog(); }
function enterSkyDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1;
  if(Snd.boss) Snd.boss();
  P._skyReturn={x:P.x, y:P.y}; P.click=null; P.moving=false;
  toast('The bird springs onto a rising ribbon of colour and you run out after her - onto a <b>rainbow road</b> laid across the open cloud, six tiny isles glinting away into the blue above.',5200);
  setTimeout(()=>{ try{ switchWorld('skydungeon'); if(typeof autoSave==='function') autoSave();
      banner('THE RAINBOW ROAD','SIX ISLES, AND A SOURED WIND');
    } finally { setTimeout(()=>{ if(fd) fd.style.opacity=0; G._flying=0; G._flyUntil=0; },240); } }, 1000);
}
function exitSkyDungeon(){
  const fd=document.getElementById('fadeOv'); if(fd) fd.style.opacity=1;
  if(Snd.step) Snd.step(8); P.click=null;
  setTimeout(()=>{ switchWorld('sky');
    const r=P._skyReturn; if(r){ P.x=r.x; P.y=r.y; } else { const Z=SKY_ZONES; P.x=Z.landing.x+0.5; P.y=Z.landing.y+3.5; }
    G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
    if(fd) setTimeout(()=>{ fd.style.opacity=0; },220); }, 300);
}
/* after the Storm-Eye falls: mend the hero and set them at the landing */
function offerSkyReturn(){
  if(G.state!=='play' || P.dead || G.worldId!=='skydungeon' || dlg.open) return;
  const st=skyIsle('start');
  dlg.open=true; dlg.npc=null;
  document.getElementById('dialog').style.display='block';
  document.getElementById('dname').textContent='The Wind Calms';
  skyBirdPortrait();
  setDialog('The wind calms and the rainbow runs clear. Rest at the landing - healed and a level stronger?',
    [ {label:'Rest at the landing', cls:'gold', fn:()=>{
        closeDialog();
        P.hp=P.maxhp; P.mp=P.maxmp;
        if(typeof gainLXP==='function' && typeof xpForP==='function') gainLXP(xpForP(P.level));
        P.x=st.x+0.5; P.y=st.y+2.5; P.click=null; P.moving=false;
        G.cam.x=isoX(P.x,P.y)-VW/2; G.cam.y=isoY(P.x,P.y)-VH/2-20;
        burst(P.x,P.y-0.5,'#c9b0ff',20,2); if(Snd.magic) Snd.magic();
        toast('The bird waits at the landing to fly you down whenever you\'re ready.',3800);
      }},
      {label:'Stay a while', ghost:true, fn:closeDialog} ]);
}
