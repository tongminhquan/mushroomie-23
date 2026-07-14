# Mushroomie Google Ads Performance Max Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure a Google Ads Performance Max campaign that optimizes for website purchases in Ho Chi Minh City and Dong Nai with a 30,000 VND daily budget for 10 days, stopping before publication.

**Architecture:** Use the existing signed-in Google Ads campaign wizard and linked Merchant Center catalog. Configure campaign objective and measurement first, then assets and audience signals, followed by bidding, budget, schedule, and a final read-only review before the publish action.

**Tech Stack:** Google Ads Performance Max, Google Merchant Center, Mushroomie website conversion tracking, Codex in-app browser.

## Global Constraints

- Primary conversion: completed website purchase.
- Secondary interactions must not replace purchase as the bidding objective.
- Geographic targeting: Ho Chi Minh City and Dong Nai.
- Language: Vietnamese.
- Landing page: `https://mushroomie.io.vn/`.
- Daily budget: 30,000 VND.
- Duration: 10 days.
- Planned media budget: 300,000 VND.
- Do not publish or activate billing without a separate final confirmation.
- Do not enter, expose, or save payment credentials, OTPs, passwords, or recovery information.
- Stop if purchase tracking is absent or if the linked Merchant Center identity remains inconsistent with Mushroomie.

---

### Task 1: Recover The Campaign Wizard

**Browser state:**
- Continue: the signed-in Google Ads Performance Max draft for account `128-832-4503 Mushroomie`.
- Preserve: the current Merchant Center product group and landing page.

**Interfaces:**
- Consumes: the existing campaign draft and signed-in browser session.
- Produces: an interactive campaign wizard with no ad-blocker modal covering required controls.

- [ ] **Step 1: Claim the existing Google Ads tab and inspect the current DOM snapshot**

Expected: the wizard is at `Tạo quảng cáo`; headlines, descriptions, images, and logo are incomplete.

- [ ] **Step 2: Dismiss the visible `Turn off ad blockers` modal if it exposes a unique close control**

Expected: the modal is no longer visible and campaign fields remain unchanged.

- [ ] **Step 3: If the modal returns, stop and report the blocker**

Do not bypass browser security controls or install/disable extensions automatically.

### Task 2: Correct The Campaign Objective And Measurement

**Browser state:**
- Modify: campaign goal selection and conversion action selection.

**Interfaces:**
- Consumes: the recovered campaign wizard.
- Produces: a Performance Max campaign whose primary optimization action is website purchase.

- [ ] **Step 1: Navigate back to `Chọn mục tiêu` without discarding the campaign draft**

Expected: the campaign goal screen is visible.

- [ ] **Step 2: Select the sales or website-purchase objective**

Expected: `Mua hàng` or the equivalent completed-purchase conversion is selected as primary.

- [ ] **Step 3: Remove phone calls from primary optimization**

Calls may remain as a secondary asset or observation, but they must not be the campaign's primary goal.

- [ ] **Step 4: Verify purchase conversion readiness**

Expected: Google Ads shows an active website purchase conversion suitable for bidding. If it is missing, inactive, or unverified, stop before bidding and report the exact status.

### Task 3: Configure Location, Language, And Product Scope

**Browser state:**
- Modify: campaign settings and product group.

**Interfaces:**
- Consumes: a valid website-purchase objective.
- Produces: a Vietnamese campaign limited to Ho Chi Minh City and Dong Nai using the linked Merchant Center catalog.

- [ ] **Step 1: Set campaign language to Vietnamese**

Expected: Vietnamese is selected.

- [ ] **Step 2: Set locations to Ho Chi Minh City and Dong Nai**

Expected: exactly those two locations are included; nationwide Vietnam targeting is not active.

- [ ] **Step 3: Preserve the linked Merchant Center product group**

Expected: eligible Mushroomie products remain selected. If the linked catalog is visibly branded only as `Hago Tree`, stop and report the identity mismatch before publication.

### Task 4: Populate Text Assets

**Browser state:**
- Modify: the Performance Max asset group.

**Interfaces:**
- Consumes: Mushroomie brand voice and `https://mushroomie.io.vn/` landing page.
- Produces: complete Vietnamese ad text within Google Ads character limits.

- [ ] **Step 1: Add these short headlines, each with at most 30 characters**

```text
Phụ Kiện Handmade Cá Tính
Vòng Tay Custom Theo Ý Bạn
Charm Xinh Cho Câu Chuyện
Quà Tặng Cá Nhân Hóa
Mushroomie Handmade
Tạo Phong Cách Riêng
Móc Khóa Handmade Xinh
Vòng Tay Theo Tên Riêng
Charm Theo Sở Thích
Quà Xinh Gửi Người Thương
```

- [ ] **Step 2: Add these long headlines, each with at most 90 characters**

