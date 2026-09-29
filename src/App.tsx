import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, MessageCircle } from 'lucide-react';
import { Attachment, ChatSession, FilterOptions, Message } from './types/chat';
import {
  createChatSessionFromData,
  parseWhatsAppZip,
  revokeChatObjectUrls,
  revokeAllObjectUrls,
} from './utils/zipHandler';
import { generateDemoChat } from './utils/demoData';
import { formatDateSeparator, normalizeDateToYMD } from './utils/dateUtils';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { SearchBar } from './components/SearchBar';
import { MessageItem } from './components/MessageItem';
import { MediaModal } from './components/MediaModal';
import { ChatInfoDrawer } from './components/ChatInfoDrawer';
import { WhatsAppBackground } from './components/WhatsAppBackground';
import { DatePickerModal } from './components/DatePickerModal';
import { EmptyChatState } from './components/EmptyChatState';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // In-chat search and filter state (applies to active session)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    participant: '',
    mediaType: 'all',
  });
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Active media for Lightbox viewer
  const [activeMedia, setActiveMedia] = useState<{
    attachment: Attachment;
    caption?: string;
    sender?: string;
    dateStr?: string;
  } | null>(null);

  // Background loading state for multiple ZIP parsing
  const [loadingCount, setLoadingCount] = useState(0);

  // Scroll state & positions preservation map (ChatId -> scrollTop)
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fileInputMainRef = useRef<HTMLInputElement | null>(null);

  // Active session object
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Messages with adjusted outgoing perspective
  const adjustedMessages = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.messages.map((m) => ({
      ...m,
      isOutgoing: !m.isSystem && m.sender === activeSession.currentUser,
    }));
  }, [activeSession]);

  // Filter messages based on search & filter options
  const filteredMessages = useMemo(() => {
    return adjustedMessages.filter((m) => {
      // Participant filter
      if (filterOptions.participant && m.sender !== filterOptions.participant) {
        return false;
      }

      // Media type filter
      if (filterOptions.mediaType !== 'all') {
        if (!m.attachment) return false;
        if (filterOptions.mediaType === 'audio' || filterOptions.mediaType === 'voice') {
          if (m.attachment.mediaType !== 'audio' && m.attachment.mediaType !== 'voice') return false;
        } else if (m.attachment.mediaType !== filterOptions.mediaType) {
          return false;
        }
      }

      // Text query search
      if (filterOptions.searchQuery.trim()) {
        const query = filterOptions.searchQuery.toLowerCase().trim();
        const textMatch = m.text.toLowerCase().includes(query);
        const senderMatch = m.sender.toLowerCase().includes(query);
        const fileMatch = m.attachment?.fileName.toLowerCase().includes(query);
        if (!textMatch && !senderMatch && !fileMatch) {
          return false;
        }
      }

      return true;
    });
  }, [adjustedMessages, filterOptions]);

  // Matches list for search navigation
  const searchMatches = useMemo(() => {
    if (!filterOptions.searchQuery.trim()) return [];
    return filteredMessages.map((m) => m.id);
  }, [filteredMessages, filterOptions.searchQuery]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [filterOptions.searchQuery]);

  // Reset in-chat search and filters when switching chats
  useEffect(() => {
    setIsSearchOpen(false);
    setIsDatePickerOpen(false);
    setIsInfoOpen(false);
    setFilterOptions({
      searchQuery: '',
      participant: '',
      mediaType: 'all',
    });
  }, [activeSessionId]);

  // Save scroll position of current chat before switching, and restore scroll position of target chat
  const handleSelectSession = useCallback((newId: string) => {
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
          // If first time opening, scroll to bottom
          container.scrollTop = container.scrollHeight;
        }
      }
    }, 40);
  }, [activeSessionId]);

  // Jump to specific message by ID and highlight it
  const jumpToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(messageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-[#00a884]', 'rounded-lg', 'bg-[#00a884]/20');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-[#00a884]', 'rounded-lg', 'bg-[#00a884]/20');
      }, 2500);
    }
  }, []);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    jumpToMessage(searchMatches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    jumpToMessage(searchMatches[prevIdx]);
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

    const targetMsg = filteredMessages.find(
      (m) => normalizeDateToYMD(m.rawDate) === targetYMD
    );
    if (targetMsg) {
      jumpToMessage(targetMsg.id);
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

    if (files.length === 0) {
      alert('Por favor selecciona archivos comprimidos .ZIP de WhatsApp.');
      return;
    }

    setLoadingCount(files.length);
    let firstNewSessionId: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await parseWhatsAppZip(file);
        const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const session = createChatSessionFromData(
          sessionId,
          result.metadata.title,
          result.messages,
          result.metadata,
          result.objectUrls,
          file.name
        );

        setSessions((prev) => [...prev, session]);
        if (!firstNewSessionId) {
          firstNewSessionId = sessionId;
        }
      } catch (err: any) {
        console.error(`Error procesando ${file.name}:`, err);
        alert(`Error al procesar ${file.name}: ${err.message || 'Archivo no válido'}`);
      }
      setLoadingCount((prev) => Math.max(0, prev - 1));
    }

    // Switch to first newly added chat
    if (firstNewSessionId) {
      handleSelectSession(firstNewSessionId);
    }
  };

  // Load Demo Chat into sessions
  const handleLoadDemo = () => {
    const demo = generateDemoChat();
    const demoId = `demo-${Date.now()}`;
    const demoSession = createChatSessionFromData(
      demoId,
      demo.metadata.title,
      demo.messages,
      demo.metadata,
      demo.objectUrls || [],
      'chat_ejemplo_playa.zip'
    );

    setSessions((prev) => [...prev, demoSession]);
    handleSelectSession(demoId);
  };

  // Rename a chat session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, customTitle: newTitle } : s))
    );
  };

  // Delete a chat from session (and revoke only its own Object URLs)
  const handleDeleteSession = (id: string) => {
    const sessionToDelete = sessions.find((s) => s.id === id);
    if (sessionToDelete) {
      revokeChatObjectUrls(sessionToDelete.objectUrls);
    }

    scrollPositions.current.delete(id);

    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      // If we deleted the active chat, switch to another or null
      if (activeSessionId === id) {
        const nextActive = updated.length > 0 ? updated[0].id : null;
        setActiveSessionId(nextActive);
      }
      return updated;
    });
  };

  // Change "currentUser" perspective for active session
  const handleChangeCurrentUser = (user: string) => {
    if (!activeSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, currentUser: user } : s))
    );
  };

  // Lightbox Next/Prev navigation
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
    <div className="flex h-screen w-full bg-[#0c1317] text-[#e9edef] overflow-hidden select-none font-sans">
      {/* Hidden input for adding files anywhere */}
      <input
        ref={fileInputMainRef}
        type="file"
        accept=".zip,application/zip"
        multiple
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* LEFT COLUMN: WhatsApp Desktop Chat List Sidebar */}
      <div
        className={`${
          activeSessionId ? 'hidden md:flex' : 'flex'
        } h-full shrink-0 w-full md:w-80 lg:w-96 z-30`}
      >
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onAddFiles={handleAddFiles}
          onLoadDemo={handleLoadDemo}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          loadingCount={loadingCount}
        />
      </div>

      {/* RIGHT COLUMN: Active Chat Conversation or Empty Welcome State */}
      <main
        className={`${
          activeSessionId ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col h-full relative overflow-hidden bg-[#0b141a] z-10`}
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
                filterOptions={filterOptions}
                onChangeFilter={setFilterOptions}
                onClose={() => setIsSearchOpen(false)}
                participants={activeSession.metadata.participants}
                totalMatches={searchMatches.length}
                currentMatchIndex={currentMatchIndex}
                onNextMatch={handleNextMatch}
                onPrevMatch={handlePrevMatch}
              />
            )}

            {/* Conversation Stream */}
            <div className="flex-1 relative overflow-hidden bg-[#0b141a]">
              {/* Subtle WhatsApp Wallpaper background */}
              <WhatsAppBackground />

              {/* Messages Viewport */}
              <div
                ref={chatScrollContainerRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto px-2 sm:px-8 md:px-12 lg:px-20 py-4 space-y-1 z-10 scrollbar-thin scrollbar-thumb-neutral-700/60 scrollbar-track-transparent"
              >
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#8696a0]">
                    <MessageCircle className="w-12 h-12 mb-3 text-neutral-600" />
                    <p className="text-base font-medium text-[#e9edef]">No se encontraron mensajes</p>
                    <p className="text-xs mt-1">Prueba cambiando los términos de búsqueda o filtros aplicados.</p>
                    <button
                      type="button"
                      onClick={() =>
                        setFilterOptions({ searchQuery: '', participant: '', mediaType: 'all' })
                      }
                      className="mt-3 px-3 py-1.5 rounded-lg bg-[#202c33] text-emerald-400 hover:text-emerald-300 text-xs font-semibold"
                    >
                      Restablecer filtros
                    </button>
                  </div>
                ) : (
                  filteredMessages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
                    const nextMsg = idx < filteredMessages.length - 1 ? filteredMessages[idx + 1] : null;

                    // Date separator logic
                    const isNewDate = !prevMsg || prevMsg.rawDate !== msg.rawDate;
                    const ymd = normalizeDateToYMD(msg.rawDate);

                    // Grouping logic
                    const isFirstInGroup =
                      isNewDate || !prevMsg || prevMsg.isSystem || prevMsg.sender !== msg.sender;
                    const isLastInGroup =
                      !nextMsg || nextMsg.rawDate !== msg.rawDate || nextMsg.isSystem || nextMsg.sender !== msg.sender;

                    const isCurrentSearchResult =
                      searchMatches.length > 0 && searchMatches[currentMatchIndex] === msg.id;

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Date Separator */}
                        {isNewDate && (
                          <div
                            id={`date-sep-${ymd}`}
                            className="flex justify-center my-3 select-none transition-all duration-300"
                          >
                            <div className="px-3.5 py-1 rounded-lg bg-[#182229]/95 border border-neutral-700/30 text-[11.5px] font-semibold text-[#8696a0] uppercase tracking-wider shadow-xs transition-all duration-300">
                              {formatDateSeparator(msg.rawDate)}
                            </div>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <MessageItem
                          message={msg}
                          isFirstInGroup={isFirstInGroup}
                          isLastInGroup={isLastInGroup}
                          isGroup={activeSession.metadata.isGroup}
                          searchQuery={filterOptions.searchQuery}
                          isSearchResult={isCurrentSearchResult}
                          onOpenMedia={(attachment, caption, sender, dateStr) => {
                            setActiveMedia({ attachment, caption, sender, dateStr });
                          }}
                        />
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Floating Navigation Controls (Bottom Right) */}
              <div className="absolute bottom-5 right-5 sm:right-7 z-20 flex flex-col gap-2 pointer-events-auto">
                {showScrollTop && (
                  <button
                    type="button"
                    onClick={scrollToTop}
                    title="Volver al inicio del chat (↑)"
                    aria-label="Volver al inicio del chat"
                    className="p-2.5 rounded-full bg-[#202c33]/90 hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884] shadow-xl border border-neutral-700/60 backdrop-blur-md transition active:scale-95 flex items-center justify-center group"
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
                    className="p-2.5 rounded-full bg-[#202c33]/90 hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884] shadow-xl border border-neutral-700/60 backdrop-blur-md transition active:scale-95 flex items-center justify-center group"
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
              onSelectMedia={(attachment, caption, sender, dateStr) => {
                setActiveMedia({ attachment, caption, sender, dateStr });
              }}
              onJumpToMessage={(msgId) => {
                setIsInfoOpen(false);
                jumpToMessage(msgId);
              }}
            />
          </>
        ) : (
          /* Empty Chat Welcome State (when no chat is selected) */
          <EmptyChatState
            onAddChat={() => fileInputMainRef.current?.click()}
            onLoadDemo={handleLoadDemo}
            hasChats={sessions.length > 0}
          />
        )}
      </main>

      {/* Fullscreen Media Lightbox Modal */}
      <MediaModal
        attachment={activeMedia?.attachment || null}
        caption={activeMedia?.caption}
        sender={activeMedia?.sender}
        dateStr={activeMedia?.dateStr}
        onClose={() => setActiveMedia(null)}
        onNext={handleNextMedia}
        onPrev={handlePrevMedia}
        hasNext={activeMediaIndex !== -1 && activeMediaIndex < visualMediaMessages.length - 1}
        hasPrev={activeMediaIndex > 0}
      />
    </div>
  );
}
