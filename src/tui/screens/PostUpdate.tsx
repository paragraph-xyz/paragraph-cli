import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { updatePost } from "../../services/posts.js";
import * as fs from "fs";

type Step = "id" | "title" | "file" | "updating" | "done" | "error";

export function PostUpdate() {
  const { goBack, screen } = useNavigation();
  const { apiKey } = useAuth();
  const initialId =
    screen.name === "post-update" ? screen.params.id : "";
  const [step, setStep] = useState<Step>(initialId ? "title" : "id");
  const [idOrSlug, setIdOrSlug] = useState(initialId);
  const [title, setTitle] = useState("");
  const [filePath, setFilePath] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useInput((_input, key) => {
    if (key.escape && (step === "id" || step === "done" || step === "error")) {
      goBack();
    }
  });

  const submit = async () => {
    setStep("updating");
    try {
      let markdown: string | undefined;
      if (filePath) markdown = fs.readFileSync(filePath, "utf-8");

      await updatePost(idOrSlug, {
        apiKey: apiKey!,
        title: title || undefined,
        markdown,
      });
      setMessage(`Post updated: ${idOrSlug}`);
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  return (
    <Box flexDirection="column">
      <Header title="Update Post" />

      {step === "id" && (
        <Box>
          <Text bold>Post ID or slug: </Text>
          <TextInput
            placeholder="Enter post ID or slug..."
            onSubmit={(value) => {
              if (value) {
                setIdOrSlug(value);
                setStep("title");
              }
            }}
          />
        </Box>
      )}

      {step === "title" && (
        <Box flexDirection="column">
          <Text dimColor>Post: {idOrSlug}</Text>
          <Box>
            <Text bold>New title (enter to skip): </Text>
            <TextInput
              placeholder="Leave empty to keep current..."
              onSubmit={(value) => {
                setTitle(value);
                setStep("file");
              }}
            />
          </Box>
        </Box>
      )}

      {step === "file" && (
        <Box flexDirection="column">
          <Text dimColor>Post: {idOrSlug}</Text>
          {title && <Text dimColor>New title: {title}</Text>}
          <Box>
            <Text bold>New content file (enter to skip): </Text>
            <TextInput
              placeholder="./updated-post.md"
              onSubmit={(value) => {
                setFilePath(value);
                submit();
              }}
            />
          </Box>
        </Box>
      )}

      {step === "updating" && <Spinner label="Updating post..." />}
      {step === "done" && (
        <StatusMessage variant="success">{message}</StatusMessage>
      )}
      {step === "error" && (
        <StatusMessage variant="error">{errorMsg}</StatusMessage>
      )}
    </Box>
  );
}
