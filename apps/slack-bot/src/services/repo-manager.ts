import type { WebClient } from "@slack/web-api";
import type { Repo } from "@ralph/core";

export async function openAddRepoModal(
  client: WebClient,
  triggerId: string
): Promise<void> {
  await client.views.open({
    trigger_id: triggerId,
    view: {
      type: "modal",
      callback_id: "add_repo_modal",
      title: { type: "plain_text", text: "Add Repository" },
      submit: { type: "plain_text", text: "Add" },
      close: { type: "plain_text", text: "Cancel" },
      blocks: [
        {
          type: "input",
          block_id: "name",
          label: { type: "plain_text", text: "Name" },
          element: {
            type: "plain_text_input",
            action_id: "name_input",
            placeholder: { type: "plain_text", text: "My Project" },
          },
        },
        {
          type: "input",
          block_id: "slug",
          label: { type: "plain_text", text: "Slug" },
          element: {
            type: "plain_text_input",
            action_id: "slug_input",
            placeholder: { type: "plain_text", text: "my-project" },
          },
          hint: { type: "plain_text", text: "Lowercase with hyphens only" },
        },
        {
          type: "input",
          block_id: "git_url",
          label: { type: "plain_text", text: "Git URL" },
          element: {
            type: "plain_text_input",
            action_id: "git_url_input",
            placeholder: {
              type: "plain_text",
              text: "git@github.com:myorg/my-project.git",
            },
          },
        },
        {
          type: "input",
          block_id: "branch",
          label: { type: "plain_text", text: "Branch" },
          element: {
            type: "plain_text_input",
            action_id: "branch_input",
            initial_value: "main",
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "docker_image",
          label: { type: "plain_text", text: "Docker Image" },
          element: {
            type: "plain_text_input",
            action_id: "docker_image_input",
            placeholder: { type: "plain_text", text: "ralph-my-project:latest" },
          },
        },
        {
          type: "input",
          block_id: "keywords",
          label: { type: "plain_text", text: "Keywords" },
          element: {
            type: "plain_text_input",
            action_id: "keywords_input",
            placeholder: { type: "plain_text", text: "frontend, react, dashboard" },
          },
          hint: { type: "plain_text", text: "Comma-separated keywords for repo matching" },
          optional: true,
        },
        {
          type: "input",
          block_id: "description",
          label: { type: "plain_text", text: "Description" },
          element: {
            type: "plain_text_input",
            action_id: "description_input",
            multiline: true,
            placeholder: { type: "plain_text", text: "What does this repository contain?" },
          },
          optional: true,
        },
      ],
    },
  });
}

export async function openEditRepoModal(
  client: WebClient,
  triggerId: string,
  repo: Repo
): Promise<void> {
  await client.views.open({
    trigger_id: triggerId,
    view: {
      type: "modal",
      callback_id: "edit_repo_modal",
      private_metadata: repo.id,
      title: { type: "plain_text", text: "Edit Repository" },
      submit: { type: "plain_text", text: "Save" },
      close: { type: "plain_text", text: "Cancel" },
      blocks: [
        {
          type: "input",
          block_id: "name",
          label: { type: "plain_text", text: "Name" },
          element: {
            type: "plain_text_input",
            action_id: "name_input",
            initial_value: repo.name,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Slug:* \`${repo.slug}\` (cannot be changed)`,
          },
        },
        {
          type: "input",
          block_id: "git_url",
          label: { type: "plain_text", text: "Git URL" },
          element: {
            type: "plain_text_input",
            action_id: "git_url_input",
            initial_value: repo.gitUrl,
          },
        },
        {
          type: "input",
          block_id: "branch",
          label: { type: "plain_text", text: "Branch" },
          element: {
            type: "plain_text_input",
            action_id: "branch_input",
            initial_value: repo.branch,
          },
        },
        {
          type: "input",
          block_id: "docker_image",
          label: { type: "plain_text", text: "Docker Image" },
          element: {
            type: "plain_text_input",
            action_id: "docker_image_input",
            initial_value: repo.dockerImage,
          },
        },
        {
          type: "input",
          block_id: "keywords",
          label: { type: "plain_text", text: "Keywords" },
          element: {
            type: "plain_text_input",
            action_id: "keywords_input",
            initial_value: repo.keywords.join(", "),
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "description",
          label: { type: "plain_text", text: "Description" },
          element: {
            type: "plain_text_input",
            action_id: "description_input",
            multiline: true,
            initial_value: repo.description,
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "enabled",
          label: { type: "plain_text", text: "Status" },
          element: {
            type: "checkboxes",
            action_id: "enabled_checkbox",
            options: [
              {
                text: { type: "plain_text", text: "Enabled" },
                value: "enabled",
              },
            ],
            initial_options: repo.enabled
              ? [
                  {
                    text: { type: "plain_text", text: "Enabled" },
                    value: "enabled",
                  },
                ]
              : [],
          },
          optional: true,
        },
      ],
    },
  });
}
