const BADGE_RULES = [
  { id: 'first_help', label: 'First Help', threshold: 1 },
  { id: 'debugging_pro', label: 'Debugging Pro', threshold: 5 },
  { id: 'top_helper', label: 'Top Helper', threshold: 10 },
  { id: 'campus_legend', label: 'Campus Legend', threshold: 25 },
];

function badgesForCount(resolvedCount) {
  return BADGE_RULES.filter((b) => resolvedCount >= b.threshold).map((b) => b.id);
}

function badgeLabel(id) {
  return BADGE_RULES.find((b) => b.id === id)?.label || id;
}

module.exports = { BADGE_RULES, badgesForCount, badgeLabel };
