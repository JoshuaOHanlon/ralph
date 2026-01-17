import type { WebClient } from "@slack/web-api";
import type { Repo, Prd, UserStory } from "@ralph/core";

// In-memory store for active PRD conversations
const activeConversations = new Map<
  string,
  {
    repo: Repo;
    description: string;
    userId?: string;
    answers: string[];
    stage: "questions" | "review";
    prd?: Prd;
  }
>();

function getConversationKey(channelId: string, threadTs: string): string {
  return `${channelId}:${threadTs}`;
}

interface StartConversationParams {
  channelId: string;
  userId: string;
  repo: Repo;
  description: string;
  threadTs?: string;
}

export async function startPrdConversation(
  client: WebClient,
  params: StartConversationParams
): Promise<void> {
  const { channelId, userId, repo, description } = params;

  // Post initial message
  const result = await client.chat.postMessage({
    channel: channelId,
    thread_ts: params.threadTs,
    text: `I'll help create a PRD for *${repo.name}*: "${description}"`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `I'll help create a PRD for *${repo.name}*:\n> ${description}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Please answer these questions:*\n\n1. What is the primary goal?\n   A. New feature implementation\n   B. Bug fix or improvement\n   C. Refactoring / tech debt\n   D. Other\n\n2. What is the scope?\n   A. Small change (1-2 files)\n   B. Medium change (3-5 files)\n   C. Large change (6+ files)\n\n3. Are there UI changes?\n   A. Yes, frontend changes needed\n   B. No, backend only\n\nReply with your answers (e.g., `1A, 2B, 3A`)",
        },
      },
    ],
  });

  const threadTs = result.ts ?? params.threadTs;

  if (threadTs) {
    // Store conversation state
    const key = getConversationKey(channelId, threadTs);
    activeConversations.set(key, {
      repo,
      description,
      userId,
      answers: [],
      stage: "questions",
    });
  }
}

interface HandleResponseParams {
  channelId: string;
  userId?: string;
  threadTs: string;
  text: string;
}

export async function handlePrdResponse(
  client: WebClient,
  params: HandleResponseParams
): Promise<void> {
  const { channelId, threadTs, text } = params;

  const key = getConversationKey(channelId, threadTs);
  const conversation = activeConversations.get(key);

  if (!conversation) {
    // Not an active PRD conversation
    return;
  }

  if (conversation.stage === "questions") {
    // Parse answers
    const answers = text
      .toUpperCase()
      .match(/[1-3][A-D]/g)
      ?.map((a) => a.trim());

    if (!answers || answers.length < 3) {
      await client.chat.postMessage({
        channel: channelId,
        thread_ts: threadTs,
        text: "Please answer all 3 questions. Example: `1A, 2B, 3A`",
      });
      return;
    }

    conversation.answers = answers;
    conversation.stage = "review";

    // Generate PRD based on answers
    const prd = generatePrd(conversation.repo, conversation.description, answers);
    conversation.prd = prd;

    // Post PRD preview
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: "Here's your PRD:",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*PRD Preview*\n\n*Project:* ${prd.project}\n*Branch:* \`${prd.branchName}\`\n*Description:* ${prd.description}`,
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*User Stories (${prd.userStories.length}):*\n${prd.userStories
              .map(
                (s) =>
                  `• *${s.id}:* ${s.title}\n  _${s.acceptanceCriteria.length} acceptance criteria_`
              )
              .join("\n")}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Confirm & Start Job" },
              style: "primary",
              value: JSON.stringify({ repoId: conversation.repo.id, prd }),
              action_id: "confirm_prd",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Cancel" },
              action_id: "cancel_prd",
            },
          ],
        },
      ],
    });

    // Clean up conversation
    activeConversations.delete(key);
  }
}

function generatePrd(repo: Repo, description: string, answers: string[]): Prd {
  const goalType = answers[0]?.charAt(1);
  const scope = answers[1]?.charAt(1);
  const hasUI = answers[2]?.charAt(1) === "A";

  // Generate slug from description
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

  const stories: UserStory[] = [];
  let storyIndex = 1;

  // Add appropriate stories based on answers
  if (scope === "C" || scope === "B") {
    // Larger changes need design/planning story
    stories.push({
      id: `US-${String(storyIndex++).padStart(3, "0")}`,
      title: "Plan implementation approach",
      description:
        "As a developer, I need to understand the codebase and plan my approach.",
      acceptanceCriteria: [
        "Identify files to modify",
        "Document approach in progress.txt",
        "Typecheck passes",
      ],
      priority: storyIndex - 1,
      passes: false,
      notes: "",
    });
  }

  // Main implementation story
  stories.push({
    id: `US-${String(storyIndex++).padStart(3, "0")}`,
    title: description,
    description: `As a user, I want ${description.toLowerCase()}.`,
    acceptanceCriteria: [
      `Implement ${description.toLowerCase()}`,
      "All tests pass",
      "Typecheck passes",
      ...(hasUI ? ["Verify in browser using dev-browser skill"] : []),
    ],
    priority: storyIndex - 1,
    passes: false,
    notes: "",
  });

  // Add testing story for larger changes
  if (scope === "C") {
    stories.push({
      id: `US-${String(storyIndex++).padStart(3, "0")}`,
      title: "Add/update tests",
      description: "As a developer, I need tests to verify the changes work correctly.",
      acceptanceCriteria: [
        "Add unit tests for new functionality",
        "All tests pass",
        "Typecheck passes",
      ],
      priority: storyIndex - 1,
      passes: false,
      notes: "",
    });
  }

  return {
    project: repo.name,
    branchName: `ralph/${slug}`,
    description: `${description} - ${repo.name}`,
    userStories: stories,
  };
}
