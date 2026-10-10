export interface MapPoint { latitude: number; longitude: number; }
export function parseMapPoint(data: unknown): MapPoint | null {
 try {
  const value = typeof data === 'string' ? JSON.parse(data) : data;
  if (!value || value.type !== 'venue-pin' || typeof value.latitude !== 'number' || typeof value.longitude !== 'number'
    || !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude) || Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180) return null;
  return { latitude: value.latitude, longitude: value.longitude };
 } catch { return null; }
}

export function placeMapHtml(latitude?: number, longitude?: number, selectable = false): string {
 const selected = typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
 const config = JSON.stringify({ latitude: selected ? latitude : 7.8, longitude: selected ? longitude : 80.7, selected, selectable });
 return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;width:100%;margin:0}body{font-family:system-ui;background:#edf3ed}.pin{width:22px;height:22px;background:#0B7A3E;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px #0005}.leaflet-control-attribution{font-size:10px}#error{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:#edf3ed;z-index:1001;text-align:center;color:#152018}</style></head>
<body><div id="map" aria-label="Event venue map"></div><div id="error">Map unavailable. Check your connection and retry.</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
(function(){
 const config = ${config};
 function send(value){const data=JSON.stringify(value);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(data);else window.parent.postMessage(data,'*');}
 if(!window.L){document.getElementById('error').style.display='flex';send({type:'map-error'});return;}
 const map=L.map('map').setView([config.latitude,config.longitude],config.selected?16:7);
 let errors=0;
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'}).addTo(map);
 tiles.on('tileerror',function(){if(++errors>=4)send({type:'map-error'});});
 const icon=L.divIcon({className:'',html:'<div class="pin"></div>',iconSize:[28,28],iconAnchor:[14,14]});
 let marker=config.selected?L.marker([config.latitude,config.longitude],{icon:icon,draggable:config.selectable}).addTo(map):null;
 function report(point){send({type:'venue-pin',latitude:point.lat,longitude:point.lng});}
 function attachDrag(){marker.on('dragend',function(){report(marker.getLatLng());});}
 if(marker&&config.selectable)attachDrag();
 if(config.selectable)map.on('click',function(event){if(marker)marker.setLatLng(event.latlng);else{marker=L.marker(event.latlng,{icon:icon,draggable:true}).addTo(map);attachDrag();}report(event.latlng);});
 setTimeout(function(){map.invalidateSize();},100);
})();</script></body></html>`;
}
