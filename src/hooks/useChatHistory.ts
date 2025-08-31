import { useCallback, useEffect, useMemo, useState } from 'react';

export interface ChatMessageRecord {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface ConversationRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageRecord[];
}

const STORAGE_KEY = 'ai_coach_conversations_v1';

function loadConversations(): ConversationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function saveConversations(conversations: ConversationRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {}
}

export function useChatHistory() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    const data = loadConversations();
    setConversations(data);
    if (data.length > 0) setActiveId(data[0].id);
  }, []);

  const persist = useCallback((next: ConversationRecord[]) => {
    setConversations(next);
    saveConversations(next);
  }, []);

  const createConversation = useCallback((title?: string) => {
    const now = Date.now();
    const convo: ConversationRecord = {
      id: `c_${now}_${Math.random().toString(36).slice(2)}`,
      title: title || 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    const next = [convo, ...conversations];
    persist(next);
    setActiveId(convo.id);
    return convo.id;
  }, [conversations, persist]);

  const renameConversation = useCallback((id: string, title: string) => {
    const next = conversations.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c);
    persist(next);
  }, [conversations, persist]);

  const deleteConversation = useCallback((id: string) => {
    const next = conversations.filter(c => c.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  }, [conversations, persist, activeId]);

  const appendMessage = useCallback((convoId: string, message: Omit<ChatMessageRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) => {
    const ts = message.timestamp || Date.now();
    const id = message.id || `m_${ts}_${Math.random().toString(36).slice(2)}`;
    const next = conversations.map(c => {
      if (c.id !== convoId) return c;
      const msg: ChatMessageRecord = { id, content: message.content, isUser: message.isUser, timestamp: ts };
      return { ...c, messages: [...c.messages, msg], updatedAt: ts, title: c.messages.length === 0 && message.isUser ? (message.content.slice(0, 28) + (message.content.length > 28 ? '…' : '')) : c.title };
    });
    persist(next);
  }, [conversations, persist]);

  const activeConversation = useMemo(() => conversations.find(c => c.id === activeId) || null, [conversations, activeId]);

  return {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    createConversation,
    renameConversation,
    deleteConversation,
    appendMessage
  };
}


