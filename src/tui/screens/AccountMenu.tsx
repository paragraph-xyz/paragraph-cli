import React from "react";
import { Box, useInput } from "ink";
import { Select } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation, Screen } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";

const items = [
  { label: "My Posts", value: "my-posts" },
  { label: "My Subscribers", value: "my-subscribers" },
  { label: "My Publication", value: "my-publication" },
  { label: "Logout", value: "logout" },
] as const;

export function AccountMenu() {
  const { navigate, goBack } = useNavigation();
  const { logout } = useAuth();

  useInput((_input: string, key: { escape?: boolean }) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="My Account" />
      <Select
        options={items.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        onChange={(value) => {
          if (value === "logout") {
            logout();
          } else {
            navigate({ name: value } as Screen);
          }
        }}
      />
    </Box>
  );
}
