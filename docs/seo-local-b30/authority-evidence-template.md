# B30 Authority Evidence Template

Use a copy of this template in evidence storage outside Git. Fill every field in the finalized copy; use `not publicly exposed` or `not applicable` instead of leaving cells empty.

- Measurement date (ISO `YYYY-MM-DD`):

## Google Business Profile

- Public profile URL:
- Ownership state: absent | unclaimed | claimed-unverified | verified
- Duplicate candidates found: 0 | count
- Display name:
- Primary category:
- Secondary categories:
- Address/service-area mode:
- Phone:
- Website:
- Hours:
- Coordinates match: yes | no
- Review count/rating observed publicly:
- Photo/product completeness notes:
- Sensitive verification evidence stored outside Git: yes | not-applicable

## Public NAP profiles

| Platform | Public URL | Name | Address | Phone | Website | Status |
|---|---|---|---|---|---|---|

## Proposed mutations awaiting approval

| Platform | Field | Before | Proposed | Truth source | Rollback value |
|---|---|---|---|---|---|

## Classification vocabulary

- `correct`: exact or semantically identical to canonical business truth.
- `incomplete`: a missing field can be supplied truthfully.
- `incorrect`: public data conflicts with canonical business truth.
- `needs-business-decision`: category, hours or service claim is not provable from repository evidence.
- `duplicate-risk`: another public profile may represent the same business.

## Evidence safety

Do not store authenticated screenshots, cookies, session data, verification material, personal email addresses, identity documents, private exports, service-account keys or tokens in Git. Record only public URLs and redacted field-level before/after values. Every external edit stays pending until approval immediately before save, send or publish.
