import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { searchBlogs } from "../../services/search.js";
import { StatusMessage } from "@inkjs/ui";

export function SearchBlogs() {
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
      setResults(await searchBlogs(q));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Search Blogs" />
      <Box>
        <Text bold>Query: </Text>
        <TextInput
          placeholder="Search for blogs..."
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
            const blog = r.blog as Record<string, unknown> | undefined;
            const slug = String(blog?.slug || blog?.url || "").replace(/^@/, "");
            const url = slug
              ? `https://paragraph.com/@${encodeURIComponent(slug)}`
              : "";
            const subscribers = r.activeSubscriberCount;

            return (
              <Box key={i} flexDirection="column" marginBottom={1}>
                <Text bold>{String(blog?.name || "Unknown")}</Text>
                {subscribers != null && (
                  <Text dimColor>{String(subscribers)} subscribers</Text>
                )}
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
