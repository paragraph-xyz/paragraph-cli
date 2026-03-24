import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Select, TextInput, Spinner } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { DataView } from "../components/DataView.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { getPost, getPostBySlugs, getPostByPubIdAndSlug } from "../../services/posts.js";

type Method = "choose" | "by-id" | "by-pub-slug" | "by-pub-id";
type Step = Method | "input-1" | "input-2" | "loading" | "result" | "error";

export function GetPost() {
  const { goBack } = useNavigation();
  const [step, setStep] = useState<Step>("choose");
  const [input1, setInput1] = useState("");
  const [method, setMethod] = useState<Method>("choose");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useInput((_input, key) => {
    if (key.escape) {
      if (data || errorMsg) {
        setData(null);
        setErrorMsg("");
        setInput1("");
        setStep("choose");
      } else if (step === "input-1" || step === "input-2") {
        setStep("choose");
      } else {
        goBack();
      }
    }
  });

  const fetchPost = async (fn: () => Promise<Record<string, unknown>>) => {
    setStep("loading");
    try {
      setData(await fn());
      setStep("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  const markdown = data?.markdown as string | undefined;

  if (step === "choose") {
    return (
      <Box flexDirection="column">
        <Header title="Get Post" />
        <Select
          options={[
            { label: "By post ID", value: "by-id" },
            { label: "By publication slug + post slug", value: "by-pub-slug" },
            { label: "By publication ID + post slug", value: "by-pub-id" },
          ]}
          onChange={(value) => {
            setMethod(value as Method);
            setStep("input-1");
          }}
        />
      </Box>
    );
  }

  if (step === "input-1") {
    if (method === "by-id") {
      return (
        <Box flexDirection="column">
          <Header title="Get Post" />
          <Box>
            <Text bold>Post ID: </Text>
            <TextInput
              placeholder="Enter post ID..."
              onSubmit={(value) => {
                if (value) fetchPost(() => getPost(value));
              }}
            />
          </Box>
        </Box>
      );
    }
    // by-pub-slug or by-pub-id: first input is publication
    const label = method === "by-pub-slug" ? "Publication slug" : "Publication ID";
    return (
      <Box flexDirection="column">
        <Header title="Get Post" />
        <Box>
          <Text bold>{label}: </Text>
          <TextInput
            placeholder={`Enter ${label.toLowerCase()}...`}
            onSubmit={(value) => {
              if (value) {
                setInput1(value);
                setStep("input-2");
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "input-2") {
    return (
      <Box flexDirection="column">
        <Header title="Get Post" />
        <Text dimColor>{method === "by-pub-slug" ? "Publication slug" : "Publication ID"}: {input1}</Text>
        <Box>
          <Text bold>Post slug: </Text>
          <TextInput
            placeholder="Enter post slug..."
            onSubmit={(value) => {
              if (value) {
                if (method === "by-pub-slug") {
                  fetchPost(() => getPostBySlugs(input1, value));
                } else {
                  fetchPost(() => getPostByPubIdAndSlug(input1, value));
                }
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "loading") {
    return (
      <Box flexDirection="column">
        <Header title="Get Post" />
        <Spinner label="Loading post..." />
      </Box>
    );
  }

  if (step === "error") {
    return (
      <Box flexDirection="column">
        <Header title="Get Post" />
        <StatusMessage variant="error">{errorMsg}</StatusMessage>
      </Box>
    );
  }

  // result
  return (
    <Box flexDirection="column">
      <Header title="Get Post" />
      {data && (
        <Box flexDirection="column">
          <DataView
            data={{
              Title: data.title,
              Subtitle: data.subtitle,
              Status: data.status,
              Date: data.createdAt,
            }}
          />
          {markdown && (
            <Box marginTop={1} flexDirection="column">
              <Text dimColor>{"─".repeat(50)}</Text>
              <Text>{markdown}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
