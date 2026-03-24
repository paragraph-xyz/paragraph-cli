import React from "react";
import { Box, useInput } from "ink";
import { Select } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation, Screen } from "../hooks/useNavigation.js";

const items = [
  { label: "Search posts", value: "search-posts" },
  { label: "Search blogs", value: "search-blogs" },
] as const;

export function SearchMenu() {
  const { navigate, goBack } = useNavigation();

  useInput((_input: string, key: { escape?: boolean }) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Search" />
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
