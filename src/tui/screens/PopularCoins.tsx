import React from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useApi } from "../hooks/useApi.js";
import { getPopularCoins } from "../../services/coins.js";

export function PopularCoins() {
  const { goBack } = useNavigation();
  const { data, loading, error } = useApi(() => getPopularCoins());

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column">
      <Header title="Popular Coins" />
      {loading && <Spinner label="Loading popular coins..." />}
      {error && (
        <StatusMessage variant="error">{error.message}</StatusMessage>
      )}
      {data && data.length === 0 && <Text dimColor>No coins found.</Text>}
      {data && data.length > 0 && (
        <Box flexDirection="column">
          {data.map((c, i) => {
            const metadata = c.metadata as Record<string, unknown> | undefined;
            return (
              <Box key={i} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text bold>{String(metadata?.name || c.name || "Unknown")}</Text>
                  <Text dimColor> ({String(metadata?.symbol || c.ticker || "")})</Text>
                </Box>
                <Text dimColor>{String(c.contractAddress || "")}</Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
