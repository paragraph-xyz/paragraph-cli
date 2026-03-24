import { useCallback } from "react";
import { useAuth } from "./useAuth.js";
import { useNavigation } from "./useNavigation.js";

export function useAutoLogout() {
  const { logout } = useAuth();
  const { navigate } = useNavigation();

  return useCallback(
    (err: unknown): boolean => {
      if (
        typeof err === "object" &&
        err !== null &&
        "isAxiosError" in err
      ) {
        const resp = (err as { response?: { status?: number } }).response;
        if (resp?.status === 401) {
          logout();
          navigate({ name: "login" });
          return true;
        }
      }
      return false;
    },
    [logout, navigate]
  );
}
