"use client";

import { useState, useEffect } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return { ...state, signOut };
}
