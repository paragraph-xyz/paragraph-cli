import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useAuth } from "../hooks/useAuth.js";
import { createPost } from "../../services/posts.js";
import * as fs from "fs";

type Step = "title" | "subtitle" | "file" | "tags" | "creating" | "done" | "error";

export function PostCreate() {
  const { goBack } = useNavigation();
  const { apiKey } = useAuth();
  const [step, setStep] = useState<Step>("title");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [filePath, setFilePath] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useInput((_input, key) => {
    if (key.escape && (step === "title" || step === "done" || step === "error")) {
      goBack();
    }
  });

  const submit = async () => {
    setStep("creating");
    try {
      let markdown = "";
      if (filePath) {
        markdown = fs.readFileSync(filePath, "utf-8");
      } else {
        throw new Error("A file path is required for post content.");
      }
      const post = await createPost({
        apiKey: apiKey!,
        title,
        markdown,
        subtitle: subtitle || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
      });
      setMessage(`Post created: ${post.title}`);
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  return (
    <Box flexDirection="column">
      <Header title="Create Post" />

      {step === "title" && (
        <Box>
          <Text bold>Title: </Text>
          <TextInput
            placeholder="Enter post title..."
            onSubmit={(value) => {
              if (value) {
                setTitle(value);
                setStep("subtitle");
              }
            }}
          />
        </Box>
      )}

      {step === "subtitle" && (
        <Box flexDirection="column">
          <Text dimColor>Title: {title}</Text>
          <Box>
            <Text bold>Subtitle (enter to skip): </Text>
            <TextInput
              placeholder="Optional subtitle..."
              onSubmit={(value) => {
                setSubtitle(value);
                setStep("file");
              }}
            />
          </Box>
        </Box>
      )}

      {step === "file" && (
        <Box flexDirection="column">
          <Text dimColor>Title: {title}</Text>
          {subtitle && <Text dimColor>Subtitle: {subtitle}</Text>}
          <Box>
            <Text bold>Markdown file path: </Text>
            <TextInput
              placeholder="./post.md"
              onSubmit={(value) => {
                if (value) {
                  setFilePath(value);
                  setStep("tags");
                }
              }}
            />
          </Box>
        </Box>
      )}

      {step === "tags" && (
        <Box flexDirection="column">
          <Text dimColor>Title: {title}</Text>
          {subtitle && <Text dimColor>Subtitle: {subtitle}</Text>}
          <Text dimColor>File: {filePath}</Text>
          <Box>
            <Text bold>Tags (comma-separated, enter to skip): </Text>
            <TextInput
              placeholder="tag1, tag2"
              onSubmit={(value) => {
                setTags(value);
                submit();
              }}
            />
          </Box>
        </Box>
      )}

      {step === "creating" && <Spinner label="Creating post..." />}
      {step === "done" && (
        <StatusMessage variant="success">{message}</StatusMessage>
      )}
      {step === "error" && (
        <StatusMessage variant="error">{errorMsg}</StatusMessage>
      )}
    </Box>
  );
}
