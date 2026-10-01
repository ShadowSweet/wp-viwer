/**
 * Utility functions for participant display names and message alignment
 */

export function normalizeNameKey(name: string): string {
  if (!name) return '';
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Transforms specific participant and contact names according to exact-match rules:
 * - "Luisja" -> "Luis Salazar"
 * - "Chespiro ♥️CH" -> "Alexis Reina 2025"
 * - "DogChow🐶" -> "Alexis Reina 2026"
 * 
 * Strict exact match: Does NOT modify partial names like "Luisjavier" or "Mi amigo Luisja".
 * Does NOT modify internal message data or original sender names.
 */
export function getDisplayName(senderName: string): string {
  if (!senderName) return '';
  const trimmed = senderName.trim();

  // Strip WhatsApp export title prefixes if a full chat title is passed
  const stripped = trimmed
    .replace(/^WhatsApp Chat -\s*/i, '')
    .replace(/^WhatsApp Chat with\s*/i, '')
    .replace(/^Chat de WhatsApp con\s*/i, '')
    .replace(/^Chat de WhatsApp -\s*/i, '')
    .trim();

  for (const text of [trimmed, stripped]) {
    // Exact match for Luisja (case insensitive, but whole word only)
    if (text.toLowerCase() === 'luisja' || text.toLowerCase() === 'luis salazar') {
      return 'Luis Salazar';
    }

    // Exact match for "Chespiro ♥️CH" (allowing normal heart variants and single space)
    const normalizedChespiro = text.replace(/\s+/g, ' ');
    if (
      normalizedChespiro === 'Chespiro ♥️CH' ||
      normalizedChespiro === 'Chespiro ♥️ CH' ||
      normalizedChespiro === 'Chespiro ❤️CH' ||
      normalizedChespiro === 'Chespiro ❤️ CH' ||
      normalizedChespiro === 'Chespiro ♥CH' ||
      normalizedChespiro === 'Chespiro ❤CH' ||
      normalizedChespiro.toLowerCase() === 'chespiro ch'
    ) {
      return 'Alexis Reina 2025';
    }

    // Exact match for "DogChow🐶"
    const normalizedDog = text.replace(/\s+/g, ' ');
    if (
      normalizedDog === 'DogChow🐶' ||
      normalizedDog === 'DogChow 🐶' ||
      normalizedDog.toLowerCase() === 'dogchow'
    ) {
      return 'Alexis Reina 2026';
    }
  }

  return senderName;
}

// Alias formatParticipantName to getDisplayName for seamless backwards compatibility
export const formatParticipantName = getDisplayName;

/**
 * Checks if a chat contains the participant "Luisja" (or "Luis Salazar")
 */
export function hasLuisjaParticipant(
  participants: string[],
  messages?: { sender?: string }[],
  chatTitle?: string
): boolean {
  if (chatTitle) {
    const lowerTitle = chatTitle.toLowerCase();
    if (lowerTitle.includes('luisja') || lowerTitle.includes('luis salazar')) {
      return true;
    }
  }

  const inParticipants = participants.some((p) => {
    const trimmed = p.trim().toLowerCase();
    return trimmed === 'luisja' || trimmed === 'luis salazar';
  });

  if (inParticipants) return true;

  if (messages && messages.length > 0) {
    return messages.some((m) => {
      const sender = (m.sender || '').trim().toLowerCase();
      return sender === 'luisja' || sender === 'luis salazar';
    });
  }

  return false;
}

/**
 * Determines whether a message should be placed on the right (outgoing)
 * Rule: When participant is "Luisja", his messages ALWAYS appear on the right,
 * and the other person's messages on the left!
 */
export function isMessageOutgoing(
  sender: string,
  chatParticipants: string[],
  currentUser: string,
  isLuisjaChat: boolean
): boolean {
  if (isLuisjaChat) {
    const trimmed = (sender || '').trim().toLowerCase();
    return trimmed === 'luisja' || trimmed === 'luis salazar';
  }

  return sender === currentUser;
}
