# SEO Local B30 Authority Rollout Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tăng relevance và prominence thật cho Mushroomie qua Google Business Profile, review khách thật, NAP citation và local authority mà không tạo location/review/link giả.

**Architecture:** Đây là rollout có external mutations, tách khỏi code/on-site plan. Mọi nền tảng được audit read-only trước; thay đổi được áp từng profile sau khi so với NAP canonical trong `BRAND`, lưu before/after evidence và có rollback từng trường. Website chỉ nhận Google profile/review URL sau khi URL công khai đã được xác minh; không hardcode URL phỏng đoán.

**Tech Stack:** Google Business Profile UI, Google Search/Maps, các profile social/shop hiện hữu, Mushroomie review-request flow, CSV tracker và tài liệu vận hành. Không dùng scraping đăng nhập, mua review, backlink marketplace hoặc browser profile cá nhân nếu chưa được người dùng yêu cầu.

## Global Constraints

- NAP canonical: `Mushroomie`, `Hẻm 2, tổ 11, phường Trảng Dài, tỉnh Đồng Nai`, `0947192590`, `https://mushroomie.io.vn`.
- Tọa độ canonical: `10.996333, 106.882306`.
- TP.HCM chỉ là khu vực giao online; tuyệt đối không tạo location/cửa hàng/địa chỉ TP.HCM.
- Không đổi tên doanh nghiệp để nhồi từ khóa; không chọn category/dịch vụ không đúng hoạt động thật.
- Không tạo profile GBP trùng; audit/claim profile hiện hữu trước khi tạo mới.
- Không mua review, không đổi quà/giảm giá lấy review, không review gating, không nhờ nhân viên/người thân tự đánh giá.
- Chỉ khách thật sau giao dịch nhận lời mời; mọi mức độ hài lòng nhận cùng một đường dẫn và quyền opt-out.
- Không mua backlink hàng loạt, PBN, spam forum/profile hoặc citation rỗng.
- Mọi mutation tài khoản ngoài website cần xác nhận ngay trước khi bấm lưu/gửi/xuất bản.
- Không commit cookie, session, ảnh giấy tờ xác minh, mã verification, email cá nhân, token hoặc private business export.
- Organic rank và Local Pack rank báo riêng; Google xác nhận local ranking phụ thuộc relevance, distance và prominence, không có cách trả tiền/yêu cầu thứ hạng tốt hơn.

---

## File Structure

- Create `docs/operations/seo-local-b30-authority.md`: runbook chính thức, rollback và cadence.
- Create `docs/seo-local-b30/citation-tracker.csv`: tracker NAP/link công khai, không chứa secret.
- Create `docs/seo-local-b30/authority-evidence-template.md`: checklist evidence không chứa dữ liệu xác minh nhạy cảm.
- Create `tests/local-seo-authority-docs.test.ts`: khóa tracker/runbook và chống location/review/link giả.

### Task 1: Read-only GBP and public entity baseline

**Files:**
- Create: `docs/seo-local-b30/authority-evidence-template.md`
- No external writes.

**Interfaces:**
- Consumes: canonical `BRAND` NAP and public profile URLs.
- Produces: redacted baseline with profile state, duplicate risk and exact fields requiring change.

- [ ] **Step 1: Create the evidence template**

```markdown
# B30 Authority Evidence Template

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
```

During execution copy this template to evidence storage outside Git, fill the measurement date and do not leave empty cells in the finalized evidence—use `not publicly exposed` or `not applicable` when appropriate.

- [ ] **Step 2: Audit Google Search/Maps without authentication**

Search exact brand + phone + address and inspect Maps results. Record public URLs and duplicate candidates. A result with a similar name but different phone/address is not assumed to be Mushroomie. Do not suggest edits or create a profile during this step.

- [ ] **Step 3: Inspect Business Profile ownership with an authorized session**

Only after the user explicitly asks to use their logged-in browser, use `chrome:control-chrome`; otherwise use a dedicated isolated browser profile. Open `https://business.google.com/`, inspect ownership/verification status and categories, and do not press Save/Verify/Create. Never print cookies or verification data.

- [ ] **Step 4: Compare every field to the canonical NAP**

Classify each mismatch as:

```text
correct — exact or semantically identical canonical data
incomplete — missing field that can be truthfully supplied
incorrect — conflicts with BRAND truth
needs-business-decision — category/hours/service claim not provable from repo
duplicate-risk — another profile may represent the same business
```

- [ ] **Step 5: Commit only the redacted template/runbook structure**

Do not commit screenshots or an authenticated baseline containing sensitive ownership data. Commit the reusable template after secret scan:

```bash
git add docs/seo-local-b30/authority-evidence-template.md
git diff --cached --check
git commit -m "docs(seo): add B30 authority evidence template"
```

### Task 2: Verified Google Business Profile corrections

