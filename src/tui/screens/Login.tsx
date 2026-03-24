import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { Select, Spinner, TextInput, PasswordInput } from "@inkjs/ui";
import { StatusMessage } from "@inkjs/ui";
import { Header } from "../components/Header.js";
import { Logo } from "../components/Logo.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigation } from "../hooks/useNavigation.js";
import {
  createLoginSession,
  waitForLogin,
  openBrowser,
} from "../../services/browser-auth.js";

type Step = "choose" | "browser" | "paste" | "verifying" | "done" | "error";

export function Login() {
  const { login } = useAuth();
  const { goBack, navigate } = useNavigation();
  const [step, setStep] = useState<Step>("choose");
  const [token, setToken] = useState("");
  const [browserUrl, setBrowserUrl] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      if (step === "choose") {
        goBack();
      } else if (step === "browser") {
        abortRef.current?.abort();
        setStep("choose");
      }
    }
  });

  const doLogin = async (apiKey: string) => {
    setStep("verifying");
    try {
      const me = await login(apiKey);
      setMessage(`Logged in as ${me.name || me.slug || "your publication"}`);
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  const startBrowserLogin = async () => {
    setStep("browser");
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const session = await createLoginSession();
      setBrowserUrl(session.verificationUrl);
      await openBrowser(session.verificationUrl);
      const apiKey = await waitForLogin(session.sessionId, abort.signal);
      await doLogin(apiKey);
    } catch (err) {
      if (abort.signal.aborted) return; // cancelled by user, already back at choose
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("404") || msg.includes("ECONNREFUSED")) {
        setErrorMsg("Browser login is not available yet. Try pasting an API key.");
      } else {
        setErrorMsg(msg);
      }
      setStep("error");
    }
  };

  if (step === "choose") {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box marginBottom={1}>
          <Text>How would you like to authenticate?</Text>
        </Box>
        <Select
          options={[
            { label: "Log in with browser", value: "browser" },
            { label: "Paste an API key", value: "paste" },
          ]}
          onChange={(value) => {
            if (value === "browser") {
              startBrowserLogin();
            } else {
              setStep("paste");
            }
          }}
        />
      </Box>
    );
  }

  if (step === "browser") {
    return (
      <Box flexDirection="column">
        <Header title="Login" />
        {browserUrl ? (
          <Box flexDirection="column" marginBottom={1}>
            <Text>Open this URL in your browser:</Text>
            <Text bold color="cyan">
              {browserUrl}
            </Text>
          </Box>
        ) : null}
        <Spinner label="Waiting for authentication..." />
        <Box marginTop={1}>
          <Text dimColor>Press esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (step === "paste") {
    return (
      <Box flexDirection="column">
        <Header title="Login" />
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>Get your API key from paragraph.com/settings → Publication → Developer</Text>
        </Box>
        <Box>
          <Text bold>API key: </Text>
          <PasswordInput
            placeholder="Paste your API key..."
            onSubmit={(value) => {
              if (value) doLogin(value);
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "verifying") {
    return (
      <Box flexDirection="column">
        <Header title="Login" />
        <Spinner label="Verifying API key..." />
      </Box>
    );
  }

  if (step === "done") {
    return (
      <Box flexDirection="column">
        <Header title="Login" />
        <StatusMessage variant="success">{message}</StatusMessage>
        <AutoBack />
      </Box>
    );
  }

  // error
  return (
    <Box flexDirection="column">
      <Header title="Login" />
      <StatusMessage variant="error">{errorMsg}</StatusMessage>
      <Box marginTop={1}>
        <Text dimColor>Press esc to go back</Text>
      </Box>
      <EscToGoBack />
    </Box>
  );
}

function AutoBack() {
  const { navigate } = useNavigation();
  useEffect(() => {
    const t = setTimeout(() => navigate({ name: "main-menu" }), 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}

function EscToGoBack() {
  const { goBack } = useNavigation();
  useInput((_input, key) => {
    if (key.escape) goBack();
  });
  return null;
}
