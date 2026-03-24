import React, { createContext, useContext, useState, useCallback } from "react";

export type Screen =
  | { name: "main-menu" }
  | { name: "account" }
  | { name: "my-posts" }
  | { name: "my-subscribers" }
  | { name: "login" }
  | { name: "whoami" }
  | { name: "posts-menu" }
  | { name: "get-post" }
  | { name: "feed" }
  | { name: "posts-by-tag" }
  | { name: "browse-posts" }
  | { name: "post-list"; params?: { status?: string } }
  | { name: "post-detail"; params: { id: string } }
  | { name: "post-create" }
  | { name: "post-update"; params: { id: string } }
  | { name: "post-delete"; params: { id: string } }
  | { name: "publications-menu" }
  | { name: "publication-detail" }
  | { name: "my-publication" }
  | { name: "search-menu" }
  | { name: "search-posts" }
  | { name: "search-blogs" }
  | { name: "subscriber-list" }
  | { name: "subscriber-add" }
  | { name: "subscriber-import" }
  | { name: "coins-menu" }
  | { name: "coin-detail" }
  | { name: "coin-search" }
  | { name: "coin-holders" }
  | { name: "popular-coins" }
  | { name: "subscriber-count" }
  | { name: "user-detail" };

interface NavigationContextValue {
  screen: Screen;
  navigate: (screen: Screen) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextValue>(null!);

export function NavigationProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Screen;
}) {
  const [stack, setStack] = useState<Screen[]>([
    initial || { name: "main-menu" },
  ]);

  const screen = stack[stack.length - 1]!;

  const navigate = useCallback((s: Screen) => {
    setStack((prev) => [...prev, s]);
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  return (
    <NavigationContext.Provider
      value={{ screen, navigate, goBack, canGoBack: stack.length > 1 }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
