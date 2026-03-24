import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { importSubscribers } from "../../services/subscribers.js";

export function SubscriberImport() {
  const { goBack } = useNavigation();
  const { apiKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const submit = async (csvPath: string) => {
    setLoading(true);
    try {
      await importSubscribers(csvPath, apiKey!);
      setMessage(`Subscribers imported from ${csvPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Import Subscribers" />
      {!message && !loading && (
        <Box>
          <Text bold>CSV file path: </Text>
          <TextInput
            placeholder="./subscribers.csv"
            onSubmit={(value) => {
              if (value) submit(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Importing subscribers..." />}
      {message && (
        <StatusMessage variant="success">{message}</StatusMessage>
      )}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
    </Box>
  );
}
