import type { App } from "@slack/bolt";
import { handleAddRepoSubmit, handleEditRepoSubmit } from "./repo-modals.js";

export function registerViews(app: App) {
  // Modal submissions
  app.view("add_repo_modal", handleAddRepoSubmit);
  app.view("edit_repo_modal", handleEditRepoSubmit);
}
