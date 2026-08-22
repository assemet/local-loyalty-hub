import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, updateProfile } from "@/lib/api";
import type { Profile } from "@/lib/domain";
import { useI18n } from "@/i18n";
import { normalizeLocale, type Locale } from "@/i18n/detect";
import { getTelegramInitData, isTelegramEnvironment, telegramReady } from "@/lib/telegram";
import { telegramSignIn } from "@/lib/telegram.functions";

export type TelegramStatus = "signing_in" | "complete" | "failed" | "not_configured" | "unavailable";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  telegramStatus: TelegramStatus;
  refreshProfile: () => Promise<void>;
  saveProfile: (patch: Partial<Profile>) => Promise<void>;
  signInWithTelegram: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus>("signing_in");
  const { locale, isExplicit, setLocale } = useI18n();
  const telegramAttempted = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Telegram Mini App: verify identity server-side and open the session.
  useEffect(() => {
    if (loading || session || telegramAttempted.current) return;
    if (!isTelegramEnvironment()) {
      setTelegramStatus("unavailable");
      return;
    }
    telegramAttempted.current = true;
    telegramReady();
    const initData = getTelegramInitData();
    if (!initData) {
      setTelegramStatus("unavailable");
      return;
    }
    setTelegramStatus("signing_in");
    (async () => {
      try {
        const result = await telegramSignIn({ data: { initData } });
        if (!result.ok) {
          setTelegramStatus("not_configured");
          return;
        }
        const { error } = await supabase.auth.verifyOtp({
          token_hash: result.tokenHash,
          type: "email",
        });
        if (error) throw error;
        setTelegramStatus("complete");
      } catch {
        setTelegramStatus("failed");
      }
    })();
  }, [loading, session]);

  const loadProfile = useCallback(async (userId: string) => {
    const next = await fetchProfile(userId);
    setProfile(next);
    return next;
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    void loadProfile(session.user.id);
  }, [session?.user, loadProfile]);

  // Language: an explicit choice always wins; otherwise adopt the saved
  // profile language, and persist the detected one on first sign-in.
  useEffect(() => {
    if (!profile || !session?.user) return;
    const saved = normalizeLocale(profile.language);
    if (!isExplicit && saved && saved !== locale) {
      setLocale(saved, false);
      return;
    }
    if (saved !== locale) {
      void updateProfile(session.user.id, { language: locale });
      setProfile((prev) => (prev ? { ...prev, language: locale } : prev));
    }
  }, [profile, session?.user, locale, isExplicit, setLocale]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      telegramStatus,
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user.id);
      },
      saveProfile: async (patch) => {
        if (!session?.user) return;
        await updateProfile(session.user.id, patch);
        setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
        if (patch.language) setLocale(patch.language as Locale);
      },
      signInWithTelegram: async () => {
        if (!isTelegramEnvironment()) throw new Error("Not in Telegram");
        const initData = getTelegramInitData();
        if (!initData) throw new Error("No Telegram init data");
        
        const result = await telegramSignIn({ data: { initData } });
        if (!result.ok) throw new Error("Telegram sign in failed");
        
        const { error } = await supabase.auth.verifyOtp({
          token_hash: result.tokenHash,
          type: "email",
        });
        if (error) throw error;
      },
      signInWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUpWithEmail: async (email, password, fullName) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, language: locale },
          },
        });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [session, profile, loading, telegramStatus, loadProfile, locale, setLocale],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
