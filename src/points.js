/**
 * The scoring table. Points are never typed in by hand — they come from the
 * difficulty label the project admin put on the pull request.
 */
export const POINTS = {
  easy: 2,
  medium: 5,
  hard: 10,
};

export const TIERS = Object.keys(POINTS);

/** Words organisers put in front of the difficulty, all optional. */
const PREFIXES = new Set(['difficulty', 'level', 'complexity', 'tier', 'effort']);

/**
 * Labels in the wild are messy: "easy", "Easy", "difficulty: hard",
 * "level/medium". Strip an optional prefix word and the rest must be exactly
 * one of our three tiers — so "medium-priority" and "easy-fix" do not score by
 * accident.
 */
function tierOf(label) {
  const words = String(label)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
    .filter((w) => !PREFIXES.has(w));
  return words.length === 1 && words[0] in POINTS ? words[0] : null;
}

/**
 * A pull request carrying several difficulty labels scores the highest one,
 * never the sum — two labels is a mistake, not a bonus.
 */
export function scoreLabels(labels = []) {
  let tier = null;
  let points = 0;

  for (const label of labels) {
    const found = tierOf(label);
    if (found && POINTS[found] > points) {
      tier = found;
      points = POINTS[found];
    }
  }

  return { tier, points };
}

/** "easy · 2 points" for display, or a reason there is no score yet. */
export function scoreSummary(labels, fetchError) {
  const { tier, points } = scoreLabels(labels);
  if (tier) return { tier, points, text: `${tier} · ${points} points` };
  if (fetchError) return { tier: null, points: 0, text: fetchError };
  return {
    tier: null,
    points: 0,
    text: 'No difficulty label on this pull request yet — worth 0 points.',
  };
}
