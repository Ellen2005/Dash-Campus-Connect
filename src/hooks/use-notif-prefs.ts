"use client";

import { useState, useEffect } from "react";

export interface NotifPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  announcements: boolean;
  community: boolean;
  admin_tag: boolean;
  post_reported: boolean;
  post_deleted: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  announcements: true,
  community: true,
  admin_tag: true,
  post_reported: true,
  post_deleted: true,
};

const STORAGE_KEY = "dash-notif-prefs";

export function useNotifPrefs() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  return { prefs, updatePref };
}