**Files:**
- Modify external GBP only after per-mutation approval.
- Append redacted results to an evidence copy stored outside Git if ownership details are sensitive.

**Interfaces:**
- Consumes: Task 1 baseline and user approval.
- Produces: one verified, non-duplicate profile matching real NAP.

- [ ] **Step 1: Resolve duplicate/claim state before editing fields**

If a matching profile exists, claim/request access through the official flow. If multiple matching profiles exist, stop and resolve ownership/duplicate guidance; do not create a third. If no profile exists, create exactly one at the Trảng Dài business location only after the user confirms the business is eligible and can complete Google's verification flow.

- [ ] **Step 2: Let the user complete verification**

Verification may require video, phone, email, postcard or business documentation. The user enters/records sensitive evidence. Do not ask them to paste verification codes, private documents or keys into chat or Git.

- [ ] **Step 3: Apply only verified truthful profile fields**

Use the canonical name/phone/site/address/coordinates. Set business hours only after the user confirms customer-facing availability. Choose the most specific truthful primary category based on categories actually offered by Google at edit time; record the selected category in evidence. Do not insert service keywords into the business name and do not add TP.HCM as a location.

- [ ] **Step 4: Complete relevant profile sections**

Add a concise truthful description, services/products that exist, and real business/product photos with usage rights. Never upload AI-generated shop/interior photos as evidence of a physical location. Do not claim amenities, inventory or prices that have not been verified.

- [ ] **Step 5: Verify public propagation and rollback readiness**

After Google publishes changes, compare Search/Maps public output with `BRAND`. Record before/proposed/after values. If address/phone/site/category becomes incorrect, restore the exact recorded before value and stop further changes until the discrepancy is understood.

### Task 3: Validate the public GBP entity handoff

**Files:**
- Update external redacted evidence only; do not change source until the exact public value exists.

**Interfaces:**
- Consumes: a verified public GBP profile URL from Task 2.
- Produces: a validated public-entity handoff suitable for a later literal-only source patch.

- [ ] **Step 1: Capture the stable public share URL**

Copy the URL from the public Maps/Profile share control. Reject edit-console, ownership, redirect-with-token and generic Google search URLs. Record the share URL in the private/redacted authority evidence; do not paste it into a source placeholder.

- [ ] **Step 2: Validate it logged out**

Open the share URL in an isolated logged-out browser. It must resolve over HTTPS to one Mushroomie profile showing the canonical name, Trảng Dài address/service truth, phone and website. If any field differs or a duplicate chooser appears, return to Task 2 and do not hand it to code.

- [ ] **Step 3: Keep unknown external data out of this pre-written plan**

Because the stable public URL does not exist in authoritative evidence at plan-writing time, this plan deliberately makes no `BRAND.sameAs` change. After Step 2 succeeds, create a narrow follow-up patch whose test and implementation both contain the exact observed literal; run `tests/local-seo.test.ts` and `tests/seo-audit-fixes.test.ts`, then commit only after a secret/query-token scan.

- [ ] **Step 4: Verify the handoff remains non-sensitive**

The handoff must contain only a public share URL and observed public NAP. It must not contain ownership state screenshots, verification methods, Google account email, query tokens, cookies or edit URLs. This completes the task independently even when the later literal-only code patch is deferred.

### Task 4: Ethical review acquisition and response cadence

**Files:**
- Review only: `src/lib/review-request.ts`, `src/app/api/cron/review-requests/route.ts`, `tests/review-request.test.ts`
- Modify website/email code only under a new approved design if a verified Google review URL becomes available.

**Interfaces:**
- Consumes: real completed orders, existing one-send/opt-out review flow.
- Produces: a non-gated review process and weekly response routine.

- [ ] **Step 1: Re-verify existing safeguards before enabling any email**

Run:

```bash
npx tsx --test tests/review-request.test.ts
```

Confirm delay is 3 days, batch limit 25, completed/unreviewed orders only, one `EmailLog` claim per order, MX validation, 30-day signed token and email-level opt-out. Do not change stable template keys.

- [ ] **Step 2: Keep website product reviews separate from Google reviews**

The current email points to `/danh-gia` and must remain a website product-review request. Do not silently redirect it to Google or show a Google button only after a positive rating; that would be review gating.

- [ ] **Step 3: Obtain the official Google review link from verified GBP**

Copy it from the Business Profile “Ask for reviews” control, validate it opens the correct Mushroomie profile in a logged-out browser, and store it in the operational evidence outside Git until a separate website/email design is approved. Do not derive or guess a Place ID.

- [ ] **Step 4: Send neutral invitations to real customers only**

If the user later approves a Google-review invitation, every eligible completed customer receives the same neutral wording regardless of website rating. Do not promise gifts, discounts, vouchers or preferential service. Preserve opt-out and sending caps.

- [ ] **Step 5: Respond weekly without exposing order data**

