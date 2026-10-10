import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPoint, parseMapPoint, placeMapHtml } from '../utils/placeMap';

interface Props { mapsUrl?: string; placeId?: string; latitude?: number; longitude?: number; venue?: string; address?: string; city?: string; selectable?: boolean; onSelect?: (point: MapPoint) => void; }
export default function PlaceMap({ latitude, longitude, selectable = false, onSelect }: Props) {
 const [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
 const frame = useRef<HTMLIFrameElement | null>(null);
 const html = useMemo(() => placeMapHtml(latitude, longitude, selectable), [latitude, longitude, selectable, retry]);
 useEffect(() => setFailed(false), [latitude, longitude, retry]);
 const receive = (data: unknown) => {
  let message: any;
  try { message = typeof data === 'string' ? JSON.parse(data) : data; } catch { return; }
  if (message?.type === 'map-error') { setFailed(true); return; }
  const point = parseMapPoint(message);
  if (point && selectable) onSelect?.(point);
 };
 useEffect(() => {
  if (Platform.OS !== 'web') return;
  const handler = (event: MessageEvent) => { if (event.source === frame.current?.contentWindow) receive(event.data); };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
 }, [onSelect, selectable]);
 if (failed) return <View style={{ flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
  <Text style={{ textAlign: 'center', color: '#152018' }}>Map unavailable. Check your internet connection.</Text>
  <Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={{ padding: 14 }}><Text style={{ color: '#0B7A3E', fontWeight: '700' }}>Retry map</Text></Pressable>
 </View>;
 if (Platform.OS === 'web') return React.createElement('iframe', { ref: frame, srcDoc: html, title: selectable ? 'Choose venue pin' : 'Event venue map', width: '100%', height: '100%', style: { border: 0, minHeight: 200 }, referrerPolicy: 'strict-origin-when-cross-origin' });
 return <WebView key={retry} style={{ flex: 1, width: '100%', minHeight: 200 }} source={{ html }}
  applicationNameForUserAgent="LankaFestConnect/0.1" cacheEnabled javaScriptEnabled domStorageEnabled
  onMessage={event => receive(event.nativeEvent.data)} onError={() => setFailed(true)} onHttpError={() => setFailed(true)} />;
}
