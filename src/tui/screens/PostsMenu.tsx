import React from "react";
import { Box, useInput } from "ink";
import { Select } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation, Screen } from "../hooks/useNavigation.js";

const items = [
  { label: "Get post", value: "get-post" },
  { label: "Get feed", value: "feed" },
  { label: "Posts by tag", value: "posts-by-tag" },
] as const;

export function PostsMenu() {
  const { navigate, goBack } = useNavigation();

  useInput((_input: string, key: { escape?: boolean }) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Posts" />
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
