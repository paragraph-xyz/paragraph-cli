import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { listPosts } from "../../services/posts.js";

function formatDate(raw: unknown): string {
  if (!raw) return "";
  const n = Number(raw);
  const date = isNaN(n) ? new Date(raw as string) : new Date(n);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function BrowsePosts() {
  const { goBack, navigate } = useNavigation();
  const [posts, setPosts] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      if (posts || error) {
        setPosts(null);
        setError(null);
      } else {
        goBack();
      }
    }
  });

  const lookup = async (publicationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const items = await listPosts({ publicationId });
      setPosts(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Posts" />
      {!posts && !loading && (
        <Box>
          <Text bold>Publication ID or slug: </Text>
          <TextInput
            placeholder="Enter publication ID or slug..."
            onSubmit={(value) => {
              if (value) lookup(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Loading posts..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {posts && posts.length === 0 && <Text dimColor>No posts found.</Text>}
      {posts && posts.length > 0 && (
        <Select
          options={posts.map((p) => ({
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
