import React from "react";
import { Box, Text } from "ink";

export function Header({ title }: { title: string }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text bold color="#3f64f8">
          Paragraph
        </Text>
        <Text dimColor> {" > "} </Text>
        <Text bold>{title}</Text>
      </Text>
      <Text dimColor>{"─".repeat(50)}</Text>
    </Box>
  );
}
