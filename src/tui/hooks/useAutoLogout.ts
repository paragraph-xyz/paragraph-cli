import { useCallback } from "react";
import { ParagraphApiError } from "@paragraph-com/sdk";
import { useAuth } from "./useAuth.js";
import { useNavigation } from "./useNavigation.js";

export function useAutoLogout() {
  const { logout } = useAuth();
  const { navigate } = useNavigation();

  return useCallback(
    (err: unknown): boolean => {
      if (err instanceof ParagraphApiError && err.status === 401) {
        logout();
        navigate({ name: "login" });
        return true;
      }
      return false;
    },
    [logout, navigate]
  );
}
