import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { getPostsByTag } from "../../services/posts.js";

function formatDate(raw: unknown): string {
  if (!raw) return "";
  const n = Number(raw);
  const date = isNaN(n) ? new Date(raw as string) : new Date(n);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function PostsByTag() {
  const { goBack } = useNavigation();
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

  const lookup = async (tag: string) => {
    setLoading(true);
    setError(null);
    try {
      setPosts(await getPostsByTag(tag));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Posts by Tag" />
      {!posts && !loading && (
        <Box>
          <Text bold>Tag: </Text>
          <TextInput
            placeholder="Enter tag name..."
            onSubmit={(value) => {
              if (value) lookup(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Loading posts..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {posts && posts.length === 0 && <Text dimColor>No posts found with this tag.</Text>}
      {posts && posts.length > 0 && (
        <Box flexDirection="column">
          {posts.map((p, i) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text bold>{String(p.title || "Untitled")}</Text>
              <Text dimColor>
                {String(p.status || "")}
                {p.publishedAt || p.createdAt ? ` · ${formatDate(p.publishedAt || p.createdAt)}` : ""}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
