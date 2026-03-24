import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export function ScrollableList({
  items,
  renderItem,
  pageSize = 5,
}: {
  items: Record<string, unknown>[];
  renderItem: (item: Record<string, unknown>, index: number) => React.ReactNode;
  pageSize?: number;
}) {
  const [offset, setOffset] = useState(0);

  useInput((_input, key) => {
    if (key.downArrow) {
      setOffset((prev) => Math.min(prev + 1, Math.max(0, items.length - pageSize)));
    }
    if (key.upArrow) {
      setOffset((prev) => Math.max(prev - 1, 0));
    }
  });

  if (items.length === 0) {
    return <Text dimColor>No results found.</Text>;
  }

  const visible = items.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < items.length;
  const hasAbove = offset > 0;
  const needsScroll = items.length > pageSize;

  return (
    <Box flexDirection="column">
      <Text dimColor>{needsScroll ? `  ${hasAbove ? "↑" : " "}  ${offset + 1}–${Math.min(offset + pageSize, items.length)} of ${items.length}  ${hasMore ? "↓" : " "}` : " "}</Text>
      {visible.map((item, i) => renderItem(item, offset + i))}
    </Box>
  );
}
