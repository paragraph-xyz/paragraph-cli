import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { TableView } from "../components/TableView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { getCoinHolders } from "../../services/coins.js";

export function CoinHolders() {
  const { goBack } = useNavigation();
  const [holders, setHolders] = useState<Record<string, unknown>[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const lookup = async (idOrAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      setHolders(await getCoinHolders(idOrAddress));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Coin Holders" />
      {!holders && !loading && (
        <Box>
          <Text bold>Coin ID or address: </Text>
          <TextInput
            placeholder="Enter ID or 0x..."
            onSubmit={(value) => {
              if (value) lookup(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Loading holders..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {holders && (
        <Box marginTop={1}>
          <TableView
            headers={["Wallet", "Balance"]}
            rows={holders.map((h) => [
              String(h.walletAddress || h.address || ""),
              String(h.balance || ""),
            ])}
          />
        </Box>
      )}
    </Box>
  );
}
