import React from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { DataView } from "../components/DataView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { useApi } from "../hooks/useApi.js";
import { getPost } from "../../services/posts.js";

export function PostDetail() {
  const { goBack, screen } = useNavigation();
  const { apiKey } = useAuth();
  const id =
    screen.name === "post-detail" ? screen.params.id : "";
  const { data, loading, error } = useApi(() => getPost(id, apiKey));

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const markdown = data?.markdown as string | undefined;

  return (
    <Box flexDirection="column">
      <Header title="Post Detail" />
      {loading && <Spinner label="Loading post..." />}
      {error && (
        <StatusMessage variant="error">{error.message}</StatusMessage>
      )}
      {data && (
        <Box flexDirection="column">
          <DataView
            data={{
              Title: data.title,
              Subtitle: data.subtitle,
              Status: data.status,
              Date: data.createdAt,
            }}
          />
          {markdown && (
            <Box marginTop={1} flexDirection="column">
              <Text dimColor>{"─".repeat(50)}</Text>
              <Text>{markdown}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
