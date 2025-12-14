import React, { createContext, useContext, useEffect, useState } from "react";

type User = any;
const UserContext = createContext<{user:User|null, loading:boolean, refresh:()=>Promise<void>} | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return <UserContext.Provider value={{ user, loading, refresh: load }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}