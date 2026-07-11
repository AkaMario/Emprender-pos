import {
  clearSessions,
  createSession,
  createUser,
  deleteExpiredSessions,
  getFirstUser,
  getUserByCredentials,
  getValidSessionUser,
  type AuthUser,
} from "@/database/auth-database";
import React, { createContext, useContext, useEffect, useState } from "react";

const SESSION_DAYS = 30;
const SESSION_TTL = SESSION_DAYS * 24 * 60 * 60 * 1000;

export const SECURITY_QUESTIONS = [
  "Cual fue el nombre de tu primera mascota?",
  "En que ciudad naciste?",
  "Cual es tu comida favorita?",
  "Cual fue el nombre de tu primera escuela?",
];

type StoredToken = {
  value: string;
  expiresAt: number;
};

type RegisterInput = {
  username: string;
  password: string;
  pin: string;
  securityQuestion: string;
  securityAnswer: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasUser: boolean;
  username?: string;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalize(value: string) {
  return value.trim();
}

function createToken(): StoredToken {
  return {
    value: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    expiresAt: Date.now() + SESSION_TTL,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        await deleteExpiredSessions();
        const [storedUser, sessionUser] = await Promise.all([
          getFirstUser(),
          getValidSessionUser(),
        ]);

        if (!mounted) {
          return;
        }

        setUser(sessionUser ?? storedUser);
        setIsAuthenticated(Boolean(sessionUser));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function persistSession(nextUser: AuthUser, rememberMe = true) {
    const token = createToken();

    if (rememberMe) {
      await createSession(nextUser.id, token.value, token.expiresAt);
    }

    setUser(nextUser);
    setIsAuthenticated(true);
  }

  async function register(input: RegisterInput) {
    const nextUser = await createUser({
      username: normalize(input.username),
      password: input.password,
      pin: input.pin,
      securityQuestion: input.securityQuestion,
      securityAnswer: normalize(input.securityAnswer).toLowerCase(),
    });

    await persistSession(nextUser);
  }

  async function login(username: string, password: string, rememberMe = true) {
    const hasStoredUser = user ?? (await getFirstUser());

    if (!hasStoredUser) {
      throw new Error("No hay un usuario registrado en este dispositivo.");
    }

    const nextUser = await getUserByCredentials(normalize(username), password);

    if (!nextUser) {
      throw new Error("Usuario o contrasena incorrectos.");
    }

    await persistSession(nextUser, rememberMe);
  }

  async function logout() {
    await clearSessions();
    const storedUser = await getFirstUser();

    setUser(storedUser);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        hasUser: Boolean(user),
        username: user?.username,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return value;
}
