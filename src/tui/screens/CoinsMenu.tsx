import React from "react";
import { Box, useInput } from "ink";
import { Select } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation, Screen } from "../hooks/useNavigation.js";

const items = [
  { label: "View coin details", value: "coin-detail" },
  { label: "Popular coins", value: "popular-coins" },
  { label: "Search coins", value: "coin-search" },
  { label: "View coin holders", value: "coin-holders" },
] as const;

export function CoinsMenu() {
  const { navigate, goBack } = useNavigation();

  useInput((_input: string, key: { escape?: boolean }) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Coins" />
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