Respond to all legitimate reviews politely, without order code, phone, address or health/personal data. Flag spam/conflict through Google's official process; do not argue publicly or ask customers to delete criticism.

### Task 5: Citation and local-authority tracker

**Files:**
- Create: `docs/seo-local-b30/citation-tracker.csv`
- Create: `docs/operations/seo-local-b30-authority.md`
- Create: `tests/local-seo-authority-docs.test.ts`

**Interfaces:**
- Consumes: canonical NAP and public URLs.
- Produces: auditable citation/backlink queue and monthly recheck procedure.

- [ ] **Step 1: Create the exact tracker schema**

```csv
platform,public_url,profile_type,name,address,phone,website,target_url,anchor,relationship,link_attribute,verification_status,last_checked,owner_action,notes
Facebook,https://www.facebook.com/mushr00mie,social,Mushroomie,,,,https://mushroomie.io.vn/,Mushroomie,owned,unknown,pending_live_check,,verify_nap,Do not edit before read-only audit
Instagram,https://www.instagram.com/mushr00mie._/,social,Mushroomie,,,,https://mushroomie.io.vn/,Mushroomie,owned,unknown,pending_live_check,,verify_nap,Do not edit before read-only audit
TikTok,https://www.tiktok.com/@mushr00mie._,social,Mushroomie,,,,https://mushroomie.io.vn/,Mushroomie,owned,unknown,pending_live_check,,verify_nap,Do not edit before read-only audit
Shopee,https://shopee.vn/shop/475544379,marketplace,Mushroomie,,,,https://mushroomie.io.vn/,Mushroomie,owned,unknown,pending_live_check,,verify_nap,Do not edit before read-only audit
```

Blank NAP cells mean “not yet audited publicly”; they must be completed or explicitly changed to `not exposed` after inspection. Do not treat a pending row as a live citation win.

- [ ] **Step 2: Audit owned profiles first**

Open each public URL logged out, record exact name/address/phone/site/link attribute and last-checked date. Propose corrections to the user, then edit one platform at a time with before/after evidence. Keep handles/URLs stable unless the platform requires a verified correction.

- [ ] **Step 3: Build local authority through real relationships**

Record outreach only for real Đồng Nai/Biên Hòa organizations, events, creators, suppliers, schools/clubs or press whose audience/topic fits handmade accessories. The `relationship` field must explain why a mention is editorially legitimate. Reject paid bulk placements, reciprocal link farms and unrelated directories.

- [ ] **Step 4: Write the operations cadence**

The runbook must state:

```text
Weekly: new/recent review count, unanswered reviews, GBP warnings/suspensions, profile edits.
Monthly: NAP diff, citation live status, broken/redirected target URLs, new legitimate mentions.
Quarterly: category/services/photos accuracy, duplicate profile search, competitor relevance/prominence delta.
Rollback: restore recorded prior field; do not create a replacement profile to bypass a suspension.
```

Link Google's official local-ranking guidance: `https://support.google.com/business/answer/7091/improve-your-local-ranking-on-google`.

- [ ] **Step 5: Validate and commit documentation**

Add a legacy Node test or documentation assertion that the tracker header is exact, every seeded URL matches `BRAND.socials`, TP.HCM does not appear as a location row, and the runbook contains `no review gating`, `no duplicate profile`, and `no bulk backlinks`.

```bash
npx tsx --test tests/local-seo-authority-docs.test.ts
git add docs/seo-local-b30/citation-tracker.csv docs/operations/seo-local-b30-authority.md tests/local-seo-authority-docs.test.ts
git diff --cached --check
git commit -m "docs(seo): operationalize local authority signals"
```

### Task 6: Authority verification and ongoing loop

**Files:**
- Update only the external evidence/tracker fields that were actually verified.

**Interfaces:**
- Consumes: Tasks 1–5 and B30 weekly scorecard.
- Produces: recurring prominence evidence; not automatic top-one completion.

- [ ] **Step 1: Run public truth checks**

Verify Search/Maps profile name, address/service-area behavior, phone, site, hours and category. Check the four owned public profiles logged out. Confirm no duplicate GBP and no TP.HCM storefront claim.

- [ ] **Step 2: Correlate authority work with rankings without claiming causality**

Record weekly review/citation changes beside B30 organic and Local Pack observations. Describe correlation only; do not state that one citation/review caused a ranking change without controlled evidence.

- [ ] **Step 3: Apply the B30 success audit**

Authority tasks are healthy when NAP is consistent, GBP is verified/complete, review acquisition is ethical and citations are live. The parent goal is complete only when the measurement plan independently proves 30/30 organic top 1 for three consecutive weeks with correct owner URLs.

- [ ] **Step 4: Keep the goal active when rankings remain unproven**

If any query is not position 1 or lacks three observations, prioritize in this order: indexation → owner/intent conflict → snippet/CTR → internal/content support → legitimate authority gap. Never mark the goal complete merely because every operational checklist item is checked.
