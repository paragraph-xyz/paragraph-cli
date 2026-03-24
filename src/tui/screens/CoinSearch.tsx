import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { TableView } from "../components/TableView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { searchCoins } from "../../services/coins.js";

export function CoinSearch() {
  const { goBack } = useNavigation();
  const [results, setResults] = useState<Record<string, unknown>[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const doSearch = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      setResults(await searchCoins(q));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Search Coins" />
      <Box>
        <Text bold>Query: </Text>
        <TextInput
          placeholder="Search for coins..."
          onSubmit={(value) => {
            if (value) doSearch(value);
          }}
        />
      </Box>
      {loading && <Spinner label="Searching..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {results && (
        <Box marginTop={1}>
          <TableView
            headers={["Ticker", "Publication", "Contract"]}
            rows={results.map((r) => {
              const coin = r.coin as Record<string, unknown> | undefined;
              const blog = r.blog as Record<string, unknown> | undefined;
              return [
                String(coin?.ticker || ""),
                String(blog?.name || ""),
                String(coin?.contractAddress || ""),
              ];
            })}
          />
        </Box>
      )}
    </Box>
  );
}
