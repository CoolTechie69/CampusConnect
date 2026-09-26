// Computes a 0-100 match score between a help request and a candidate helper.
function computeMatchScore(request, helper, requesterYear) {
  if (helper.id === request.user_id) return -1; // can't help your own request
  if (helper.availability === 'busy') return -1;

  const reqTech = new Set(JSON.parse(request.tech_stack).map((t) => t.toLowerCase()));
  const helperSkills = new Set(JSON.parse(helper.skills).map((s) => s.toLowerCase()));

  let overlap = 0;
  for (const t of reqTech) if (helperSkills.has(t)) overlap += 1;
  const skillScore = reqTech.size > 0 ? (overlap / reqTech.size) * 55 : 20;

  // Seniority: helpers in a higher year than the requester are preferred, but not mandatory.
  const yearDiff = helper.year - requesterYear;
  let seniorityScore;
  if (yearDiff > 0) seniorityScore = Math.min(yearDiff, 3) * 5; // up to 15
  else if (yearDiff === 0) seniorityScore = 8;
  else seniorityScore = 3;

  const availabilityScore = helper.availability === 'available' ? 15 : 8;

  const urgencyBonus =
    request.urgency === 'high' && helper.resolved_count > 0
      ? Math.min(helper.resolved_count, 5)
      : 0;

  const experienceScore = Math.min(helper.resolved_count * 1.5, 10);

  const total = skillScore + seniorityScore + availabilityScore + urgencyBonus + experienceScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}

module.exports = { computeMatchScore };
