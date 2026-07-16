# Mushroomie SEO Roadmap - 2026-07-16

## Baseline da xac minh

- Production: `https://mushroomie.io.vn`
- Sitemap: 123 URL, gom 64 bai viet, 21 san pham va cac route tinh/local.
- Mau kiem tra production: 123/123 URL sitemap tra HTTP 200 tai thoi diem audit.
- `robots.txt` va `sitemap.xml` truy cap duoc; admin, gio hang va thanh toan co `X-Robots-Tag: noindex`.
- Bo tu khoa muc tieu: 30 dong trong `mushroomie_30_tu_khoa_seo.csv`.
- Local landing dang publish: 23 URL.

Baseline nay chi mo ta thoi diem audit. So URL index thuc te, Google-selected canonical,
impression, click va vi tri trung binh phai lay tu Google Search Console.

## Thu tu uu tien

| Pha | Cong viec | Ly do | Trang thai |
|---|---|---|---|
| P0 | Anh noi dung bai viet co kich thuoc that va `srcset` | Giam tai mobile, ngan CLS va anh meo | Dang trien khai |
| P0 | Sitemap ton trong `robots_index` va canonical | Khong gui tin hieu index mau thuan | Dang trien khai |
| P1 | Dong bo NAP, toa do, iframe Maps va social | Tang do nhat quan entity/local | Dang trien khai |
| P1 | Chuan hoa slug san pham tai API | Ngan URL Unicode/chu hoa moi | Dang trien khai |
| P1 | Dry-run migrate slug + redirect vinh vien | Bao toan URL cu va backlink | Cho backup/xac nhan apply |
| P2 | Audit 23 local landing bang GSC | Tranh doorway page va cannibalization | Cho du lieu GSC |
| P2 | Lam day 10 bai trong tam | Tang E-E-A-T va gia tri tim kiem | Can noi dung/anh that |
| P3 | Citation va outreach hop le | Xay authority khong spam | Tracker/baseline xong; marketing thuc hien |
| P3 | Theo doi 30 tu khoa, CWV, index, Local Pack | Do tac dong thay vi doan | Public baseline xong; cho GSC/GA4/GBP |

## Quyen so huu tu khoa

Khong tao 30 URL cho 30 tu khoa. Mo hinh hien tai gom tu khoa cung y dinh ve 9
trang chu so huu; cac bai/landing ho tro phai dat internal link ve trang chu so huu.

| Nhom trong CSV | URL chu so huu | Vai tro |
|---|---|---|
| 1-15: cac bien the vong tay | `/san-pham?category=vong-tay` | Trang thuong mai tru cot |
| 16, 18-20: phu kien/trang suc rong | `/san-pham` | Danh muc tong |
| 17: shop phu kien handmade | `/` | Thuong hieu/dieu huong |
| 21-23: moc khoa | `/san-pham?category=moc-khoa` | Danh muc san pham |
| 24-25: charm | `/san-pham?category=charm` | Danh muc san pham |
| 26-27: vong co/day chuyen | `/san-pham?category=vong-co` | Danh muc san pham |
| 28: qua tang handmade | `/tin-tuc/qua-tang-handmade` | Tu van + internal link thuong mai |
| 29: qua sinh nhat ban than | `/tin-tuc/vong-tay-best-friend-handmade` | Tu van theo doi tuong |
| 30: qua handmade nguoi yeu | `/tin-tuc/qua-handmade-tang-nguoi-yeu` | Tu van theo doi tuong |

### Quy tac chong cannibalization

1. Moi truy van chinh co dung mot URL chu so huu.
2. Facet tim kiem, sap xep, loc gia va trang > 1 khong tro thanh landing index rieng.
3. Chi tach `vong-tay-custom` khi co quy trinh custom, mau that, lead time va san
   pham du khac trang danh muc chung.
4. Bai thong tin dung anchor tu nhien tro ve danh muc; khong lap exact-match anchor
   hang loat.
5. Khong gop/noindex local landing chi dua tren do giong template. Quyet dinh can
   query, click, impression, canonical va coverage tu GSC.

## Audit 23 local landing

Rui ro cao nhat la cac cap gan trung y dinh:

- `phu-kien-handmade-dong-nai` va `shop-phu-kien-handmade-dong-nai`
- `phu-kien-handmade-bien-hoa` va `shop-phu-kien-handmade-bien-hoa`
- `vong-tay-handmade-dong-nai` va `vong-tay-handmade-trang-dai`
- `phu-kien-handmade-dong-nai` va `phu-kien-handmade-trang-dai`

