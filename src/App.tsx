import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, MessageCircle } from 'lucide-react';
import { Attachment, ChatSession, Message } from './types/chat';
import {
  createChatSessionFromData,
  parseWhatsAppZip,
  revokeChatObjectUrls,
  revokeAllObjectUrls,
} from './utils/zipHandler';
import { formatDateSeparator, normalizeDateToYMD } from './utils/dateUtils';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { SearchBar, SearchResultItem } from './components/SearchBar';
import { MessageItem } from './components/MessageItem';
import { MediaModal } from './components/MediaModal';
import { ChatInfoDrawer } from './components/ChatInfoDrawer';
import { WhatsAppBackground } from './components/WhatsAppBackground';
import { DatePickerModal } from './components/DatePickerModal';
import { EmptyChatState } from './components/EmptyChatState';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // In-chat search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Modals and Drawers
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Temporary highlight state for contextual navigation
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active media for Lightbox viewer
  const [activeMedia, setActiveMedia] = useState<{
    attachment: Attachment;
    caption?: string;
    sender?: string;
    dateStr?: string;
    messageId?: string;
  } | null>(null);

  // Background loading state for multiple ZIP parsing
  const [loadingCount, setLoadingCount] = useState(0);

  // Scroll state & positions preservation map (ChatId -> scrollTop)
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fileInputMainRef = useRef<HTMLInputElement | null>(null);

  // Audio coordination state for consecutive audio autoplay
  const [activePlayingAudioId, setActivePlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1);
  const [isAudioChainActive, setIsAudioChainActive] = useState<boolean>(false);

  // Active session object
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Stop playback and cancel autoplay chain whenever active session changes
  useEffect(() => {
    setActivePlayingAudioId(null);
    setIsAudioChainActive(false);
  }, [activeSessionId]);

  const handlePlayAudio = (messageId: string) => {
    setActivePlayingAudioId(messageId);
    setIsAudioChainActive(true);
  };

  const handlePauseAudio = (messageId: string) => {
    if (activePlayingAudioId === messageId) {
      setActivePlayingAudioId(null);
      setIsAudioChainActive(false); // Manual pause halts the chain
    }
  };

  const handleChangeAudioRate = (newRate: number) => {
    setAudioPlaybackRate(newRate);
  };

  // Messages with adjusted outgoing perspective
  const adjustedMessages = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.messages.map((m) => ({
      ...m,
      isOutgoing: !m.isSystem && m.sender === activeSession.currentUser,
    }));
  }, [activeSession]);

  // Consecutive audio autoplay handler (strictly chronological in real conversation)
  const handleAudioEnded = (endedMessageId: string) => {
    if (!isAudioChainActive) {
      setActivePlayingAudioId(null);
      return;
    }

    const currentIndex = adjustedMessages.findIndex((m) => m.id === endedMessageId);
    if (currentIndex === -1 || currentIndex >= adjustedMessages.length - 1) {
      setActivePlayingAudioId(null);
      setIsAudioChainActive(false);
      return;
    }

    const nextMsg = adjustedMessages[currentIndex + 1];

    // Check if next chronological message is another audio
    const isNextAudio =
      !nextMsg.isSystem &&
      !nextMsg.isViewOnce &&
      nextMsg.attachment &&
      (nextMsg.attachment.mediaType === 'audio' || nextMsg.attachment.mediaType === 'voice');

    if (isNextAudio) {
      // Auto-advance to consecutive audio
      setActivePlayingAudioId(nextMsg.id);
      setIsAudioChainActive(true);
    } else {
      // Stop chain if next message is photo, video, text, sticker, doc, gif, or anything else
      setActivePlayingAudioId(null);
      setIsAudioChainActive(false);
    }
  };

  // Matches list for search navigation (does NOT filter conversation stream)
  const searchMatches = useMemo<SearchResultItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return adjustedMessages
      .filter((m) => {
        const textMatch = m.text && m.text.toLowerCase().includes(q);
        const fileMatch = m.attachment && m.attachment.fileName.toLowerCase().includes(q);
        const senderMatch = m.sender && m.sender.toLowerCase().includes(q);
        return textMatch || fileMatch || senderMatch;
      })
      .map((m) => ({
        id: m.id,
        sender: m.sender,
        rawDate: m.rawDate,
        rawTime: m.rawTime,
        text: m.text,
        fileName: m.attachment?.fileName,
      }));
  }, [adjustedMessages, searchQuery]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // Reset in-chat search and modals when switching chats
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsDatePickerOpen(false);
    setIsInfoOpen(false);
  }, [activeSessionId]);

  // Save scroll position of current chat before switching, and restore scroll position of target chat
  const handleSelectSession = useCallback(
    (newId: string) => {
      if (newId === activeSessionId) return;

      // 1. Save scroll position of outgoing chat
      if (chatScrollContainerRef.current && activeSessionId) {
        scrollPositions.current.set(
          activeSessionId,
          chatScrollContainerRef.current.scrollTop
        );
      }

      // 2. Switch chat
      setActiveSessionId(newId);

      // 3. Restore scroll position of incoming chat
      setTimeout(() => {
        const container = chatScrollContainerRef.current;
        if (container) {
          const savedScroll = scrollPositions.current.get(newId);
          if (savedScroll !== undefined) {
            container.scrollTop = savedScroll;
          } else {
            container.scrollTop = container.scrollHeight;
          }
        }
      }, 50);
    },
    [activeSessionId]
  );

  /**
   * CENTRALIZED "IR AL MENSAJE" (goToMessage)
   * Navigates seamlessly to any message in the full conversation:
   * 1. Identifies chat and switches if needed
   * 2. Closes any blocking modal/drawer (lightbox, chat info)
   * 3. Locates message in DOM
   * 4. Scrolls smoothly and centers it in view
   * 5. Applies temporary visual highlight that auto-fades
   * 6. Preserves full conversation context so user can continue scrolling freely
   */
  const goToMessage = useCallback(
    (messageId: string, targetSessionId?: string) => {
      // 1. Switch chat session if target differs
      if (targetSessionId && targetSessionId !== activeSessionId) {
        handleSelectSession(targetSessionId);
      }

      // 2. Close any overlays blocking the chat view
      setActiveMedia(null);
      setIsInfoOpen(false);

      // 3. Set temporary visual highlight with auto-clear
      setHighlightedMessageId(messageId);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3500);

      // 4. Scroll smoothly to the message element
      setTimeout(() => {
        const el = document.getElementById(messageId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    },
    [activeSessionId, handleSelectSession]
  );

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    goToMessage(searchMatches[nextIdx].id);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    goToMessage(searchMatches[prevIdx].id);
  };

  const handleSelectMatch = (messageId: string) => {
    const idx = searchMatches.findIndex((m) => m.id === messageId);
    if (idx !== -1) setCurrentMatchIndex(idx);
    goToMessage(messageId);
  };

  // Scroll helpers
  const scrollToBottom = (smooth = true) => {
    const container = chatScrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const scrollToTop = () => {
    const container = chatScrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigate to a specific date from Date Picker
  const handleNavigateToDate = (targetYMD: string) => {
    const dateSepEl = document.getElementById(`date-sep-${targetYMD}`);
    if (dateSepEl) {
      dateSepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const badge = dateSepEl.querySelector('div');
      if (badge) {
        badge.classList.add('ring-4', 'ring-[#00a884]', 'bg-[#00a884]/40', 'text-white', 'scale-105');
        setTimeout(() => {
          badge.classList.remove('ring-4', 'ring-[#00a884]', 'bg-[#00a884]/40', 'text-white', 'scale-105');
        }, 2500);
      }
      return;
    }

    const targetMsg = adjustedMessages.find(
      (m) => normalizeDateToYMD(m.rawDate) === targetYMD
    );
    if (targetMsg) {
      goToMessage(targetMsg.id);
    }
  };

  // Detect scroll position to show bottom / top floating buttons and record scroll
  const handleScroll = () => {
    const container = chatScrollContainerRef.current;
    if (!container || !activeSessionId) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Record position for active session
    scrollPositions.current.set(activeSessionId, scrollTop);

    setShowScrollBottom(distanceFromBottom > 350);
    setShowScrollTop(scrollTop > 350);
  };

  // Add multiple ZIP files without closing existing chats
  const handleAddFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(
      (f) => f.name.toLowerCase().endsWith('.zip') || f.type.includes('zip')
    );
    if (files.length === 0) return;

    setLoadingCount((prev) => prev + files.length);

    for (const file of files) {
      try {
        const result = await parseWhatsAppZip(file);
        const newSession = createChatSessionFromData(
          `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file.name.replace(/\.zip$/i, ''),
          result.messages,
          result.metadata,
          result.objectUrls,
          file.name
        );

        setSessions((prev) => {
          const exists = prev.some((s) => s.id === newSession.id);
          if (exists) return prev;
          return [...prev, newSession];
        });

        // Set active session to the newly loaded chat
        setActiveSessionId(newSession.id);

        setTimeout(() => {
          scrollToBottom(false);
        }, 120);
      } catch (err) {
        console.error(`Error loading chat ZIP "${file.name}":`, err);
      } finally {
        setLoadingCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  // Close / Delete a chat session
  const handleDeleteSession = (sessionId: string) => {
    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    if (sessionToDelete) {
      revokeChatObjectUrls(sessionToDelete.objectUrls);
    }

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    scrollPositions.current.delete(sessionId);

    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Rename chat session
  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, customTitle: newTitle } : s))
    );
  };

  // Switch perspective / currentUser for current chat
  const handleChangeCurrentUser = (user: string) => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, currentUser: user } : s))
    );
  };

  // Load interactive demo chat
  const handleLoadDemoChat = async () => {
    try {
      const { generateDemoChat } = await import('./utils/demoData');
      const demo = generateDemoChat();
      const demoSession = createChatSessionFromData(
        'chat-demo-travel',
        'Viaje a la Playa 🏖️🌴',
        demo.messages,
        demo.metadata,
        demo.objectUrls,
        'Chat_Demo_WhatsApp.zip'
      );

      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== demoSession.id);
        return [demoSession, ...filtered];
      });

      setActiveSessionId(demoSession.id);
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    } catch (err) {
      console.error('Error loading demo chat:', err);
    }
  };

  // Visual media messages for Lightbox carousel
  const visualMediaMessages = useMemo(() => {
    return adjustedMessages.filter(
      (m) =>
        m.attachment &&
        (m.attachment.mediaType === 'image' ||
          m.attachment.mediaType === 'video' ||
          m.attachment.mediaType === 'gif' ||
          m.attachment.mediaType === 'sticker' ||
          m.attachment.fileName.toLowerCase().includes('sticker') ||
          m.attachment.extension.toLowerCase() === 'webp')
    );
  }, [adjustedMessages]);

  const activeMediaIndex = useMemo(() => {
    if (!activeMedia) return -1;
    return visualMediaMessages.findIndex(
      (m) => m.attachment?.url === activeMedia.attachment.url
    );
  }, [visualMediaMessages, activeMedia]);

  const handleNextMedia = () => {
    if (activeMediaIndex !== -1 && activeMediaIndex < visualMediaMessages.length - 1) {
      const nextMsg = visualMediaMessages[activeMediaIndex + 1];
      if (nextMsg.attachment) {
        setActiveMedia({
          attachment: nextMsg.attachment,
          caption: nextMsg.text,
          sender: nextMsg.sender,
          dateStr: `${nextMsg.rawDate} ${nextMsg.rawTime}`,
          messageId: nextMsg.id,
        });
      }
    }
  };

  const handlePrevMedia = () => {
    if (activeMediaIndex > 0) {
      const prevMsg = visualMediaMessages[activeMediaIndex - 1];
      if (prevMsg.attachment) {
        setActiveMedia({
          attachment: prevMsg.attachment,
          caption: prevMsg.text,
          sender: prevMsg.sender,
          dateStr: `${prevMsg.rawDate} ${prevMsg.rawTime}`,
          messageId: prevMsg.id,
        });
      }
    }
  };

  // Revoke all created URLs on final app unmount
  useEffect(() => {
    return () => {
      revokeAllObjectUrls();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c1317] text-[#e9edef] font-sans select-none">
      {/* Hidden file input for adding chats */}
      <input
        type="file"
        ref={fileInputMainRef}
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
        accept=".zip,application/zip"
        multiple
        className="hidden"
      />

      {/* LEFT COLUMN: Sidebar Chat List */}
      <div
        className={`${
          activeSessionId ? 'hidden md:flex' : 'flex'
        } w-full md:w-[360px] lg:w-[400px] shrink-0 flex-col h-full border-r border-neutral-800 bg-[#111b21] z-20 transition-all`}
      >
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onAddFiles={handleAddFiles}
          loadingCount={loadingCount}
        />
      </div>

      {/* RIGHT COLUMN: Active Chat Conversation or Empty Welcome State */}
      <main
        className={`${
          activeSessionId ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col h-full relative overflow-hidden bg-[#0b141a] z-10 w-full min-w-0`}
      >
        {activeSession ? (
          <>
            {/* Chat Top Header */}
            <ChatHeader
              metadata={activeSession.metadata}
              displayTitle={activeSession.customTitle || activeSession.title}
              currentUser={activeSession.currentUser}
              onChangeCurrentUser={handleChangeCurrentUser}
              onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
              isSearchOpen={isSearchOpen}
              onOpenDatePicker={() => setIsDatePickerOpen(true)}
              onScrollToTop={scrollToTop}
              onToggleInfo={() => setIsInfoOpen(!isInfoOpen)}
              onBackToSidebar={() => setActiveSessionId(null)}
            />

            {/* In-Chat Search Bar */}
            {isSearchOpen && (
              <SearchBar
                searchQuery={searchQuery}
                onChangeQuery={setSearchQuery}
                onClose={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                totalMatches={searchMatches.length}
                currentMatchIndex={currentMatchIndex}
                onNextMatch={handleNextMatch}
                onPrevMatch={handlePrevMatch}
                matches={searchMatches}
                onSelectMatch={handleSelectMatch}
              />
            )}

            {/* Conversation Stream (Always shows the real full conversation in context) */}
            <div className="flex-1 relative overflow-hidden bg-[#0b141a]">
              {/* Subtle WhatsApp Wallpaper background */}
              <WhatsAppBackground />

              {/* Messages Viewport */}
              <div
                ref={chatScrollContainerRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto px-1.5 sm:px-6 md:px-10 lg:px-16 py-3 space-y-1 z-10 scrollbar-thin scrollbar-thumb-neutral-700/60 scrollbar-track-transparent"
              >
                {adjustedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#8696a0]">
                    <MessageCircle className="w-12 h-12 mb-3 text-neutral-600" />
                    <p className="text-base font-medium text-[#e9edef]">No hay mensajes en este chat</p>
                  </div>
                ) : (
                  adjustedMessages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? adjustedMessages[idx - 1] : null;
                    const nextMsg = idx < adjustedMessages.length - 1 ? adjustedMessages[idx + 1] : null;

                    // Date separator logic
                    const isNewDate = !prevMsg || prevMsg.rawDate !== msg.rawDate;
                    const ymd = normalizeDateToYMD(msg.rawDate);

                    // Grouping logic
                    const isFirstInGroup =
                      isNewDate || !prevMsg || prevMsg.isSystem || prevMsg.sender !== msg.sender;
                    const isLastInGroup =
                      !nextMsg || nextMsg.rawDate !== msg.rawDate || nextMsg.isSystem || nextMsg.sender !== msg.sender;

                    const isCurrentSearchResult =
                      searchMatches.length > 0 && searchMatches[currentMatchIndex]?.id === msg.id;

                    const isHighlighted = highlightedMessageId === msg.id;

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Date Separator */}
                        {isNewDate && (
                          <div
                            id={`date-sep-${ymd}`}
                            className="flex justify-center my-2.5 sm:my-3 select-none transition-all duration-300"
                          >
                            <div className="px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-lg bg-[#182229]/95 border border-neutral-700/30 text-[10.5px] sm:text-[11.5px] font-semibold text-[#8696a0] uppercase tracking-wider shadow-xs transition-all duration-300">
                              {formatDateSeparator(msg.rawDate)}
                            </div>
                          </div>
                        )}

                        {/* Message Bubble with contextual rendering */}
                        <MessageItem
                          message={msg}
                          isFirstInGroup={isFirstInGroup}
                          isLastInGroup={isLastInGroup}
                          isGroup={activeSession.metadata.isGroup}
                          searchQuery={searchQuery}
                          isSearchResult={isCurrentSearchResult}
                          isHighlighted={isHighlighted}
                          onOpenMedia={(attachment, caption, sender, dateStr, messageId) => {
                            setActiveMedia({ attachment, caption, sender, dateStr, messageId });
                          }}
                          isPlayingAudio={activePlayingAudioId === msg.id}
                          audioPlaybackRate={audioPlaybackRate}
                          onPlayAudio={() => handlePlayAudio(msg.id)}
                          onPauseAudio={() => handlePauseAudio(msg.id)}
                          onAudioEnded={() => handleAudioEnded(msg.id)}
                          onChangeAudioRate={handleChangeAudioRate}
                        />
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Floating Navigation Controls (Bottom Right - touch friendly) */}
              <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-20 flex flex-col gap-2 pointer-events-auto">
                {showScrollTop && (
                  <button
                    type="button"
                    onClick={scrollToTop}
                    title="Volver al inicio del chat (↑)"
                    aria-label="Volver al inicio del chat"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#202c33]/90 hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884] shadow-xl border border-neutral-700/60 backdrop-blur-md transition active:scale-95 flex items-center justify-center group touch-manipulation cursor-pointer"
                  >
                    <ArrowUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {showScrollBottom && (
                  <button
                    type="button"
                    onClick={() => scrollToBottom(true)}
                    title="Ir al final del chat (↓)"
                    aria-label="Ir al final del chat"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#202c33]/90 hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884] shadow-xl border border-neutral-700/60 backdrop-blur-md transition active:scale-95 flex items-center justify-center group touch-manipulation cursor-pointer"
                  >
                    <ArrowDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Picker Modal for Active Chat */}
            <DatePickerModal
              isOpen={isDatePickerOpen}
              onClose={() => setIsDatePickerOpen(false)}
              messages={activeSession.messages}
              onNavigateToDate={handleNavigateToDate}
            />

            {/* Side Drawer: Chat Info & Multimedia Gallery */}
            <ChatInfoDrawer
              metadata={activeSession.metadata}
              messages={adjustedMessages}
              isOpen={isInfoOpen}
              onClose={() => setIsInfoOpen(false)}
              onSelectMedia={(attachment, caption, sender, dateStr, messageId) => {
                setActiveMedia({ attachment, caption, sender, dateStr, messageId });
              }}
              onJumpToMessage={(msgId) => {
                goToMessage(msgId, activeSession.id);
              }}
            />
          </>
        ) : (
          /* Empty Chat Welcome State (when no chat is selected) */
          <EmptyChatState
            onAddChat={() => fileInputMainRef.current?.click()}
            hasChats={sessions.length > 0}
          />
        )}
      </main>

      {/* Fullscreen Media Lightbox Modal with "Ver en el chat" navigation */}
      <MediaModal
        attachment={activeMedia?.attachment || null}
        caption={activeMedia?.caption}
        sender={activeMedia?.sender}
        dateStr={activeMedia?.dateStr}
        messageId={activeMedia?.messageId}
        onClose={() => setActiveMedia(null)}
        onNext={handleNextMedia}
        onPrev={handlePrevMedia}
        hasNext={activeMediaIndex !== -1 && activeMediaIndex < visualMediaMessages.length - 1}
        hasPrev={activeMediaIndex > 0}
        onJumpToMessage={(msgId) => {
          if (activeSession) {
            goToMessage(msgId, activeSession.id);
          }
        }}
      />
    </div>
  );
}
