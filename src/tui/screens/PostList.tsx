import React from "react";
import { Box, Text, useInput } from "ink";
import { Select, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { useApi } from "../hooks/useApi.js";
import { listPosts } from "../../services/posts.js";

function formatDate(raw: unknown): string {
  if (!raw) return "";
  const n = Number(raw);
  const date = isNaN(n) ? new Date(raw as string) : new Date(n);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function PostList() {
  const { goBack, navigate } = useNavigation();
  const { apiKey } = useAuth();
  const { data, loading, error } = useApi(() =>
    listPosts({ apiKey })
  );

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Posts" />
      {loading && <Spinner label="Loading posts..." />}
      {error && (
        <StatusMessage variant="error">{error.message}</StatusMessage>
      )}
      {data && data.length === 0 && <Text dimColor>No posts found.</Text>}
      {data && data.length > 0 && (
        <Select
          options={data.map((p) => ({
            label: `${p.title || "Untitled"}`,
            value: String(p.id),
            description: `${p.status || ""} · ${formatDate(p.publishedAt || p.createdAt)}`,
          }))}
          onChange={(id) => navigate({ name: "post-detail", params: { id } })}
        />
      )}
    </Box>
  );
}
