import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner, ConfirmInput } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { deletePost } from "../../services/posts.js";

type Step = "id" | "confirm" | "deleting" | "done" | "error";

export function PostDelete() {
  const { goBack, screen } = useNavigation();
  const { apiKey } = useAuth();
  const initialId =
    screen.name === "post-delete" ? screen.params.id : "";
  const [step, setStep] = useState<Step>(initialId ? "confirm" : "id");
  const [idOrSlug, setIdOrSlug] = useState(initialId);
  const [errorMsg, setErrorMsg] = useState("");

  useInput((_input, key) => {
    if (key.escape && (step === "id" || step === "done" || step === "error")) {
      goBack();
    }
  });

  const submit = async () => {
    setStep("deleting");
    try {
      await deletePost(idOrSlug, apiKey!);
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  return (
    <Box flexDirection="column">
      <Header title="Delete Post" />

      {step === "id" && (
        <Box>
          <Text bold>Post ID or slug to delete: </Text>
          <TextInput
            placeholder="Enter post ID or slug..."
            onSubmit={(value) => {
              if (value) {
                setIdOrSlug(value);
                setStep("confirm");
              }
            }}
          />
        </Box>
      )}

      {step === "confirm" && (
        <Box>
          <Text>Delete post "{idOrSlug}"? </Text>
          <ConfirmInput
            onConfirm={() => submit()}
            onCancel={() => goBack()}
          />
        </Box>
      )}

      {step === "deleting" && <Spinner label="Deleting post..." />}
      {step === "done" && (
        <StatusMessage variant="success">
          Post deleted: {idOrSlug}
        </StatusMessage>
      )}
      {step === "error" && (
        <StatusMessage variant="error">{errorMsg}</StatusMessage>
      )}
    </Box>
  );
}
