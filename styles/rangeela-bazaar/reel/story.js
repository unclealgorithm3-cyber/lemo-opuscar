export const DUR = 90;
export const FPS = 30;

export const SHOTS = [
  { start: 0,  end: 4,  scene: 1,  caption: 'रंगीला बाज़ार में आपका स्वागत है!', speaker: '',        aunty: 'normal', shop: 'normal' },
  { start: 4,  end: 8,  scene: 2,  caption: 'Golden Apple Aunty साड़ी लेने आईं।', speaker: '',        aunty: 'normal', shop: 'normal' },
  { start: 8,  end: 12, scene: 3,  caption: 'वाह! ये लाल साड़ी तो कमाल है।', speaker: 'aunty', aunty: 'normal', shop: 'normal' },
  { start: 12, end: 16, scene: 4,  caption: 'भैया, इसकी कीमत कितनी है?', speaker: 'aunty', aunty: 'normal', shop: 'normal' },
  { start: 16, end: 20, scene: 5,  caption: 'मैडम, इसकी कीमत ₹5,000 है।', speaker: 'shop', aunty: 'normal', shop: 'normal' },
  { start: 20, end: 24, scene: 6,  caption: 'पाँच हज़ार?!', speaker: 'aunty', aunty: 'surprised', shop: 'normal' },
  { start: 24, end: 28, scene: 7,  caption: 'कुछ कम कर दीजिए ना!', speaker: 'aunty', aunty: 'normal', shop: 'normal' },
  { start: 28, end: 32, scene: 8,  caption: 'दाम तो यही है, मैडम।', speaker: 'shop', aunty: 'normal', shop: 'normal' },
  { start: 32, end: 36, scene: 9,  caption: 'इतना कौन देगा? आधा कर दीजिए!', speaker: 'aunty', aunty: 'angry', shop: 'normal' },
  { start: 36, end: 40, scene: 10, caption: 'Aunty की छूट अब घटने लगी...', speaker: '', aunty: 'angry', shop: 'normal' },
  { start: 40, end: 44, scene: 11, caption: 'ऐसे बात करेंगी तो छूट भी घटेगी!', speaker: 'shop', aunty: 'angry', shop: 'normal' },
  { start: 44, end: 48, scene: 12, caption: 'अरे! ये कैसा हिसाब है?', speaker: 'aunty', aunty: 'angry', shop: 'normal' },
  { start: 48, end: 52, scene: 13, caption: 'तभी आए Blue Strawberry Uncle...', speaker: '', aunty: 'angry', shop: 'normal' },
  { start: 52, end: 56, scene: 14, caption: 'नमस्ते भैया, ये साड़ी कितने की है?', speaker: 'uncle', aunty: 'angry', shop: 'normal' },
  { start: 56, end: 60, scene: 15, caption: 'आपके लिए अच्छी छूट है, अंकल।', speaker: 'shop', aunty: 'normal', shop: 'normal' },
  { start: 60, end: 64, scene: 16, caption: 'अरे! इन्हें इतनी छूट?', speaker: 'aunty', aunty: 'surprised', shop: 'normal' },
  { start: 64, end: 68, scene: 17, caption: 'मुझे भी उतनी ही छूट चाहिए!', speaker: 'aunty', aunty: 'angry', shop: 'normal' },
  { start: 68, end: 72, scene: 18, caption: 'पहले प्यार से बात कीजिए, मैडम।', speaker: 'shop', aunty: 'angry', shop: 'normal' },
  { start: 72, end: 76, scene: 19, caption: 'मैं ऐसे ही बात करती हूँ!', speaker: 'aunty', aunty: 'angry', shop: 'normal' },
  { start: 76, end: 80, scene: 20, caption: 'अब सिर्फ़ 5% छूट मिलेगी!', speaker: 'shop', aunty: 'angry', shop: 'normal' },
  { start: 80, end: 84, scene: 21, caption: 'अरे! कीमत ₹5,000 से ₹10,000 हो गई?', speaker: 'aunty', aunty: 'surprised', shop: 'normal' },
  { start: 84, end: 87, scene: 22, caption: 'ये तो उल्टा पड़ गया!', speaker: 'aunty', aunty: 'surprised', shop: 'normal' }
];

export function shotAt(t) {
  return SHOTS.find(s => t >= s.start && t < s.end) ?? SHOTS[SHOTS.length - 1];
}
