// Preparation guidance is configurable and is not an assertion of legal requirements.
export const CASE_DOCUMENTS = {
  police: ["identity"],
  accident: ["identity", "license", "vehicle"],
  vehicle_contract: ["identity", "vehicle"],
  vehicle_tax: ["identity", "vehicle"],
  name_change: ["identity", "house"],
  military: ["identity", "house", "military"],
  general: ["identity"],
};
export function selectDocuments(topic, documents) {
  return documents
    .filter(
      (doc) => doc.verified && (CASE_DOCUMENTS[topic] || []).includes(doc.kind),
    )
    .map((doc) => doc.id);
}
export function checklist(topic, documents, selected) {
  return (CASE_DOCUMENTS[topic] || []).map((type) => ({
    type,
    available: documents.some((doc) => doc.kind === type && doc.verified),
    selected: documents.some(
      (doc) => doc.kind === type && selected.includes(doc.id) && doc.verified,
    ),
  }));
}
