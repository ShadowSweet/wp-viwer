/**
 * Storage and management for Starred (⭐) and Pinned (📌) messages per chat
 */

const STARRED_STORAGE_KEY = 'whatsapp_viewer_starred_v1';
const PINNED_STORAGE_KEY = 'whatsapp_viewer_pinned_v1';

// In-memory cache for ultra-fast checks without parsing JSON repeatedly
let starredCache: Record<string, string[]> | null = null;
let pinnedCache: Record<string, string[]> | null = null;

function loadStarredMap(): Record<string, string[]> {
  if (starredCache) return starredCache;
  try {
    const raw = localStorage.getItem(STARRED_STORAGE_KEY);
    if (raw) {
      starredCache = JSON.parse(raw);
      return starredCache!;
    }
  } catch (e) {
    console.error('Error loading starred messages from localStorage:', e);
  }
  starredCache = {};
  return starredCache;
}

function loadPinnedMap(): Record<string, string[]> {
  if (pinnedCache) return pinnedCache;
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    if (raw) {
      pinnedCache = JSON.parse(raw);
      return pinnedCache!;
    }
  } catch (e) {
    console.error('Error loading pinned messages from localStorage:', e);
  }
  pinnedCache = {};
  return pinnedCache;
}

function saveStarredMap(map: Record<string, string[]>): void {
  starredCache = map;
  try {
    localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving starred messages to localStorage:', e);
  }
}

function savePinnedMap(map: Record<string, string[]>): void {
  pinnedCache = map;
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving pinned messages to localStorage:', e);
  }
}

export function getStarredMessageIdsForChat(chatId: string): string[] {
  const map = loadStarredMap();
  return map[chatId] || [];
}

export function getPinnedMessageIdsForChat(chatId: string): string[] {
  const map = loadPinnedMap();
  return map[chatId] || [];
}

export function toggleStarredMessageInStorage(chatId: string, messageId: string): boolean {
  const map = { ...loadStarredMap() };
  const currentList = map[chatId] ? [...map[chatId]] : [];
  const index = currentList.indexOf(messageId);
  let nowStarred = false;

  if (index >= 0) {
    currentList.splice(index, 1);
    nowStarred = false;
  } else {
    currentList.push(messageId);
    nowStarred = true;
  }

  map[chatId] = currentList;
  saveStarredMap(map);
  return nowStarred;
}

export function togglePinnedMessageInStorage(chatId: string, messageId: string): boolean {
  const map = { ...loadPinnedMap() };
  const currentList = map[chatId] ? [...map[chatId]] : [];
  const index = currentList.indexOf(messageId);
  let nowPinned = false;

  if (index >= 0) {
    currentList.splice(index, 1);
    nowPinned = false;
  } else {
    // Add to list of pinned messages
    currentList.push(messageId);
    nowPinned = true;
  }

  map[chatId] = currentList;
  savePinnedMap(map);
  return nowPinned;
}
