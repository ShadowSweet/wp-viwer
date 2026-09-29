export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'sticker' | 'document' | 'gif';

export interface Attachment {
  fileName: string;
  originalName: string;
  extension: string;
  mimeType: string;
  mediaType: MediaType;
  blob?: Blob;
  url: string; // Object URL or data URI
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface StoryReplyInfo {
  storyTitle?: string; // e.g. "Tu estado", "Estado"
  storyText?: string;
  thumbnailUrl?: string;
}

export interface Message {
  id: string;
  rawDate: string; // Original date string e.g. "29/09/2026"
  rawTime: string; // Original time string e.g. "14:35" or "2:35 p. m."
  timestamp: number; // Parsed approx epoch for sorting
  sender: string; // Contact or sender name
  text: string;
  isSystem: boolean;
  systemType?: 'encryption' | 'group_created' | 'group_changed' | 'user_joined' | 'user_left' | 'general';
  isOutgoing?: boolean; // Whether sent by current selected "User"
  attachment?: Attachment;
  replyTo?: {
    sender?: string;
    text?: string;
  };
  isViewOnce?: boolean;
  isEdited?: boolean;
  isForwarded?: boolean;
  storyReply?: StoryReplyInfo;
  hasAttachmentError?: boolean;
  unmatchedAttachmentName?: string;
}

export interface ChatMetadata {
  title: string;
  isGroup: boolean;
  participants: string[];
  totalMessages: number;
  startDate?: string;
  endDate?: string;
  mediaCounts: {
    images: number;
    videos: number;
    audios: number;
    stickers: number;
    gifs: number;
    documents: number;
    total: number;
  };
  unmatchedFilesCount: number;
  unmatchedFiles: string[];
}

export interface FilterOptions {
  searchQuery: string;
  participant: string;
  mediaType: 'all' | MediaType;
  startDate?: string;
  endDate?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  customTitle?: string;
  zipFileName?: string;
  metadata: ChatMetadata;
  messages: Message[];
  currentUser: string;
  scrollPosition?: number;
  lastMessagePreview?: {
    sender: string;
    text: string;
    time: string;
    date: string;
    mediaType?: MediaType;
  };
  objectUrls: string[];
}
