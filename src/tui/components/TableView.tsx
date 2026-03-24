import React from "react";
import { Box, Text } from "ink";

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export function TableView({
  headers,
  rows,
  maxColWidth = 30,
}: {
  headers: string[];
  rows: string[][];
  maxColWidth?: number;
}) {
  if (rows.length === 0) {
    return <Text dimColor>No results found.</Text>;
  }

  // Calculate column widths, capped at maxColWidth
  const widths = headers.map((h, i) =>
    Math.min(
      maxColWidth,
      Math.max(
        h.length,
        ...rows.map((r) => (r[i] || "").length)
      )
    )
  );

  return (
    <Box flexDirection="column">
      <Box>
        {headers.map((h, i) => (
          <Box key={i} width={widths[i]! + 2}>
            <Text bold>{truncate(h, widths[i]!)}</Text>
          </Box>
        ))}
      </Box>
      <Text dimColor>{"─".repeat(widths.reduce((a, b) => a + b + 2, 0))}</Text>
      {rows.map((row, ri) => (
        <Box key={ri}>
          {row.map((cell, ci) => (
            <Box key={ci} width={widths[ci]! + 2}>
              <Text>{truncate(cell, widths[ci]!)}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
