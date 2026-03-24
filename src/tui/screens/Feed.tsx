import React from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { ScrollableList } from "../components/ScrollableList.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useApi } from "../hooks/useApi.js";
import { getFeed } from "../../services/posts.js";

export function Feed() {
  const { goBack } = useNavigation();
  const { data, loading, error } = useApi(() => getFeed());

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Feed" />
      {loading && <Spinner label="Loading feed..." />}
      {error && (
        <StatusMessage variant="error">{error.message}</StatusMessage>
      )}
      {data && (
        <ScrollableList
          items={data.items}
          renderItem={(item, i) => {
            const post = item.post as Record<string, unknown> | undefined;
            const pub = item.publication as Record<string, unknown> | undefined;
            const pubSlug = String(pub?.slug || pub?.url || "").replace(/^@/, "");
            const postSlug = String(post?.slug || "");
            const url = pubSlug && postSlug
              ? `https://paragraph.com/@${encodeURIComponent(pubSlug)}/${encodeURIComponent(postSlug)}`
              : "";

            return (
              <Box key={i} flexDirection="column" marginBottom={1}>
                <Text bold>{String(post?.title || "Untitled")}</Text>
                <Box>
                  <Text dimColor>by </Text>
                  <Text>{String(pub?.name || "Unknown")}</Text>
                </Box>
                {url && (
                  <Text dimColor underline>{url}</Text>
                )}
              </Box>
            );
          }}
        />
      )}
    </Box>
  );
}
