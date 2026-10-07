import { useEffect } from 'react';
import { BackHandler } from 'react-native';
// Keep Android's Back button consistent with the visible step Back button.
export default function useStepBack(back: () => void) {
 useEffect(() => { const listener = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; }); return () => listener.remove(); }, [back]);
}
