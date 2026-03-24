import React from "react";
import { Box, useInput } from "ink";
import { Select } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation, Screen } from "../hooks/useNavigation.js";

const items = [
  { label: "List subscribers", value: "subscriber-list" },
  { label: "Add subscriber", value: "subscriber-add" },
  { label: "Import from CSV", value: "subscriber-import" },
] as const;

export function MySubscribersMenu() {
  const { navigate, goBack } = useNavigation();

  useInput((_input: string, key: { escape?: boolean }) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="My Account > My Subscribers" />
      <Select
        options={items.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
        onChange={(value) => navigate({ name: value } as Screen)}
      />
    </Box>
  );
}
