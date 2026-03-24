import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { DataView } from "../components/DataView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { getUser } from "../../services/users.js";

export function UserDetail() {
  const { goBack } = useNavigation();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const lookup = async (idOrWallet: string) => {
    setLoading(true);
    setError(null);
    try {
      setData(await getUser(idOrWallet));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="User" />
      {!data && !loading && (
        <Box>
          <Text bold>User ID or wallet address: </Text>
          <TextInput
            placeholder="Enter ID or 0x..."
            onSubmit={(value) => {
              if (value) lookup(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Loading user..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {data && (
        <DataView
          data={{
            ID: data.id,
            Name: data.name,
            Wallet: data.walletAddress,
            Publication: data.publicationId,
            Bio: data.bio,
          }}
        />
      )}
    </Box>
  );
}
