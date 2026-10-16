/**
 * Entrada global /agent (grupo (app)): reutiliza el cliente del Agent con
 * alcance por API key. La vista con tenencia de sesión vive en
 * /[wsSlug]/agent (misma UI, `wsSlug` conocido).
 */
import { AgentClient } from "../../[wsSlug]/agent/AgentClient-client";

export default function GlobalAgentPage() {
  return <AgentClient wsSlug="workspace (vía API key)" />;
}
