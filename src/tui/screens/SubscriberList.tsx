import React from "react";
import { Box, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { TableView } from "../components/TableView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { useApi } from "../hooks/useApi.js";
import { listSubscribers } from "../../services/subscribers.js";

export function SubscriberList() {
  const { goBack } = useNavigation();
  const { apiKey } = useAuth();
  const { data, loading, error } = useApi(() =>
    listSubscribers(apiKey!)
  );

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Subscribers" />
      {loading && <Spinner label="Loading subscribers..." />}
      {error && (
        <StatusMessage variant="error">{error.message}</StatusMessage>
      )}
      {data && (
        <TableView
          headers={["Email", "Wallet", "Date"]}
          rows={data.map((s) => [
            String(s.email || ""),
            String(s.walletAddress || ""),
            s.createdAt
              ? new Date(s.createdAt as string).toLocaleDateString()
              : "",
          ])}
        />
      )}
    </Box>
  );
}
