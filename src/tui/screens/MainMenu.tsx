import React from "react";
import { Box, Text } from "ink";
import { Select } from "@inkjs/ui";
import { Logo } from "../components/Logo.js";
import { useNavigation, Screen } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";

const menuItems = [
  { label: "My Account", value: "account" },
  { label: "Posts", value: "posts-menu" },
  { label: "Publications", value: "publications-menu" },
  { label: "Search", value: "search-menu" },
  { label: "Users", value: "user-detail" },
  { label: "Coins", value: "coins-menu" },
] as const;

export function MainMenu() {
  const { navigate } = useNavigation();
  const { isLoggedIn, user } = useAuth();

  return (
    <Box flexDirection="column">
      <Logo />
      {isLoggedIn && user && (
        <Box marginBottom={1}>
          <Text dimColor>Logged in as </Text>
          <Text bold color="green">{user.name || user.slug}</Text>
        </Box>
      )}
      <Select
        options={menuItems.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        onChange={(value) => navigate({ name: value } as Screen)}
      />
    </Box>
  );
}
