import type { Repo } from "@ralphberry/core";
import type { KnownBlock } from "@slack/types";

export function formatRepoList(repos: Repo[]): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Configured Repositories (${repos.length})*`,
      },
    },
    {
      type: "divider",
    },
  ];

  for (const repo of repos) {
    const statusEmoji = repo.enabled ? ":white_check_mark:" : ":pause_button:";
    const keywords = repo.keywords.length > 0 ? repo.keywords.join(", ") : "_none_";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${statusEmoji} *${repo.name}* (\`${repo.slug}\`)\n_${repo.description || "No description"}_\n\n*Git:* \`${repo.gitUrl}\`\n*Branch:* \`${repo.branch}\`\n*Image:* \`${repo.dockerImage}\`\n*Keywords:* ${keywords}`,
      },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "Edit" },
        value: repo.slug,
        action_id: `edit_repo_${repo.slug}`,
      },
    });

    blocks.push({
      type: "divider",
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Use `/repos add` to add a new repository",
      },
    ],
  });

  return blocks;
}
