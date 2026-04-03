import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { addSubscriber } from "../../services/subscribers.js";

export function SubscriberAdd() {
  const { goBack } = useNavigation();
  const { apiKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const submit = async (email: string) => {
    setLoading(true);
    try {
      await addSubscriber({ email }, apiKey!);
      setMessage(`Subscriber added: ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <Box flexDirection="column">
      <Header title="Add Subscriber" />
      {!message && !loading && (
        <Box>
          <Text bold>Email: </Text>
          <TextInput
            placeholder="subscriber@example.com"
            onSubmit={(value) => {
              if (value) submit(value);
            }}
          />
        </Box>
      )}
      {loading && <Spinner label="Adding subscriber..." />}
      {message && (
        <StatusMessage variant="success">{message}</StatusMessage>
      )}
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
    </Box>
  );
}
