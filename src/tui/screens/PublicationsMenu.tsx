import React from "react";
import { Box, useInput } from "ink";
import { Select } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation, Screen } from "../hooks/useNavigation.js";

const items = [
  { label: "Publication info", value: "publication-detail" },
  { label: "Publication posts", value: "browse-posts" },
  { label: "Subscriber count", value: "subscriber-count" },
] as const;

export function PublicationsMenu() {
  const { navigate, goBack } = useNavigation();

  useInput((_input: string, key: { escape?: boolean }) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Publications" />
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
