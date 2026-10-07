import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

// Static tourist support content for the Tourism Officer support desk.
// Phone numbers should be re-checked against official sources before release.

export interface Contact {
  id: string;
  name: string;
  detail: string;
  number: string;
  icon: IconName;
}

export const emergencyContacts: Contact[] = [
  { id: 'police', name: 'Police Emergency', detail: 'Crime, accidents and immediate danger', number: '119', icon: 'shield-outline' },
  { id: 'ambulance', name: 'Suwa Seriya Ambulance', detail: 'Free island-wide emergency ambulance', number: '1990', icon: 'medkit-outline' },
  { id: 'fire', name: 'Fire & Rescue', detail: 'Fire brigade and rescue services', number: '110', icon: 'flame-outline' },
  { id: 'tourism', name: 'Sri Lanka Tourism Hotline', detail: 'Tourist information and complaints (SLTDA)', number: '1912', icon: 'call-outline' },
  { id: 'tourist-police', name: 'Tourist Police (Colombo)', detail: 'Police unit assisting foreign visitors', number: '+94112421052', icon: 'person-outline' },
  { id: 'disaster', name: 'Disaster Management Centre', detail: 'Floods, landslides and severe weather', number: '117', icon: 'thunderstorm-outline' },
];

export interface Place {
  id: string;
  name: string;
  type: string;
  description: string;
  query: string;
}

export const places: Place[] = [
  { id: 'sigiriya', name: 'Sigiriya Rock Fortress', type: 'UNESCO Heritage Site • Matale', description: '5th-century rock fortress with frescoes and water gardens. Tickets at the site; climb early to avoid heat.', query: 'Sigiriya Rock Fortress' },
  { id: 'tooth', name: 'Temple of the Sacred Tooth Relic', type: 'Sacred Site • Kandy', description: 'Home of the Esala Perahera. Modest dress required; shoes are left at the entrance.', query: 'Temple of the Sacred Tooth Relic Kandy' },
  { id: 'galle', name: 'Galle Fort', type: 'UNESCO Heritage Site • Galle', description: 'Dutch-era fortified old town with the lighthouse, ramparts and cafés. Best explored on foot.', query: 'Galle Fort' },
  { id: 'anuradhapura', name: 'Sacred City of Anuradhapura', type: 'UNESCO Heritage Site • Anuradhapura', description: 'Ancient capital with stupas and the Sri Maha Bodhi tree. Wear white or light clothing at sacred areas.', query: 'Anuradhapura Sacred City' },
  { id: 'polonnaruwa', name: 'Ancient City of Polonnaruwa', type: 'UNESCO Heritage Site • Polonnaruwa', description: 'Medieval royal capital with the Gal Vihara rock statues. Cycling between ruins is popular.', query: 'Polonnaruwa Ancient City' },
  { id: 'dambulla', name: 'Dambulla Cave Temple', type: 'UNESCO Heritage Site • Dambulla', description: 'Cave temple complex with painted ceilings and Buddha statues. Cover shoulders and knees.', query: 'Dambulla Cave Temple' },
  { id: 'fort-station', name: 'Colombo Fort Railway Station', type: 'Transit Hub • Colombo', description: 'Main rail hub for Kandy, Galle and the hill country. Reserve observation seats in advance.', query: 'Colombo Fort Railway Station' },
];

export interface Tip {
  id: string;
  title: string;
  body: string;
  icon: IconName;
}

export const travelTips: Tip[] = [
  { id: 'dress', title: 'Dress modestly at temples', body: 'Cover shoulders and knees, remove shoes and hats before entering temple grounds.', icon: 'shirt-outline' },
  { id: 'buddha', title: 'Respect Buddha images', body: 'Never pose with your back to a Buddha statue, touch it, or climb on it. Visible Buddha tattoos can cause serious problems.', icon: 'flower-outline' },
  { id: 'taxi', title: 'Use metered or app-based rides', body: 'Choose metered tuk-tuks or ride apps that show the fare upfront. Otherwise agree the price before you set off.', icon: 'car-outline' },
  { id: 'wildlife', title: 'Keep a safe distance from wildlife', body: 'Never feed elephants, monkeys or other animals, and stay in the vehicle on safaris.', icon: 'paw-outline' },
  { id: 'photos', title: 'Ask before photographing people', body: 'Always ask permission, especially at religious ceremonies and processions.', icon: 'camera-outline' },
  { id: 'drones', title: 'Drones need permission', body: 'Flying drones requires approval from the Civil Aviation Authority and is banned at many heritage sites.', icon: 'airplane-outline' },
  { id: 'right-hand', title: 'Use your right hand', body: 'Give and receive money, gifts and food with your right hand as a sign of respect.', icon: 'hand-left-outline' },
];

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  { id: 'permits', question: 'Do I need special permits for cultural sites?', answer: 'No special permit is needed to visit. Most major sites sell entry tickets at the gate. Commercial filming and drone use need separate approval.' },
  { id: 'taxi', question: 'How can I ensure meter taxi fare accuracy?', answer: 'Use tuk-tuks with a working meter or ride apps that show the fare before you book. If there is no meter, agree on the price before starting the trip.' },
  { id: 'temple-dress', question: 'What should I wear to a festival or temple?', answer: 'Light clothing that covers shoulders and knees. White is preferred at many sacred sites. Shoes and hats are removed before entering.' },
  { id: 'passport', question: 'What should I do if I lose my passport?', answer: 'Report the loss at the nearest police station to get a police report, then contact your embassy or high commission in Colombo for an emergency travel document.' },
  { id: 'perahera', question: 'How do I watch a perahera safely?', answer: 'Arrive early, follow police and marshal instructions, keep children close, and never cross the procession route or approach the elephants.' },
];

export const quickFacts: { label: string; value: string; icon: IconName }[] = [
  { label: 'Currency', value: 'Sri Lankan Rupee (LKR)', icon: 'cash-outline' },
  { label: 'Time Zone', value: 'UTC +5:30', icon: 'time-outline' },
  { label: 'Electricity', value: '230V • Type D / G plugs', icon: 'flash-outline' },
  { label: 'Entry', value: 'Most visitors need an ETA before arrival', icon: 'document-text-outline' },
  { label: 'Emergency', value: 'Police 119 • Ambulance 1990', icon: 'alert-circle-outline' },
];

export const TOURISM_WEBSITE = 'https://www.srilanka.travel';

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query}, Sri Lanka`)}`;
}
