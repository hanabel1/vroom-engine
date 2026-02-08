import Highlighter from 'react-highlight-words';
import type Fuse from 'fuse.js';

interface HighlightedTextProps {
  text: string;
  matches?: readonly Fuse.FuseResultMatch[];
  fieldName: string;
}

/**
 * Renders text with highlighted portions based on Fuse.js match data
 */
export function HighlightedText({ text, matches, fieldName }: HighlightedTextProps) {
  // No matches? Return plain text
  if (!matches || matches.length === 0) {
    return <>{text}</>;
  }

  // Find matches for this specific field
  const fieldMatches = matches.filter((match) => match.key === fieldName);

  if (fieldMatches.length === 0) {
    return <>{text}</>;
  }

  // Extract all matched index ranges into searchWords format
  // Fuse.js indices are [start, end] inclusive, so we need to convert them
  const findChunks = () => {
    const chunks: Array<{ start: number; end: number }> = [];
    
    for (const match of fieldMatches) {
      if (match.indices) {
        for (const [start, end] of match.indices) {
          // Fuse indices are inclusive, react-highlight-words expects end to be exclusive
          chunks.push({ start, end: end + 1 });
        }
      }
    }
    
    return chunks;
  };

  return (
    <Highlighter
      searchWords={[]} // We use findChunks instead
      textToHighlight={text}
      autoEscape={true}
      highlightClassName="search-highlight"
      findChunks={findChunks}
    />
  );
}
