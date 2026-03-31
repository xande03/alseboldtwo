import { useState, useCallback } from "react";

export interface SessionHistoryItem {
  id: string;
  imageUrl: string;
  resultUrl: string;
  prompt: string;
  tool: "upscale" | "bgremove" | "generate" | "edit" | "qrcode" | "imagetoqr" | "musicdna" | "chat" | "converter" | "summarizer" | "signature" | "videoframes" | "gallery";
  timestamp: number;
}

const STORAGE_KEY = "alse-bold-history";

function loadFromStorage(): SessionHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: SessionHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded */ }
}

export function useSessionHistory(tool?: SessionHistoryItem["tool"]) {
  const [items, setItems] = useState<SessionHistoryItem[]>(loadFromStorage);

  const addItem = useCallback((item: Omit<SessionHistoryItem, "id" | "timestamp">) => {
    setItems((prev) => {
      const newItem: SessionHistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      const updated = [newItem, ...prev].slice(0, 50);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const filtered = tool ? items.filter((i) => i.tool === tool) : items;

  return { items: filtered, allItems: items, addItem, removeItem, clearAll };
}
