import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { DataView } from "../components/DataView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { getPublication } from "../../services/publications.js";

export function PublicationDetail() {
  const { goBack } = useNavigation();
  const { apiKey } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const lookup = async (idOrSlug: string) => {
    setLoading(true);
    setError(null);
    try {
      const pub = await getPublication(idOrSlug, apiKey);
      setData(pub);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Publication" />
      {!data && !loading && (
        <Box>
          <Text bold>Publication ID or slug: </Text>
          <TextInput
            placeholder="Enter ID or slug..."
            onSubmit={(value) => {
              if (value) lookup(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Loading publication..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
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
