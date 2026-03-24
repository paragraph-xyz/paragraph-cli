import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { ScrollableList } from "../components/ScrollableList.js";
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
        process.stdout.write("\x1B[2J\x1B[H");
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
      const result = await getPostsByTag(tag);
      setPosts(result.items);
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
      {posts && (
        <ScrollableList
          items={posts}
          renderItem={(p, i) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text bold>{String(p.title || "Untitled")}</Text>
              <Text dimColor>
                {String(p.status || "")}
                {p.publishedAt || p.createdAt ? ` · ${formatDate(p.publishedAt || p.createdAt)}` : ""}
              </Text>
            </Box>
          )}
        />
      )}
    </Box>
  );
}
