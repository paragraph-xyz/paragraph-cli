import React from "react";
import { Box, Text } from "ink";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigation } from "../hooks/useNavigation.js";

export function StatusBar() {
  const { isLoggedIn } = useAuth();
  const { canGoBack } = useNavigation();

  return (
    <Box marginTop={1}>
      <Text dimColor>
        {canGoBack ? "esc back  " : ""}
        {"ctrl+c quit"}
        {isLoggedIn ? "" : "  (not logged in)"}
      </Text>
    </Box>
  );
}
