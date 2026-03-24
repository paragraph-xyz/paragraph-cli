import React from "react";
import { Box, Text } from "ink";

const LOGO = `\
█▀█ ▄▀█ █▀█ ▄▀█ █▀▀ █▀█ ▄▀█ █▀█ █ █
█▀▀ █▀█ █▀▄ █▀█ █▄█ █▀▄ █▀█ █▀▀ █▀█`;

export function Logo({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Box marginBottom={1}>
        <Text bold color="#3f64f8">
          {"¶ Paragraph"}
        </Text>
        <Text dimColor> CLI</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="#3f64f8">{LOGO}</Text>
    </Box>
  );
}
