import React from "react";
import { Box, useApp, useInput } from "ink";
import { NavigationProvider, Screen } from "./hooks/useNavigation.js";
import { AuthProvider } from "./hooks/useAuth.js";
import { Router } from "./Router.js";
import { StatusBar } from "./components/StatusBar.js";

export function App({ initial }: { initial?: Screen }) {
  const { exit } = useApp();

  useInput((_input, key) => {
    if (key.ctrl && _input === "c") {
      exit();
    }
  });

  return (
    <AuthProvider>
      <NavigationProvider initial={initial}>
        <Box flexDirection="column" paddingX={1} paddingY={1}>
          <Router />
          <StatusBar />
        </Box>
      </NavigationProvider>
    </AuthProvider>
  );
}
