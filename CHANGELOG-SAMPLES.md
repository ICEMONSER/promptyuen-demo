# Sample document prototype — 2026-10-17
- Automatically seed the three provided sample document images and contact details; preserve prior documents in the same local store.
- Hide document library, upload prompts, readiness checklist and document selection controls. Incident evidence upload remains available.
- Show categorized attachments after case creation and in the printable report.
- Manual: enter the workspace, choose an accident and create a sample case without uploading identity documents or selecting document checkboxes; inspect all three attachments afterward.
- Validation: 78 automated tests pass. Sample image loading fails explicitly when an asset is unavailable.
- Limitation: sample documents are demonstration fixtures, not verified identity. Officer transmission still requires the existing backend configuration.

## Rangsit automatic station lookup
- Added Khlong Luang and Pratunam Chulalongkorn public station locations and expanded lookup coverage to Thammasat Rangsit.
- Manual: allow browser location at Thammasat Rangsit, open the accident flow, and confirm Khlong Luang is selected without changing station manually.
- Automated: three campus points select Khlong Luang; central Rangsit selects Pratunam; invalid/outside points still fail.
- Sources: https://mapcarta.com/W442793759 and https://th.near-place.com/chulalongkorn-pratunam-metropolitan-police-station-113-thnn-soi-rangsit-pathum-thani-7-thanyaburi-district (checked 2026-10-17). Nearest station does not establish jurisdiction.
