import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { DataView } from "../components/DataView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { getCoin } from "../../services/coins.js";

export function CoinDetail() {
  const { goBack } = useNavigation();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const lookup = async (idOrAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      setData(await getCoin(idOrAddress));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Coin" />
      {!data && !loading && (
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
      {loading && <Spinner label="Loading coin..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {data && (
        <DataView
          data={{
            ID: data.id,
            Name:
              (data.metadata as Record<string, unknown> | undefined)?.name ||
              data.name,
            Ticker:
              (data.metadata as Record<string, unknown> | undefined)?.symbol ||
              data.ticker,
            Contract: data.contractAddress,
            Publication: data.publicationId,
          }}
        />
      )}
    </Box>
  );
}
