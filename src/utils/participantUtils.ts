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
 * Transforms specific participant and contact names according to rules:
 * - "Luisja" -> "Luis Salazar"
 * - "Chespiro ♥️CH" -> "Alexis Reina 2025"
 * - "DogChow🐶" -> "Alexis Reina 2026"
 */
export function formatParticipantName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();

  // Luisja -> Luis Salazar
  if (
    trimmed === 'Luisja' ||
    trimmed.toLowerCase() === 'luisja' ||
    trimmed === 'Luis Salazar'
  ) {
    return 'Luis Salazar';
  }

  // Chespiro ♥️CH -> Alexis Reina 2025
  if (
    trimmed === 'Chespiro ♥️CH' ||
    trimmed === 'Chespiro ♥️ CH' ||
    trimmed === 'Chespiro ❤️CH' ||
    trimmed === 'Chespiro ❤️ CH' ||
    (trimmed.includes('Chespiro') && trimmed.includes('CH'))
  ) {
    return 'Alexis Reina 2025';
  }

  // DogChow🐶 -> Alexis Reina 2026
  if (
    trimmed === 'DogChow🐶' ||
    trimmed === 'DogChow 🐶' ||
    trimmed === 'DogChow' ||
    trimmed.toLowerCase().includes('dogchow')
  ) {
    return 'Alexis Reina 2026';
  }

  return name;
}

/**
 * Checks if a chat contains the participant "Luisja" (or "Luis Salazar")
 */
export function hasLuisjaParticipant(participants: string[], messages?: { sender?: string }[]): boolean {
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