Moi URL chi nen giu index khi co bang chung rieng: khu vuc phuc vu that, anh that,
chi tiet giao/nhan, FAQ rieng, san pham phu hop va truy van rieng. Cac trang TP.HCM
phai noi ro chi giao online, khong duoc tao cam giac co cua hang vat ly tai TP.HCM.

## On-page va noi dung

- Mot H1, canonical tu tro dung, title/meta khong trung.
- Alt mo ta dung vat the trong anh; khong lap mau nham tu khoa.
- Product schema chi co gia, availability va review that. Khong tao
  `aggregateRating` neu chua co du lieu review duoc duyet.
- Uu tien nang cap 10 bai co y dinh mua cao bang kinh nghiem lam that, anh quy
  trinh/san pham that, thong tin vat lieu, thoi gian va cach custom.
- `llms.txt` co the them nhu tai lieu truy cap, nhung khong xem do la yeu to xep
  hang da duoc chung minh.

## Local SEO va Maps

Website chi co the dong bo NAP/schema/Maps. Cac viec sau can chu doanh nghiep:

1. Claim va xac minh Google Business Profile tai dung pin cua cua hang.
2. Dong bo ten, dia chi, dien thoai, gio mo cua va URL website.
3. Dang anh that, cap nhat san pham/dich vu va tra loi review that.
4. Khong mua review va khong them review schema tu viet.

## Do luong

Thu thap hang tuan trong 12 tuan dau:

| Nhom | Chi so |
|---|---|
| GSC | click, impression, CTR, position theo 30 tu khoa va 9 URL chu so huu |
| Index | submitted/indexed, excluded, duplicate canonical, soft 404 |
| CWV | LCP, INP, CLS theo mobile va template |
| Local | GBP calls, directions, website clicks, Local Pack visibility |
| Conversion | add-to-cart, checkout start, purchase theo landing page |
| Authority | referring domains hop le, branded anchors, link mat/moi |

## Gioi han du lieu audit

- Khong co quyen GSC URL Inspection/Search Analytics trong phien nay.
- Khong co credential DataForSEO/Moz/Bing/Common Crawl de cham backlink hoac SERP
  overlap bang du lieu song.
- Bai viet nam trong MySQL/Prisma; chat luong 64 bai can export DB chi doc hoac
  crawl production de cham tung URL.
- Khong cam ket top 10. Roadmap nay toi uu xac suat va giu tin hieu sach.

## Phase 5 backlink

- Tracker van hanh: `docs/backlink-tracker.md`.
- Baseline: `docs/backlink-baseline-2026-07-17.md`.
- Backlink Health Score hien tai: `INSUFFICIENT DATA (0/7 yeu to)`.
- Bon profile Facebook, Instagram, TikTok va Shopee tra HTTP 200 nhung backlink
  chua xac minh duoc tu HTML khong-JavaScript; trang thai dung la
  `unverifiable_js`, khong phai `verified` hoac `lost`.
- Dinh huong an toan la 40-80 link/citation chat luong trong 6-12 thang, khong
  dung 200 backlink dofollow lam KPI.
- Claim citation, kiem tra bio va outreach la phan viec cua chu doanh
  nghiep/marketing; khong tu dong tao backlink.

## Phase 6 do luong

- Audit script: `npm run seo:audit:phase-6`.
- Measurement baseline: `docs/seo-phase-6/measurement-baseline.md`.
- Keyword baseline: `docs/seo-phase-6/keyword-baseline.csv`.
- Weekly scorecard: `docs/seo-phase-6/weekly-scorecard.csv`.
- Readiness evidence: `docs/seo-phase-6/measurement-readiness.json`.
- Da xac minh production bundle co GA4 `G-R95TLDCP0W`, Google Ads
  `AW-18206718336` va GTM `GTM-K55B6RVG`.
- GTM container khong chua truc tiep GA4/Ads ID tren; chua thay dau hieu hai
  nguon cung gui page view.
- Sitemap public co 123 URL, robots.txt tro dung sitemap va DNS TXT co mot token
  `google-site-verification`.
- GSC Search Analytics, submitted sitemap status, URL Inspection, GA4 reports,
  CrUX field data va GBP Performance van la `pending_authenticated_data`.
- Baseline thu hang truoc cac Phase 1-5 khong the tai tao neu khong co lich su
  GSC/SERP. File Phase 6 bat dau baseline co kiem chung tu ngay 2026-07-17 va
  khong dien so lieu gia.
