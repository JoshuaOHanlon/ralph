import type { App } from "@slack/bolt";
import { handleSelectRepo } from "./select-repo.js";
import { handleConfirmPrd, handleCancelPrd } from "./prd-actions.js";
import { handleConfirmRemoveRepo, handleCancelRemoveRepo } from "./repo-actions.js";

export function registerActions(app: App) {
  // Repo selection buttons
  app.action(/^select_repo_/, handleSelectRepo);

  // PRD confirmation/cancellation
  app.action("confirm_prd", handleConfirmPrd);
  app.action("cancel_prd", handleCancelPrd);

  // Repo removal confirmation
  app.action("confirm_remove_repo", handleConfirmRemoveRepo);
  app.action("cancel_remove_repo", handleCancelRemoveRepo);
}
