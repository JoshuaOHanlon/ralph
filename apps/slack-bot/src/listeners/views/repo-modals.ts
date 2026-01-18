import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, SlackViewAction } from "@slack/bolt";
import { createRepo, updateRepo } from "@ralphberry/db";

export async function handleAddRepoSubmit({
  ack,
  view,
}: AllMiddlewareArgs & SlackViewMiddlewareArgs<SlackViewAction>) {
  const values = view.state.values;

  const name = values.name?.name_input?.value ?? "";
  const slug = values.slug?.slug_input?.value ?? "";
  const gitUrl = values.git_url?.git_url_input?.value ?? "";
  const branch = values.branch?.branch_input?.value ?? "main";
  const dockerImage = values.docker_image?.docker_image_input?.value ?? "";
  const keywordsRaw = values.keywords?.keywords_input?.value ?? "";
  const description = values.description?.description_input?.value ?? "";

  // Validate
  const errors: Record<string, string> = {};

  if (!name) errors.name = "Name is required";
  if (!slug) errors.slug = "Slug is required";
  if (!/^[a-z0-9-]+$/.test(slug)) errors.slug = "Slug must be lowercase with hyphens only";
  if (!gitUrl) errors.git_url = "Git URL is required";
  if (!dockerImage) errors.docker_image = "Docker image is required";

  if (Object.keys(errors).length > 0) {
    await ack({ response_action: "errors", errors });
    return;
  }

  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);

  try {
    await createRepo({
      name,
      slug,
      gitUrl,
      branch,
      dockerImage,
      keywords,
      description,
      enabled: true,
    });

    await ack();
  } catch (error) {
    await ack({
      response_action: "errors",
      errors: { name: "Failed to create repository. The slug may already exist." },
    });
  }
}

export async function handleEditRepoSubmit({
  ack,
  view,
}: AllMiddlewareArgs & SlackViewMiddlewareArgs<SlackViewAction>) {
  const repoId = view.private_metadata;
  const values = view.state.values;

  const name = values.name?.name_input?.value;
  const gitUrl = values.git_url?.git_url_input?.value;
  const branch = values.branch?.branch_input?.value;
  const dockerImage = values.docker_image?.docker_image_input?.value;
  const keywordsRaw = values.keywords?.keywords_input?.value;
  const description = values.description?.description_input?.value;
  const enabled = values.enabled?.enabled_checkbox?.selected_options?.length === 1;

  const keywords = keywordsRaw
    ?.split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);

  try {
    await updateRepo(repoId, {
      name: name ?? undefined,
      gitUrl: gitUrl ?? undefined,
      branch: branch ?? undefined,
      dockerImage: dockerImage ?? undefined,
      keywords: keywords ?? undefined,
      description: description ?? undefined,
      enabled,
    });

    await ack();
  } catch (error) {
    await ack({
      response_action: "errors",
      errors: { name: "Failed to update repository." },
    });
  }
}