```text
Vòng tay, charm và móc khóa handmade được cá nhân hóa theo phong cách của bạn
Chọn màu, tên và charm riêng để tạo món phụ kiện mang câu chuyện của chính bạn
Khám phá phụ kiện handmade Mushroomie cho quà tặng và phong cách riêng
```

- [ ] **Step 3: Add these descriptions, each with at most 90 characters**

```text
Chọn màu, tên và charm theo sở thích để tạo chiếc vòng mang dấu ấn riêng.
Khám phá vòng tay, móc khóa và phụ kiện handmade dành riêng cho bạn.
Quà tặng nhỏ xinh, cá nhân hóa theo câu chuyện và cảm xúc của người nhận.
Đặt phụ kiện handmade Mushroomie trực tuyến tại mushroomie.io.vn.
```

- [ ] **Step 4: Verify the business name**

Expected: the ad identity displays `Mushroomie`. If Google forces `Hago Tree` from Merchant Center, stop and report the required Merchant Center business-name correction.

### Task 5: Add Images, Logo, And Sitelinks

**Browser state:**
- Modify: image assets, business logo, and sitelink assets.

**Interfaces:**
- Consumes: assets already suggested from `https://mushroomie.io.vn/` or existing Google Ads/Business assets.
- Produces: at least one landscape image, one square image, one square logo, and four valid sitelinks.

- [ ] **Step 1: Select a landscape product/brand image**

Use a clear Mushroomie product image with no broken URL, no unrelated Hago Tree branding, and no misleading offer text.

- [ ] **Step 2: Select a square product/brand image**

Use a clear square composition featuring handmade accessories.

- [ ] **Step 3: Select the square Mushroomie logo**

Expected: the logo is legible at small sizes and matches the website identity.

- [ ] **Step 4: Add four sitelinks using valid routes exposed by the website or wizard**

Preferred labels and destinations:

```text
Sản phẩm handmade -> https://mushroomie.io.vn/san-pham
Vòng tay custom -> the verified custom-bracelet route
Tin tức & gợi ý quà -> https://mushroomie.io.vn/tin-tuc
Giỏ hàng -> https://mushroomie.io.vn/gio-hang
```

Do not guess the custom-bracelet route; omit or replace it with another verified route if unavailable.

### Task 6: Add Audience Signals And Search Themes

**Browser state:**
- Modify: audience signals and search themes.

**Interfaces:**
- Consumes: the approved geography and Mushroomie product categories.
- Produces: relevant signals without narrowing Performance Max into an unsupported hard audience restriction.

- [ ] **Step 1: Add interest or custom-segment signals for handmade accessories and personalized gifts**

- [ ] **Step 2: Add these Vietnamese search themes if the wizard exposes search themes**

```text
vòng tay handmade
vòng tay custom
charm vòng tay
móc khóa handmade
quà tặng cá nhân hóa
phụ kiện handmade
vòng tay theo tên
quà tặng cho người yêu
```

- [ ] **Step 3: Verify signals are guidance, not unintended demographic exclusions**

Expected: no age, gender, or income group is excluded without explicit user approval.

### Task 7: Configure Bidding, Budget, And Schedule

**Browser state:**
- Modify: bidding strategy, daily budget, campaign dates.

**Interfaces:**
- Consumes: a verified primary purchase conversion.
- Produces: a 10-day, 30,000 VND/day campaign ready for final review.

- [ ] **Step 1: Select Maximize conversions**

Do not set target ROAS unless the account presents reliable historical purchase value data and explicitly recommends an evidence-based value.

- [ ] **Step 2: Set the daily budget to 30,000 VND**

Expected: the budget field and summary both display `30.000 ₫` per day or the locale-equivalent representation.

- [ ] **Step 3: Set a 10-day schedule**

Use the account's local timezone. The end date must be ten calendar days after the selected start date, inclusive behavior checked against the review summary.

- [ ] **Step 4: Read Google's spend estimate**

If Google warns that actual daily spend or monthly charging can exceed the planned 300,000 VND total, report the displayed estimate before publication.

### Task 8: Final Review And Confirmation Gate

**Browser state:**
- Read only: the final campaign review screen.

**Interfaces:**
- Consumes: all configured campaign settings and assets.
- Produces: a verified unpublished campaign and a concise user-facing summary.

- [ ] **Step 1: Verify the final review summary**

Required evidence:

```text
Primary objective: website purchase
Locations: Ho Chi Minh City, Dong Nai
Language: Vietnamese
Budget: 30,000 VND/day
Schedule: 10 days
Bidding: Maximize conversions
Landing page: https://mushroomie.io.vn/
Required text/image/logo assets: complete
```

- [ ] **Step 2: Check for blocking warnings**

Stop if there is an unresolved conversion, Merchant Center identity, policy, billing, ad-blocker, or asset requirement.

- [ ] **Step 3: Do not click Publish, Create campaign, or any equivalent final action**

Report the exact final settings and ask for a separate confirmation that explicitly authorizes campaign publication and spend.
