import { redirect } from "next/navigation";

// Claude now lives alongside the rest of the fleet as a chat page.
export default function ClaudeRedirect() {
  redirect("/agents/claude");
}
