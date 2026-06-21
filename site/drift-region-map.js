(function(){
  const REGION_MAP_BOUNDS = {
    china: { x: 73, y: 17, width: 63, height: 38, padding: 20 },
    asia: { x: 20, y: -8, width: 145, height: 86, padding: 18 },
    europe: { x: -24, y: 34.5, width: 79, height: 36.5, padding: 24 },
    africa: { x: -18, y: -35, width: 69, height: 71, padding: 26 },
    northAmerica: { x: -168, y: 8, width: 115, height: 68, padding: 28 },
    southAmerica: { x: -81, y: -56, width: 46, height: 68, padding: 28 },
    oceania: { x: 113, y: -47, width: 67, height: 47, padding: 30 },
    antarctica: { x: -180, y: -85, width: 360, height: 23, padding: 18 }
  };
  const REGION_PAGES = {
    china: new Set(['guangzhou.html','beijing.html','chongqing.html','hangzhou.html','suzhou.html','shaoxing.html','lijiang.html','dali.html','taiwan.html','altay.html']),
    asia: new Set(['china.html','japan.html','korea.html','singapore.html','thailand.html','guangzhou.html','beijing.html','chongqing.html','hangzhou.html','suzhou.html','shaoxing.html','lijiang.html','dali.html','taiwan.html','altay.html']),
    europe: new Set(['UK.html','france.html','italy.html','vatican.html','spain.html','switzerland.html','austria.html','denmark.html','serbia.html']),
    africa: new Set(['tanzania.html','egypt.html']),
    northAmerica: new Set(['canada.html','usa.html']),
    southAmerica: new Set(['brazil.html']),
    oceania: new Set(['australia.html']),
    antarctica: new Set()
  };
  const SHAPES = {
    northAmerica: [[[65,-168],[69,-164],[71,-156],[71,-141],[73,-130],[76,-118],[76,-94],[74,-83],[70,-72],[64,-64],[58,-57],[52,-55],[47,-53],[44,-59],[43,-66],[41,-70],[37,-75],[33,-78],[30,-81],[25,-80],[25,-84],[29,-89],[30,-92],[29,-95],[26,-97],[22,-98],[19,-96],[17,-91],[15,-88],[11,-84],[9,-80],[8,-77],[16,-96],[20,-105],[23,-110],[28,-114],[32,-117],[37,-122],[43,-125],[47,-124],[49,-127],[55,-132],[58,-137],[60,-149],[62,-155],[63,-163],[65,-168]]],
    southAmerica: [[[12,-72],[11,-74],[9,-77],[8,-77],[11,-71],[11,-67],[10,-62],[8,-58],[5,-53],[2,-50],[0,-49],[-2,-44],[-5,-35],[-8,-35],[-13,-38],[-18,-40],[-23,-43],[-28,-48],[-33,-53],[-38,-58],[-42,-63],[-46,-66],[-50,-68],[-53,-69],[-55,-67],[-56,-66],[-54,-72],[-51,-75],[-47,-76],[-43,-74],[-38,-74],[-33,-72],[-27,-71],[-22,-70],[-18,-71],[-14,-76],[-10,-78],[-5,-81],[-2,-80],[1,-78],[5,-77],[8,-77],[10,-76],[12,-72]]],
    europe: [[[71,28],[69,36],[67,42],[64,45],[60,50],[56,55],[53,53],[50,50],[47,46],[44,43],[41,29],[39,26],[38,24],[37,23],[36,22],[36,18],[37,14],[38,10],[38,7],[37,2],[36,-2],[36,-6],[37,-9],[37,-10],[38.5,-10],[40,-10],[42,-9.5],[44,-9.5],[44,-2],[47,-2],[48,-5],[49,-2],[51,2],[54,8],[55,8],[57,10],[59,5],[62,5],[66,14],[69,20],[71,28]],[[49,-6],[50,-3],[51,2],[53,1],[54,0],[55,-1],[57,-2],[58,-3],[59,-3],[58,-5],[58,-7],[57,-8],[56,-8],[55.5,-10],[54.5,-10.5],[53.5,-10.5],[52.5,-10.5],[51.5,-10.5],[51,-10],[51,-9],[49,-6]],[[64,-24],[66,-20],[66,-15],[64,-13],[63,-18],[63,-24],[64,-24]],[[34.8,23.5],[35.5,24],[35.5,26.5],[35,26.5],[34.5,25],[34.8,23.5]]],
    africa: [[[36,-6],[36,-2],[37,2],[38,7],[38,10],[37,12],[35,11],[33,12],[32,18],[31.5,25],[31.5,30],[31,34],[28,33.5],[24,35.5],[22,37],[18,39],[15,43],[12.5,44.5],[11.5,44.5],[11,49],[10,51],[5,49],[1,43],[-4,41],[-7,41],[-12,42],[-17,38],[-24,37],[-29,33],[-35,27],[-35,18],[-30,15],[-23,13],[-17,11],[-6,12],[-5,8.5],[0,8],[4,6],[5,2],[6,-3],[5,-9],[8,-15],[11,-17.5],[15,-18],[21,-18],[27,-14],[33,-9],[36,-6]],[[-11.5,49],[-16,50.5],[-20,48.5],[-24,47.5],[-26,47.5],[-24,43.5],[-20,43.5],[-16,45],[-11.5,49]]],
    asia: [[[41,29],[44,43],[47,46],[50,50],[53,53],[56,55],[60,50],[64,45],[67,42],[69,50],[70,55],[73,65],[76,80],[77,100],[75,115],[73,130],[71,145],[72,152],[71,165],[70,178],[69,180],[66,180],[64,178],[62,173],[62,165],[56,162],[52,155],[50,153],[47,143],[46,140],[44,136],[43,133],[42.5,131],[41,130],[39,129.5],[37,129.5],[35.5,129.5],[34,129],[34,127],[34,126],[35,125.5],[37,126],[38,125.5],[39.5,124.5],[40,124],[39,122.5],[38,122],[36,121],[34,120.5],[32,122],[30,122.5],[28,121],[25,119.5],[22,114.5],[21,110.5],[18,109.5],[16,109.5],[12,109.5],[10,108],[8,107],[6,106],[3,105],[1.5,104.5],[1,104],[1,103.5],[3,101],[6,99],[8,97.5],[10,98.5],[13,98.5],[15,97.5],[16,97],[17,94.5],[19,93.5],[21,92.5],[22,92],[22,88],[20,86],[18,83.5],[16,81.5],[13,79.5],[10,79],[8,76.5],[6.5,75.5],[8,74.5],[10,75.5],[15,73],[20,72.5],[22,69],[25,66.5],[25.5,63],[25.5,60],[26.5,57],[24,58],[22,59.5],[18,55],[15,51],[13,47],[12.5,45],[12.5,44.5],[15,43],[18,41],[21,39.5],[24,37.5],[27,36],[29.5,35],[31,34],[32,35],[34,36],[36,36],[36,22],[37,23],[38,24],[39,26],[41,29]],[[6,94.5],[4,96.5],[2,98.5],[0,100],[-1.5,101.5],[-3,103.5],[-5.5,105],[-6.5,106.5],[-7.5,108.5],[-8,111],[-8,114],[-7.5,115],[-6,114],[-4.5,111],[-3.5,108],[-1.5,105],[0,104],[1,103.5],[3,101],[5,98],[6,94.5]],[[30,129],[32,129],[33,129.5],[34,130.5],[35,132],[36,134],[37,135.5],[38,137],[39,138.5],[40,138.5],[41,139],[42,139.5],[43,140],[45,141],[46,146],[44,146.5],[42,145],[41,143],[40,142],[39,142],[38,141],[37,140],[36,139],[35,138],[34,136],[33,135],[32,133],[31,132],[30,129]],[[21.5,119.5],[23,122],[25.5,122.5],[26,121.5],[24.5,120],[21.5,119.5]]],
    oceania: [[[-11,131],[-11.5,136],[-13,137],[-13,140],[-11,142],[-10,143],[-13.5,144],[-16,146],[-19,149],[-24,153],[-28,154],[-33,153],[-37,150],[-39,147],[-39,144],[-37,140],[-35,137],[-34,135],[-35,134],[-34,131],[-32,128],[-33,124],[-34,121],[-35,116],[-32,114],[-27,113],[-23,113.5],[-20,115.5],[-19,119],[-16,122],[-14,125],[-13,128],[-11,131]],[[-40,144],[-41,145],[-42,146.5],[-43.5,148],[-43.5,149],[-42,149],[-41,147.5],[-40,146],[-40,144]],[[-34,172],[-36,175],[-38,177],[-39,178],[-41,176],[-42,174],[-44,172],[-44,170],[-46,168],[-47,167],[-46,166],[-44,168],[-42,170],[-40,172],[-38,174],[-36,174],[-34,172]],[[-3,141],[-1,142],[0,143],[-1,145],[-3,148],[-5,150],[-6,152],[-7,155],[-6,156],[-8,155],[-9,153],[-10,151],[-9.5,148],[-8,145],[-5,142],[-3,141]]],
    antarctica: []
  };
  function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }
  function boundsFor(c){
    const b=REGION_MAP_BOUNDS[c];
    const pad=b.padding/111;
    const west=clamp(b.x-pad,-180,180);
    const east=clamp(b.x+b.width+pad,-180,180);
    const south=clamp(b.y-pad,-85,85);
    const north=clamp(b.y+b.height+pad,-85,85);
    return [[south,west],[north,east]];
  }
  function safeBoundsFor(c){ return L.latLngBounds(boundsFor(c)); }
  function clampMap(map, region){ map.panInsideBounds(safeBoundsFor(region), { animate:false }); }
  function clientPoint(e, el){ const r=el.getBoundingClientRect(); return L.point(e.clientX-r.left, e.clientY-r.top); }
  function getDistance(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }
  function getMidpoint(a,b){ return { clientX:(a.clientX+b.clientX)/2, clientY:(a.clientY+b.clientY)/2 }; }
  function installTouchGestures(card, map, region){
    const el=card.querySelector('.region-map-leaflet'); const inner=card.querySelector('.region-map-inner');
    if(!el || !window.PointerEvent) return;
    const pointers=new Map(); let lastPoint=null; let lastDistance=0; let raf=0;
    const minZoom=()=>map.getMinZoom(); const maxZoom=()=>map.getMaxZoom();
    const requestClamp=()=>{ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; clampMap(map, region); }); };
    const setDragging=(on)=>inner?.classList.toggle('is-dragging', on);
    const settle=()=>{ inner?.classList.remove('is-dragging'); inner?.classList.add('is-settling'); setTimeout(()=>inner?.classList.remove('is-settling'),430); };
    el.addEventListener('pointerdown', e=>{
      if(e.pointerType==='mouse' && e.button!==0) return;
      pointers.set(e.pointerId, e); el.setPointerCapture?.(e.pointerId); setDragging(true);
      if(pointers.size===1){ lastPoint={clientX:e.clientX, clientY:e.clientY}; }
      if(pointers.size===2){ const [a,b]=[...pointers.values()]; lastDistance=getDistance(a,b); lastPoint=null; }
      e.preventDefault();
    }, {passive:false});
    el.addEventListener('pointermove', e=>{
      if(!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, e);
      if(pointers.size===1){
        const p=[...pointers.values()][0]; if(lastPoint){ map.panBy([lastPoint.clientX-p.clientX, lastPoint.clientY-p.clientY], {animate:false}); requestClamp(); }
        lastPoint={clientX:p.clientX, clientY:p.clientY};
      } else {
        const [a,b]=[...pointers.values()]; const d=getDistance(a,b);
        if(lastDistance){ const mid=getMidpoint(a,b); const zoom=clamp(map.getZoom()+Math.log2(d/lastDistance), minZoom(), maxZoom()); map.setZoomAround(clientPoint(mid, el), zoom, {animate:false}); requestClamp(); }
        lastDistance=d;
      }
      e.preventDefault();
    }, {passive:false});
    const end=e=>{
      if(pointers.has(e.pointerId)){ pointers.delete(e.pointerId); el.releasePointerCapture?.(e.pointerId); }
      if(pointers.size===1){ const p=[...pointers.values()][0]; lastPoint={clientX:p.clientX, clientY:p.clientY}; lastDistance=0; }
      if(pointers.size===0){ lastPoint=null; lastDistance=0; clampMap(map, region); settle(); }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('pointerleave', e=>{ if(pointers.has(e.pointerId)) end(e); });
  }
  function icon(){ return L.divIcon({className:'drift-marker-shell',html:'<div class="drift-point"><span class="drift-point-halo"></span><span class="drift-point-core"></span></div>',iconSize:[20,20],iconAnchor:[10,10],popupAnchor:[0,-10]}); }
  function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
  function previews(items){ if(!items.length) return []; const n=clamp(items.length, Math.min(3, items.length), 5); return shuffle(items).slice(0,n); }
  function navigate(url){ document.body.classList.add('drift-region-leaving'); document.querySelector('.leaflet-popup.drift-preview')?.classList.add('is-picking-up'); setTimeout(()=>{ location.href=url; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 40 : 220); }
  function popup(point, imgs){ const images=imgs.length ? `<div class="drift-preview-images">${imgs.map(src=>`<a class="drift-preview-link" href="${esc(point.page)}" aria-label="Open ${esc(point.title)}"><img src="${esc(src)}" alt="${esc(point.title)}"></a>`).join('')}</div>` : '<p class="drift-preview-empty">Open this fragment</p>'; return `<div class="drift-preview-card"><h4><a class="drift-preview-title-link" href="${esc(point.page)}">${esc(point.title)}</a></h4>${images}</div>`; }
  async function init(card){
    if (!window.L) return; const region=card.dataset.region; const el=card.querySelector('.region-map-leaflet');
    const map=L.map(el,{zoomControl:false,attributionControl:false,scrollWheelZoom:false,touchZoom:true,dragging:true,doubleClickZoom:false,boxZoom:false,keyboard:false,zoomSnap:.1,zoomDelta:.55,maxBounds:safeBoundsFor(region),maxBoundsViscosity:1,worldCopyJump:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{subdomains:'abc', noWrap:true, maxNativeZoom:19, maxZoom:19}).addTo(map);
    (SHAPES[region] || []).forEach(s=>L.polygon(s,{color:'#9c6e6e',weight:1.35,fillColor:'#d8b7aa',fillOpacity:.14,interactive:false}).addTo(map));
    map.fitBounds(safeBoundsFor(region),{animate:false,padding:[12,12]}); map.setMinZoom(map.getBoundsZoom(safeBoundsFor(region),false)); map.setMaxZoom(map.getMinZoom()+1.38); map.setZoom(map.getMinZoom(),{animate:false}); clampMap(map, region);
    const [photosRes, markersRes]=await Promise.all([fetch('/photos.json'),fetch('/map-markers.json')]); const photos=await photosRes.json(); const markerData=await markersRes.json();
    const allowed=REGION_PAGES[region]||new Set(); let activeTouchPage=''; markerData.markers.filter(m=>allowed.has(m.page)).forEach(point=>{ const imgs=photos.items.filter(i=>i.page===point.page&&i.image).map(i=>i.image); const marker=L.marker([point.lat,point.lng],{icon:icon(),riseOnHover:true}).addTo(map); const pointEl=()=>marker.getElement()?.querySelector('.drift-point'); const refresh=()=>marker.setPopupContent(popup(point,previews(imgs))); marker.bindPopup(popup(point,previews(imgs)),{className:'drift-preview',closeButton:false,autoPan:true,keepInView:true}); marker.on('mouseover',()=>{ activeTouchPage=''; refresh(); marker.openPopup(); pointEl()?.classList.add('is-hovered'); }); marker.on('mouseout',()=>pointEl()?.classList.remove('is-hovered')); marker.on('popupopen',()=>pointEl()?.classList.add('is-active')); marker.on('popupclose',()=>pointEl()?.classList.remove('is-active')); marker.on('click',()=>{ if(matchMedia('(hover: hover) and (pointer: fine)').matches){ navigate(point.page); return; } if(activeTouchPage===point.page && marker.isPopupOpen()){ navigate(point.page); return; } activeTouchPage=point.page; refresh(); marker.openPopup(); }); });
    el.addEventListener('click',e=>{ const link=e.target.closest('.drift-preview-card a[href]'); if(!link) return; e.preventDefault(); e.stopPropagation(); navigate(link.getAttribute('href')); });
    const buttonZoom=delta=>{ map.setZoom(clamp(map.getZoom()+delta,map.getMinZoom(),map.getMaxZoom()),{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches}); setTimeout(()=>clampMap(map, region), 0); };
    card.querySelector('[data-region-map-zoom="in"]')?.addEventListener('click',()=>buttonZoom(.55));
    card.querySelector('[data-region-map-zoom="out"]')?.addEventListener('click',()=>buttonZoom(-.55));
    map.on('zoomend moveend',()=>clampMap(map, region));
    requestAnimationFrame(()=>card.classList.add('is-visible'));
  }
  window.REGION_MAP_BOUNDS=REGION_MAP_BOUNDS;
  document.addEventListener('click',e=>{ const link=e.target.closest('.leaflet-popup.drift-preview .drift-preview-card a[href]'); if(!link) return; e.preventDefault(); e.stopPropagation(); navigate(link.getAttribute('href')); });
  document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('.region-map-card[data-region]').forEach(init));
})();
