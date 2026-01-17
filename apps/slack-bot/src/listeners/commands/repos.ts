import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { getAllRepos, getRepoBySlug, deleteRepo } from "@ralph/db";
import { formatRepoList } from "../../blocks/repo-list.js";
import { openAddRepoModal, openEditRepoModal } from "../../services/repo-manager.js";

export async function handleReposCommand({
  command,
  ack,
  respond,
  client,
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) {
  await ack();

  const [subcommand, ...args] = command.text.trim().split(/\s+/);

  switch (subcommand) {
    case "list":
    case "":
    case undefined: {
      const repos = await getAllRepos();
      if (repos.length === 0) {
        await respond({
          text: "No repositories configured. Use `/repos add` to add one.",
          response_type: "ephemeral",
        });
        return;
      }

      await respond({
        blocks: formatRepoList(repos),
        response_type: "ephemeral",
      });
      break;
    }

    case "add": {
      await openAddRepoModal(client, command.trigger_id);
      break;
    }

    case "edit": {
      const slug = args[0];
      if (!slug) {
        await respond({
          text: "Please specify a repo slug: `/repos edit <slug>`",
          response_type: "ephemeral",
        });
        return;
      }

      const repo = await getRepoBySlug(slug);
      if (!repo) {
        await respond({
          text: `Repository "${slug}" not found.`,
          response_type: "ephemeral",
        });
        return;
      }

      await openEditRepoModal(client, command.trigger_id, repo);
      break;
    }

    case "remove": {
      const slug = args[0];
      if (!slug) {
        await respond({
          text: "Please specify a repo slug: `/repos remove <slug>`",
          response_type: "ephemeral",
        });
        return;
      }

      const repo = await getRepoBySlug(slug);
      if (!repo) {
        await respond({
          text: `Repository "${slug}" not found.`,
          response_type: "ephemeral",
        });
        return;
      }

      // Ask for confirmation
      await respond({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Are you sure you want to remove *${repo.name}* (${repo.slug})?`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Yes, remove" },
                style: "danger",
                value: repo.id,
                action_id: "confirm_remove_repo",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "Cancel" },
                action_id: "cancel_remove_repo",
              },
            ],
          },
        ],
        response_type: "ephemeral",
      });
      break;
    }

    default:
      await respond({
        text: `Unknown subcommand: ${subcommand}\n\nUsage:\n• \`/repos list\` - List all repos\n• \`/repos add\` - Add a new repo\n• \`/repos edit <slug>\` - Edit a repo\n• \`/repos remove <slug>\` - Remove a repo`,
        response_type: "ephemeral",
      });
  }
}
