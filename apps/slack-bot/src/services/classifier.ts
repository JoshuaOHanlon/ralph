import type { Repo } from "@ralph/core";

/**
 * Classify which repository a request is for based on keywords and description
 */
export function classifyRepo(text: string, repos: Repo[]): Repo | null {
  const normalizedText = text.toLowerCase();

  // Score each repo based on keyword matches
  const scores = repos.map((repo) => {
    let score = 0;

    // Check keywords
    for (const keyword of repo.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }

    // Check repo name
    if (normalizedText.includes(repo.name.toLowerCase())) {
      score += 20;
    }

    // Check slug
    if (normalizedText.includes(repo.slug.toLowerCase())) {
      score += 20;
    }

    // Check description words
    const descWords = repo.description.toLowerCase().split(/\s+/);
    for (const word of descWords) {
      if (word.length > 3 && normalizedText.includes(word)) {
        score += 2;
      }
    }

    return { repo, score };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return top match if score is above threshold
  const topMatch = scores[0];
  if (topMatch && topMatch.score >= 10) {
    return topMatch.repo;
  }

  // If only one repo, return it
  if (repos.length === 1) {
    return repos[0];
  }

  return null;
}
