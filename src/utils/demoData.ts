import { Attachment, ChatMetadata, Message } from '../types/chat';

/**
 * Creates a playable voice note audio Blob using Web Audio API buffer
 */
export function createSyntheticVoiceNoteBlob(durationSeconds = 6): Blob {
  // Generate a PCM 16-bit WAV file in pure JS
  const sampleRate = 22050;
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV Header
  // "RIFF"
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + numSamples * 2, true);
  // "WAVE"
  view.setUint32(8, 0x57415645, false);
  // "fmt "
  view.setUint32(12, 0x666d7420, false);
  view.setUint16(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  // "data"
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, numSamples * 2, true);

  // Write synthetic speech-like harmonics
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Cadence modulation mimicking human speech cadence
    const envelope = Math.sin(t * 3.5) * 0.4 + 0.5;
    const formant1 = Math.sin(2 * Math.PI * 220 * t);
    const formant2 = 0.5 * Math.sin(2 * Math.PI * 440 * t);
    const formant3 = 0.25 * Math.sin(2 * Math.PI * 880 * t);
    const sample = (formant1 + formant2 + formant3) * envelope * 0.6;
    const intSample = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Creates SVG image data URIs for demo photos, stickers and documents
 */
function createSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateDemoChat(): { messages: Message[]; metadata: ChatMetadata; objectUrls: string[] } {
  // Voice note blob URLs
  const audioBlob1 = createSyntheticVoiceNoteBlob(5);
  const audioUrl1 = URL.createObjectURL(audioBlob1);

  const audioBlob2 = createSyntheticVoiceNoteBlob(4);
  const audioUrl2 = URL.createObjectURL(audioBlob2);

  const audioBlob3 = createSyntheticVoiceNoteBlob(4);
  const audioUrl3 = URL.createObjectURL(audioBlob3);

  // Demo Beach Photo SVG
  const beachPhotoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ff7e5f"/>
        <stop offset="40%" stop-color="#feb47b"/>
        <stop offset="70%" stop-color="#ffeccc"/>
        <stop offset="100%" stop-color="#2b5876"/>
      </linearGradient>
      <linearGradient id="sea" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1f4068"/>
        <stop offset="100%" stop-color="#162447"/>
      </linearGradient>
    </defs>
    <rect width="800" height="420" fill="url(#sky)"/>
    <circle cx="400" cy="300" r="85" fill="#fff5d7" opacity="0.9"/>
    <circle cx="400" cy="300" r="105" fill="#ffeaa7" opacity="0.3"/>
    <rect y="420" width="800" height="180" fill="url(#sea)"/>
    <path d="M0,420 Q200,430 400,420 T800,420 L800,600 L0,600 Z" fill="#1b2a47" opacity="0.5"/>
    <path d="M50,560 Q250,530 450,570 T850,550 L850,600 L0,600 Z" fill="#c29b61"/>
    <!-- Silhouette palm tree -->
    <path d="M120,570 Q140,430 110,320 Q118,320 130,440 Q135,500 135,570 Z" fill="#16212d"/>
    <path d="M110,320 Q60,300 20,330 Q60,320 110,322" stroke="#16212d" stroke-width="6" fill="none"/>
    <path d="M110,320 Q80,260 40,260 Q80,280 110,320" stroke="#16212d" stroke-width="6" fill="none"/>
    <path d="M110,320 Q140,240 180,250 Q145,280 110,320" stroke="#16212d" stroke-width="6" fill="none"/>
    <path d="M110,320 Q160,290 200,320 Q150,320 110,320" stroke="#16212d" stroke-width="6" fill="none"/>
    <text x="30" y="50" font-family="system-ui, sans-serif" font-weight="bold" font-size="28" fill="#ffffff" opacity="0.85">Atardecer en la playa</text>
  </svg>`;
  const beachPhotoUrl = createSvgDataUri(beachPhotoSvg);

  // Demo Coffee Meeting Photo SVG
  const coffeePhotoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 700 500">
    <rect width="700" height="500" fill="#2c2724"/>
    <rect x="20" y="20" width="660" height="460" rx="16" fill="#3e352f"/>
    <!-- Coffee cup -->
    <circle cx="350" cy="250" r="130" fill="#d7ccc8"/>
    <circle cx="350" cy="250" r="115" fill="#f5f5f5"/>
    <circle cx="350" cy="250" r="95" fill="#5d4037"/>
    <!-- Latte art heart -->
    <path d="M350,280 C330,240 290,230 290,200 C290,175 315,160 340,180 C345,184 350,190 350,190 C350,190 355,184 360,180 C385,160 410,175 410,200 C410,230 370,240 350,280 Z" fill="#efebe9" opacity="0.95"/>
    <text x="350" y="420" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#d7ccc8">Cafetería Central - 11:30 am</text>
  </svg>`;
  const coffeePhotoUrl = createSvgDataUri(coffeePhotoSvg);

  // Demo Sticker 1 (Excited Dog / Cat Meme sticker)
  const sticker1Svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <!-- Transparent sticker background -->
    <defs>
      <filter id="sticker-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <g filter="url(#sticker-shadow)">
      <!-- Sticker White Border outline -->
      <circle cx="160" cy="160" r="130" fill="#ffffff" stroke="#f1f5f9" stroke-width="8"/>
      <!-- Smiley Face -->
      <circle cx="160" cy="160" r="120" fill="#fbbf24"/>
      <!-- Big Sparkly Eyes -->
      <ellipse cx="120" cy="130" rx="20" ry="26" fill="#1e293b"/>
      <ellipse cx="200" cy="130" rx="20" ry="26" fill="#1e293b"/>
      <circle cx="114" cy="120" r="7" fill="#ffffff"/>
      <circle cx="194" cy="120" r="7" fill="#ffffff"/>
      <!-- Rosy cheeks -->
      <ellipse cx="95" cy="165" rx="16" ry="10" fill="#f87171" opacity="0.6"/>
      <ellipse cx="225" cy="165" rx="16" ry="10" fill="#f87171" opacity="0.6"/>
      <!-- Happy Open Mouth with Tongue -->
      <path d="M120,180 Q160,240 200,180 Z" fill="#991b1b"/>
      <path d="M140,195 Q160,230 180,195 Z" fill="#f43f5e"/>
      <!-- Sticker text badge -->
      <rect x="70" y="240" width="180" height="42" rx="21" fill="#ec4899"/>
      <text x="160" y="268" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#ffffff">¡DE UNA! 🔥</text>
    </g>
  </svg>`;
  const sticker1Url = createSvgDataUri(sticker1Svg);

  // Demo GIF (Party Confetti Animation SVG)
  const partyGifSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" rx="12" fill="#1e1b4b"/>
    <text x="200" y="140" text-anchor="middle" font-size="70">🥳🎉</text>
    <text x="200" y="200" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="24" fill="#a7f3d0">¡VAMOS CON TODO!</text>
    <circle cx="60" cy="60" r="14" fill="#f43f5e"/>
    <circle cx="340" cy="80" r="12" fill="#38bdf8"/>
    <polygon points="100,220 120,200 130,230" fill="#facc15"/>
    <polygon points="300,240 320,210 330,250" fill="#c084fc"/>
    <!-- Small GIF badge -->
    <rect x="16" y="16" width="46" height="24" rx="4" fill="#000000" opacity="0.75"/>
    <text x="39" y="33" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="13" fill="#ffffff">GIF</text>
  </svg>`;
  const partyGifUrl = createSvgDataUri(partyGifSvg);

  // Demo PDF Document SVG thumbnail
  const pdfDocUrl = createSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120" viewBox="0 0 100 120">
    <rect width="100" height="120" rx="8" fill="#e2e8f0"/>
    <rect x="15" y="15" width="70" height="15" rx="3" fill="#ef4444"/>
    <rect x="15" y="45" width="70" height="6" rx="2" fill="#94a3b8"/>
    <rect x="15" y="60" width="55" height="6" rx="2" fill="#cbd5e1"/>
    <rect x="15" y="75" width="65" height="6" rx="2" fill="#cbd5e1"/>
    <text x="50" y="27" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="10" fill="#ffffff">PDF</text>
  </svg>`);

  const demoMessages: Message[] = [
    {
      id: 'demo-msg-1',
      rawDate: '28/09/2026',
      rawTime: '10:00',
      timestamp: new Date(2026, 8, 28, 10, 0, 0).getTime(),
      sender: 'Sistema',
      text: 'Los mensajes y las llamadas están cifrados de extremo a extremo. Nadie fuera de este chat, ni siquiera WhatsApp, puede leerlos ni escucharlos.',
      isSystem: true,
      systemType: 'encryption',
    },
    {
      id: 'demo-msg-2',
      rawDate: '28/09/2026',
      rawTime: '10:05',
      timestamp: new Date(2026, 8, 28, 10, 5, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: '¡Hola a todos! 👋 Armé este grupo para organizar el viaje de este fin de semana.',
      isSystem: false,
    },
    {
      id: 'demo-msg-3',
      rawDate: '28/09/2026',
      rawTime: '10:07',
      timestamp: new Date(2026, 8, 28, 10, 7, 0).getTime(),
      sender: 'Sofia Rodríguez',
      text: '¡Genial Carlos! Justo estaba buscando opciones de hospedaje frente al mar.',
      isSystem: false,
    },
    {
      id: 'demo-msg-4',
      rawDate: '28/09/2026',
      rawTime: '10:08',
      timestamp: new Date(2026, 8, 28, 10, 8, 0).getTime(),
      sender: 'Tú',
      text: '¡Me parece una excelente idea! Yo pongo la camioneta para ir todos juntos.',
      isSystem: false,
      isOutgoing: true,
    },
    {
      id: 'demo-msg-5',
      rawDate: '28/09/2026',
      rawTime: '10:12',
      timestamp: new Date(2026, 8, 28, 10, 12, 0).getTime(),
      sender: 'Sofia Rodríguez',
      text: 'Miren la vista de la playa donde podríamos quedarnos:',
      isSystem: false,
      attachment: {
        fileName: 'IMG-20260928-WA0001.jpg',
        originalName: 'IMG-20260928-WA0001.jpg',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        mediaType: 'image',
        url: beachPhotoUrl,
        size: 842000,
      },
    },
    {
      id: 'demo-msg-6',
      rawDate: '28/09/2026',
      rawTime: '10:14',
      timestamp: new Date(2026, 8, 28, 10, 14, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: '',
      isSystem: false,
      attachment: {
        fileName: '00004479-STICKER-2026-09-04-13-47-36.webp',
        originalName: '00004479-STICKER-2026-09-04-13-47-36.webp',
        extension: 'webp',
        mimeType: 'image/webp',
        mediaType: 'sticker',
        url: sticker1Url,
        size: 94000,
      },
    },
    {
      id: 'demo-msg-7',
      rawDate: '28/09/2026',
      rawTime: '10:16',
      timestamp: new Date(2026, 8, 28, 10, 16, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: '¡Esa cabaña está increíble! Les mandé un audio con los precios que me cotizaron.',
      isSystem: false,
    },
    {
      id: 'demo-msg-8',
      rawDate: '28/09/2026',
      rawTime: '10:17',
      timestamp: new Date(2026, 8, 28, 10, 17, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: '',
      isSystem: false,
      attachment: {
        fileName: 'PTT-20260928-WA0003.opus',
        originalName: 'PTT-20260928-WA0003.opus',
        extension: 'opus',
        mimeType: 'audio/wav',
        mediaType: 'voice',
        url: audioUrl1,
        size: 215000,
        duration: 5,
      },
    },
    {
      id: 'demo-msg-8b',
      rawDate: '28/09/2026',
      rawTime: '10:18',
      timestamp: new Date(2026, 8, 28, 10, 18, 0).getTime(),
      sender: 'Sofia Rodríguez',
      text: '',
      isSystem: false,
      attachment: {
        fileName: 'AUD-20260928-WA0004.opus',
        originalName: 'AUD-20260928-WA0004.opus',
        extension: 'opus',
        mimeType: 'audio/wav',
        mediaType: 'voice',
        url: audioUrl2,
        size: 190000,
        duration: 4,
      },
    },
    {
      id: 'demo-msg-9',
      rawDate: '29/09/2026',
      rawTime: '09:30',
      timestamp: new Date(2026, 8, 29, 9, 30, 0).getTime(),
      sender: 'Tú',
      text: 'Nos vemos en esta cafetería para ultimar detalles y confirmar el pago:',
      isSystem: false,
      isOutgoing: true,
      attachment: {
        fileName: 'IMG-20260929-WA0004.jpg',
        originalName: 'IMG-20260929-WA0004.jpg',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        mediaType: 'image',
        url: coffeePhotoUrl,
        size: 610000,
      },
    },
    {
      id: 'demo-msg-9b',
      rawDate: '29/09/2026',
      rawTime: '09:31',
      timestamp: new Date(2026, 8, 29, 9, 31, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: '',
      isSystem: false,
      attachment: {
        fileName: 'PTT-20260929-WA0005.opus',
        originalName: 'PTT-20260929-WA0005.opus',
        extension: 'opus',
        mimeType: 'audio/wav',
        mediaType: 'voice',
        url: audioUrl3,
        size: 195000,
        duration: 4,
      },
    },
    {
      id: 'demo-msg-10',
      rawDate: '29/09/2026',
      rawTime: '09:32',
      timestamp: new Date(2026, 8, 29, 9, 32, 0).getTime(),
      sender: 'Sofia Rodríguez',
      text: '¡Perfecto! Aquí les adjunto el PDF con el itinerario completo y la reserva:',
      isSystem: false,
      attachment: {
        fileName: 'Itinerario_Viaje_Playa_2026.pdf',
        originalName: 'Itinerario_Viaje_Playa_2026.pdf',
        extension: 'pdf',
        mimeType: 'application/pdf',
        mediaType: 'document',
        url: pdfDocUrl,
        size: 1420000,
      },
    },
    {
      id: 'demo-msg-11',
      rawDate: '29/09/2026',
      rawTime: '09:35',
      timestamp: new Date(2026, 8, 29, 9, 35, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: '¡Listísimo! ¡Nos vemos en media hora!',
      isSystem: false,
      attachment: {
        fileName: 'GIF-20260929-WA0005.gif',
        originalName: 'GIF-20260929-WA0005.gif',
        extension: 'gif',
        mimeType: 'image/gif',
        mediaType: 'gif',
        url: partyGifUrl,
        size: 420000,
      },
    },
    {
      id: 'demo-msg-12',
      rawDate: '29/09/2026',
      rawTime: '09:40',
      timestamp: new Date(2026, 8, 29, 9, 40, 0).getTime(),
      sender: 'Tú',
      text: '¡Excelente! Recuerden traer toalla y protector solar. 🏖️🚗',
      isSystem: false,
      isOutgoing: true,
      isEdited: true,
    },
    {
      id: 'demo-msg-12b',
      rawDate: '29/09/2026',
      rawTime: '09:41',
      timestamp: new Date(2026, 8, 29, 9, 41, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: 'El pronóstico dice que habrá sol todo el fin de semana, 28°C despejado ☀️🌊',
      isSystem: false,
      isForwarded: true,
    },
    {
      id: 'demo-msg-13',
      rawDate: '29/09/2026',
      rawTime: '09:42',
      timestamp: new Date(2026, 8, 29, 9, 42, 0).getTime(),
      sender: 'Sofia Rodríguez',
      text: 'Miren este Reel con los mejores atardeceres de la zona donde vamos: https://www.instagram.com/reel/C-K3pWsvY_D/',
      isSystem: false,
    },
    {
      id: 'demo-msg-14',
      rawDate: '29/09/2026',
      rawTime: '09:45',
      timestamp: new Date(2026, 8, 29, 9, 45, 0).getTime(),
      sender: 'Carlos Mendoza',
      text: 'Y en TikTok encontré este video con los restaurantes recomendados: https://www.tiktok.com/@gastronomia_playa/video/7384910283746592810',
      isSystem: false,
    },
    {
      id: 'demo-msg-14b',
      rawDate: '29/09/2026',
      rawTime: '09:47',
      timestamp: new Date(2026, 8, 29, 9, 47, 0).getTime(),
      sender: 'Sofia Rodríguez',
      text: '¡Esa foto de la playa que subiste al estado quedó espectacular! ¿Ahí es donde nos quedamos? 😍',
      isSystem: false,
      storyReply: {
        storyTitle: 'Tu estado',
        thumbnailUrl: beachPhotoUrl,
        storyText: 'Foto de estado',
      },
    },
    {
      id: 'demo-msg-15',
      rawDate: '29/09/2026',
      rawTime: '09:48',
      timestamp: new Date(2026, 8, 29, 9, 48, 0).getTime(),
      sender: 'Tú',
      text: '¡Se ve increíble! Aquí encontré también esta publicación del hotel: https://www.instagram.com/p/C-PqW55o8K1/',
      isSystem: false,
      isOutgoing: true,
    },
  ];

  const demoMetadata: ChatMetadata = {
    title: 'Viaje a la Playa 🏖️🌴',
    isGroup: true,
    participants: ['Carlos Mendoza', 'Sofia Rodríguez', 'Tú'],
    totalMessages: demoMessages.length,
    startDate: '28/09/2026',
    endDate: '29/09/2026',
    mediaCounts: {
      images: 2,
      videos: 0,
      audios: 3,
      stickers: 1,
      gifs: 1,
      documents: 1,
      total: 8,
    },
    unmatchedFilesCount: 0,
    unmatchedFiles: [],
  };

  return { messages: demoMessages, metadata: demoMetadata, objectUrls: [audioUrl1, audioUrl2, audioUrl3] };
}
