import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { searchPosts } from "../../services/search.js";
import { StatusMessage } from "@inkjs/ui";

export function SearchPosts() {
  const { goBack } = useNavigation();
  const [results, setResults] = useState<Record<string, unknown>[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      if (results || error) {
        setResults(null);
        setError(null);
      } else {
        goBack();
      }
    }
  });

  const doSearch = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      setResults(await searchPosts(q));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Search Posts" />
      <Box>
        <Text bold>Query: </Text>
        <TextInput
          placeholder="Search for posts..."
          onSubmit={(value) => {
            if (value) doSearch(value);
          }}
        />
      </Box>
      {loading && <Spinner label="Searching..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {results && results.length === 0 && (
        <Box marginTop={1}>
          <Text dimColor>No results found.</Text>
        </Box>
      )}
      {results && results.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {results.map((r, i) => {
            const post = r.post as Record<string, unknown> | undefined;
            const blog = r.blog as Record<string, unknown> | undefined;
            const blogSlug = String(blog?.slug || blog?.url || "").replace(/^@/, "");
            const postSlug = String(post?.slug || "");
            const url = blogSlug && postSlug
              ? `https://paragraph.com/@${encodeURIComponent(blogSlug)}/${encodeURIComponent(postSlug)}`
              : "";

            return (
              <Box key={i} flexDirection="column" marginBottom={1}>
                <Text bold>{String(post?.title || "Untitled")}</Text>
                <Box>
                  <Text dimColor>by </Text>
                  <Text>{String(blog?.name || "Unknown")}</Text>
                </Box>
                {url && (
                  <Text dimColor underline>{url}</Text>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
