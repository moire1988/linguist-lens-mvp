"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppAuth } from "@/hooks/useAppAuth";
import {
  getDbPreferences,
  USER_PREFERENCES_CHANGED_EVENT,
} from "@/lib/db/preferences";

/**
 * DB の wants_email（メルマガ希望）を購読する。
 * 設定変更時は USER_PREFERENCES_CHANGED_EVENT で再取得する。
 */
export function useNewsletterWantsEmail(): {
  loaded: boolean;
  wantsEmail: boolean;
  isSignedIn: boolean;
} {
  const { isSignedIn, userId, getToken, isMocked } = useAppAuth();
  const [loaded, setLoaded] = useState(false);
  const [wantsEmail, setWantsEmail] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId || isMocked) {
      setLoaded(true);
      setWantsEmail(false);
      return;
    }
    const token = await getToken({ template: "supabase" });
    if (!token) {
      setLoaded(true);
      setWantsEmail(false);
      return;
    }
    const prefs = await getDbPreferences(token, userId);
    setWantsEmail(prefs?.wantsEmail ?? false);
    setLoaded(true);
  }, [isSignedIn, userId, getToken, isMocked]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => {
      void refresh();
    };
    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, handler);
  }, [refresh]);

  return { loaded, wantsEmail, isSignedIn };
}
