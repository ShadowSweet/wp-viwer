import { Message } from '../types/chat';

/**
 * Utility to reliably compute a numeric timestamp from message rawDate and rawTime,
 * ensuring accurate chronological ordering from oldest to newest.
 */
export function getExactMessageTimestamp(msg: {
  rawDate?: string;
  rawTime?: string;
  timestamp?: number;
}): number {
  if (!msg.rawDate) {
    return msg.timestamp && !isNaN(msg.timestamp) ? msg.timestamp : 0;
  }

  try {
    const cleanDate = msg.rawDate.trim();
    // Split by slash, hyphen, or dot
    const dateParts = cleanDate.split(/[/.-]/).map((p) => parseInt(p.trim(), 10));

    if (dateParts.length === 3 && !dateParts.some(isNaN)) {
      let day = dateParts[0];
      let month = dateParts[1];
      let year = dateParts[2];

      // If YYYY-MM-DD format (year first)
      if (dateParts[0] > 1000) {
        year = dateParts[0];
        month = dateParts[1];
        day = dateParts[2];
      } else {
        // DD/MM/YYYY or DD/MM/YY
        if (year < 100) {
          year = year > 70 ? 1900 + year : 2000 + year;
        }

        // If first part is > 12, it is definitely day (DD/MM/YYYY)
        // If second part is > 12, it is US format (MM/DD/YYYY)
        if (dateParts[0] > 12 && dateParts[1] <= 12) {
          day = dateParts[0];
          month = dateParts[1];
        } else if (dateParts[1] > 12 && dateParts[0] <= 12) {
          month = dateParts[0];
          day = dateParts[1];
        } else {
          // Standard Latin / Spanish WhatsApp format: DD/MM/YYYY
          day = dateParts[0];
          month = dateParts[1];
        }
      }

      // Parse time components
      let hours = 0;
      let minutes = 0;
      let seconds = 0;

      if (msg.rawTime) {
        // Handle non-breaking spaces and AM/PM variants
        const cleanTime = msg.rawTime.replace(/[\u202F\u00A0]/g, ' ').trim();
        const isPM = /[pP]\.?\s*[mM]\.?/.test(cleanTime);
        const isAM = /[aA]\.?\s*[mM]\.?/.test(cleanTime);

        // Extract digits
        const timeDigits = cleanTime
          .replace(/[aApP]\.?\s*[mM]\.?/g, '')
          .trim()
          .split(':')
          .map((p) => parseInt(p.trim(), 10));

        if (timeDigits.length >= 2 && !isNaN(timeDigits[0]) && !isNaN(timeDigits[1])) {
          hours = timeDigits[0];
          minutes = timeDigits[1];
          seconds = timeDigits[2] && !isNaN(timeDigits[2]) ? timeDigits[2] : 0;

          if (isPM && hours < 12) hours += 12;
          if (isAM && hours === 12) hours = 0;
        }
      }

      // Month is 0-indexed in JavaScript Date
      const dateObj = new Date(year, (month || 1) - 1, day || 1, hours, minutes, seconds);
      const timeMs = dateObj.getTime();
      if (!isNaN(timeMs)) {
        return timeMs;
      }
    }
  } catch {
    // fallback below
  }

  return msg.timestamp && !isNaN(msg.timestamp) ? msg.timestamp : 0;
}

/**
 * Sorts messages strictly chronologically from oldest to newest based on original chat date and time.
 * If two messages have the exact same date and time, their relative order in the original chat is preserved.
 * Does NOT mutate the input array.
 */
export function sortMessagesChronologically(
  messagesToSort: Message[],
  chatFullMessages?: Message[]
): Message[] {
  if (!messagesToSort || messagesToSort.length <= 1) {
    return messagesToSort ? [...messagesToSort] : [];
  }

  // Pre-calculate chat original index map if chatFullMessages is provided
  const indexMap = new Map<string, number>();
  if (chatFullMessages && chatFullMessages.length > 0) {
    for (let i = 0; i < chatFullMessages.length; i++) {
      indexMap.set(chatFullMessages[i].id, i);
    }
  }

  return [...messagesToSort].sort((a, b) => {
    const timeA = getExactMessageTimestamp(a);
    const timeB = getExactMessageTimestamp(b);

    if (timeA !== timeB) {
      return timeA - timeB; // Oldest first
    }

    // Tie-breaker: preserve original chat order
    const idxA = indexMap.get(a.id);
    const idxB = indexMap.get(b.id);
    if (idxA !== undefined && idxB !== undefined) {
      return idxA - idxB;
    }

    return 0;
  });
}
