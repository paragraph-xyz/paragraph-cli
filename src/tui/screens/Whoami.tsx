import React from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { DataView } from "../components/DataView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { useApi } from "../hooks/useApi.js";
import { whoami } from "../../services/auth.js";

export function Whoami() {
  const { goBack } = useNavigation();
  const { apiKey } = useAuth();
  const { data, loading, error } = useApi(() => whoami(apiKey!));

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Who Am I" />
      {loading && <Spinner label="Loading..." />}
      {error && (
        <StatusMessage variant="error">{error.message}</StatusMessage>
      )}
      {data && (
        <DataView
          data={{
            Name: data.name,
            Slug: data.slug,
            Domain: data.customDomain,
          }}
        />
      )}
    </Box>
  );
}
