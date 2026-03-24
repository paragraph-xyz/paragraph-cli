import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { getSubscriberCount } from "../../services/subscribers.js";

export function SubscriberCount() {
  const { goBack } = useNavigation();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      if (count != null || error) {
        setCount(null);
        setError(null);
      } else {
        goBack();
      }
    }
  });

  const lookup = async (pubId: string) => {
    setLoading(true);
    setError(null);
    try {
      setCount(await getSubscriberCount(pubId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Subscriber Count" />
      {count == null && !loading && !error && (
        <Box>
          <Text bold>Publication ID: </Text>
          <TextInput
            placeholder="Enter publication ID..."
            onSubmit={(value) => {
              if (value) lookup(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Loading..." />}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {count != null && (
        <Box>
          <Text bold>Subscribers: </Text>
          <Text>{String(count)}</Text>
        </Box>
      )}
    </Box>
  );
}
