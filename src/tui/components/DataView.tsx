import React from "react";
import { Box, Text } from "ink";

export function DataView({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );

  return (
    <Box flexDirection="column">
      {entries.map(([key, value]) => (
        <Box key={key}>
          <Text bold>{key}: </Text>
          <Text>{String(value)}</Text>
        </Box>
      ))}
    </Box>
  );
}
