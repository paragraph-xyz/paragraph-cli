import React from "react";
import { Box, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { DataView } from "../components/DataView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { useApi } from "../hooks/useApi.js";
import { whoami } from "../../services/auth.js";
import { getPublication } from "../../services/publications.js";

export function MyPublication() {
  const { goBack } = useNavigation();
  const { apiKey } = useAuth();

  const { data, loading, error } = useApi(async () => {
    const me = await whoami(apiKey!);
    if (!me.slug) throw new Error("Could not determine your publication slug.");
    return getPublication(me.slug);
  });

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="My Publication" />
      {loading && <Spinner label="Loading your publication..." />}
      {error && (
        <StatusMessage variant="error">{error.message}</StatusMessage>
      )}
      {data && (
        <DataView
          data={{
            Name: (data.name || data.blogName) as string,
            Slug: (data.slug || data.url) as string,
            Domain: (data.customDomain || data.domain) as string,
            Description: (data.description || data.summary) as string,
          }}
        />
      )}
    </Box>
  );
}
