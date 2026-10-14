/**
 * Barril público del feature github (deep module: solo index.ts se importa
 * desde fuera). Lo interno vive en lib/, queries.ts y handler.ts.
 */

export type { PullRequestEvent, PushEvent } from "./handler";
export { handlePullRequest, handlePush, syncPrState } from "./handler";
export {
  connectInstallation,
  disconnectInstallation,
  listInstallations,
  listIssueLinks,
  listRepos,
} from "./queries";
export type { ConnectInstallationInput, LinkState } from "./schema";
export { ConnectInstallationSchema, LinkStateEnum } from "./schema";
