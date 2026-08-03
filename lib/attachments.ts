export interface ChatAttachment {
  name: string;
  url: string; // /api/attachment/<name> — for preview/download
  type: string;
  absPath?: string; // local filesystem path (for agents that can read files)
  text?: string; // inlined content for text-like files
}

/**
 * Fold attached files into the prompt so the agent can use them as context.
 * Text files are inlined (works for every agent, even ones without file tools);
 * images/PDFs are referenced by local path so a capable agent can open them.
 */
export function buildPromptWithAttachments(text: string, atts: ChatAttachment[]): string {
  if (!atts.length) return text;
  const blocks = atts.map((a) => {
    if (a.text != null) {
      const body = a.text.length > 6000 ? a.text.slice(0, 6000) + "\n…(truncated)" : a.text;
      return `File: ${a.name}\n\`\`\`\n${body}\n\`\`\``;
    }
    return `File: ${a.name} (${a.type})${a.absPath ? ` — readable at local path: ${a.absPath}` : ""}`;
  });
  const head = text.trim() ? `${text}\n\n` : "";
  return `${head}---\nAttached files for context:\n${blocks.join("\n\n")}`;
}
