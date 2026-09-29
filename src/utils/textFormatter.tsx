import React from 'react';

/**
 * Formats WhatsApp text markup safely without dangerouslySetInnerHTML:
 * - *bold*
 * - _italic_
 * - ~strikethrough~
 * - ```monospace```
 * - clickable URLs
 * - search query highlighting
 */
export function renderFormattedText(text: string, searchQuery?: string): React.ReactNode {
  if (!text) return null;

  // Split lines first to preserve line breaks
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => (
    <React.Fragment key={lineIdx}>
      {lineIdx > 0 && <br />}
      {renderLine(line, searchQuery)}
    </React.Fragment>
  ));
}

function renderLine(line: string, searchQuery?: string): React.ReactNode {
  // Tokenize URLs and search query first, then style tags
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = line.split(urlRegex);

  return parts.map((part, partIdx) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={partIdx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#53bdeb] hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return renderStyledSegment(part, searchQuery, partIdx);
  });
}

function renderStyledSegment(text: string, searchQuery?: string, keyPrefix: number | string = 0): React.ReactNode {
  // Regex to match *bold*, _italic_, ~strike~, ```code```
  const tokenRegex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|```[^`]+```)/g;
  const tokens = text.split(tokenRegex);

  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;

    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      const inner = token.slice(1, -1);
      return <strong key={key} className="font-bold">{highlightSearch(inner, searchQuery)}</strong>;
    }
    if (token.startsWith('_') && token.endsWith('_') && token.length > 2) {
      const inner = token.slice(1, -1);
      return <em key={key} className="italic">{highlightSearch(inner, searchQuery)}</em>;
    }
    if (token.startsWith('~') && token.endsWith('~') && token.length > 2) {
      const inner = token.slice(1, -1);
      return <del key={key} className="line-through opacity-80">{highlightSearch(inner, searchQuery)}</del>;
    }
    if (token.startsWith('```') && token.endsWith('```') && token.length > 6) {
      const inner = token.slice(3, -3);
      return (
        <code key={key} className="font-mono text-[12px] bg-black/30 px-1 py-0.5 rounded text-emerald-300">
          {inner}
        </code>
      );
    }

    return <React.Fragment key={key}>{highlightSearch(token, searchQuery)}</React.Fragment>;
  });
}

function highlightSearch(text: string, searchQuery?: string): React.ReactNode {
  if (!searchQuery || !searchQuery.trim()) {
    return text;
  }

  const query = searchQuery.trim();
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) {
    return text;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-400 text-black px-0.5 rounded font-semibold">
        {match}
      </mark>
      {highlightSearch(after, searchQuery)}
    </>
  );
}
