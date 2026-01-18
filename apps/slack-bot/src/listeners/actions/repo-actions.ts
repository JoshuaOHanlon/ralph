import type { AllMiddlewareArgs, SlackActionMiddlewareArgs, ButtonAction } from "@slack/bolt";
import { deleteRepo } from "@ralphberry/db";

export async function handleConfirmRemoveRepo({
  action,
  ack,
  respond,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<ButtonAction>) {
  await ack();

  if (!action.value) return;

  const repoId = action.value;
  const deleted = await deleteRepo(repoId);

  if (deleted) {
    await respond({
      text: "Repository removed successfully.",
      replace_original: true,
    });
  } else {
    await respond({
      text: "Failed to remove repository.",
      replace_original: true,
    });
  }
}

export async function handleCancelRemoveRepo({
  ack,
  respond,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<ButtonAction>) {
  await ack();

  await respond({
    text: "Repository removal cancelled.",
    replace_original: true,
  });
}
