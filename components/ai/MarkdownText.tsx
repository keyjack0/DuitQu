"use client";

import { Fragment, ReactNode } from "react";

type Block =
  | { type: "line"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

const INLINE_RE = /(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\*(?!\s|\*)[^*\n]+\*|`[^`\n]+`)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
    if (!part) return null;
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      return (
        <strong key={key}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="ai-md-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flush = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    const ulMatch =
      trimmed.match(/^[-•]\s+(.+)$/) ??
      (/^\*\s+\S/.test(trimmed) ? trimmed.match(/^\*\s+(.+)$/) : null);
    const olMatch = trimmed.match(/^\d{1,3}[.)]\s+(.+)$/);
    if (ulMatch) {
      if (!list || list.type !== "ul") {
        flush();
        list = { type: "ul", items: [] };
      }
      list.items.push(ulMatch[1]);
    } else if (olMatch) {
      if (!list || list.type !== "ol") {
        flush();
        list = { type: "ol", items: [] };
      }
      list.items.push(olMatch[1]);
    } else {
      flush();
      blocks.push({ type: "line", text: line });
    }
  }
  flush();
  return blocks;
}

export default function MarkdownText({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <>
      {blocks.map((block, bi) =>
        block.type === "line" ? (
          <Fragment key={bi}>
            {renderInline(block.text, `l${bi}`)}
            {"\n"}
          </Fragment>
        ) : (
          <ul
            key={bi}
            className={`ai-md-list${block.type === "ol" ? " ai-md-list--ol" : ""}`}
          >
            {block.items.map((item, ii) => (
              <li key={ii}>{renderInline(item, `l${bi}-${ii}`)}</li>
            ))}
          </ul>
        )
      )}
    </>
  );
}
