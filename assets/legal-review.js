import { legalDraftSource, validateLegalDraft } from './reasoning.js';

export function legalInputFromRecord(record) {
  return Object.fromEntries(['details', 'eventDate', 'eventPlace'].map(key => [key, record.fields?.[key]?.value || '']));
}

// Only a reviewed draft matching the current facts can be used in a report.
export function reviewedLegalDraft(draft, input) {
  if (!draft || draft.reviewed !== true || draft.source !== legalDraftSource(input)) return null;
  try {
    const { formalNarrative, knownFacts, missingQuestions } = draft;
    return { ...validateLegalDraft({ formalNarrative, knownFacts, missingQuestions }, input), source: draft.source, ...(draft.mode === 'local-demo' ? {mode:'local-demo'} : {}), reviewed: true, reviewedAt: draft.reviewedAt || null };
  } catch {
    return null;
  }
}
