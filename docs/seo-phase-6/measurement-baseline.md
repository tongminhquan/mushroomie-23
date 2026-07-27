# Mushroomie SEO Phase 6 - Measurement Baseline

Generated: 2026-07-27T18:33:18.920Z

## Kết luận

- Baseline date: `2026-07-28`
- Keyword plan: 30 từ khóa, 8 canonical owner URL.
- Public sitemap: 134 URL tại thời điểm audit.
- Trạng thái dữ liệu tài khoản: `pending_authenticated_data`.
- Không có thứ hạng, click, impression, CTR, index count, CWV field data, GA4
  organic traffic hoặc Local Pack position nào được suy đoán.

## Bằng chứng đã xác minh công khai

- Production JavaScript bundle chứa GTM `GTM-K55B6RVG`; container
  quản lý GA4 `G-R95TLDCP0W`, Google Ads `AW-18206718336` và Clarity.
- Website chỉ nạp một GTM container; không nạp thêm gtag.js hoặc Clarity trực tiếp,
  tránh ghi nhận trùng page view và conversion.
- `https://mushroomie.io.vn/sitemap.xml` truy cập được và robots.txt trỏ tới
  sitemap này.
- DNS TXT có token `google-site-verification`. Token này không chứng minh phiên
  audit có quyền đọc property hoặc sitemap đã được submit trong Search Console.

## Dữ liệu còn chờ xác thực

| Nhóm | Nguồn bắt buộc | Trạng thái |
|---|---|---|
| Click, impression, CTR, position 30 từ khóa | GSC Search Analytics | pending_authenticated_data |
| Sitemap submitted/last read/status | GSC Sitemaps report hoặc API | pending_authenticated_data |
| Index status và Google-selected canonical | GSC URL Inspection | pending_authenticated_data |
| Organic sessions và purchase conversion | GA4 reports | pending_authenticated_data |
| LCP, INP, CLS field data | CrUX/PageSpeed Insights | pending_authenticated_data |
| Search terms, views, calls, directions, website clicks | Verified GBP Performance | pending_authenticated_data |
| Local Pack position | Geo-grid/manual neutral-location tracking | pending_authenticated_data |

## Owner actions

1. Mở Search Console property `sc-domain:mushroomie.io.vn`, vào **Sitemaps**,
   submit `https://mushroomie.io.vn/sitemap.xml`, rồi ghi Submitted, Last read,
   Status và Discovered pages vào scorecard.
2. Export GSC Search Analytics 28 ngày theo dimensions `query,page`; đối chiếu
   đúng 30 từ khóa trong `keyword-baseline.csv`.
3. Kiểm tra ít nhất chín canonical owner URL bằng URL Inspection; không dùng
   lệnh `site:` làm bằng chứng index chính thức.
4. Mở GA4 Realtime hoặc DebugView để xác nhận `page_view`, ecommerce events và
   `purchase`; không tạo tag GA4 thứ hai.
5. Ghi CrUX/PageSpeed mobile p75 cho LCP, INP và CLS hằng tuần khi có dữ liệu.
6. Sau khi GBP được xác minh, export Performance và theo dõi Local Pack ở vị trí
   tìm kiếm phù hợp tại Đồng Nai/Biên Hòa.

## File vận hành

- `keyword-baseline.csv`: 30 từ khóa và owner URL, để trống metric chưa có nguồn.
- `weekly-scorecard.csv`: mẫu theo dõi GSC, GA4, index, CWV và Local Pack.
- `measurement-readiness.json`: bằng chứng máy đọc được của lần audit này.

## Official references

- Search Console Sitemaps report:
  https://support.google.com/webmasters/answer/7451001
- GA4 Realtime and events:
  https://support.google.com/analytics/answer/9322688
- GA4 DebugView:
  https://support.google.com/analytics/answer/7201382
- Google Business Profile Performance:
  https://support.google.com/business/answer/9918094

## Machine-readable readiness

```json
{
  "generatedAt": "2026-07-27T18:33:18.920Z",
  "baselineDate": "2026-07-28",
  "measurementStatus": "pending_authenticated_data",
  "publicChecks": {
    "homepage": {
      "url": "https://mushroomie.io.vn/",
      "status": 200,
      "contentType": "text/html; charset=utf-8"
    },
    "sitemap": {
      "url": "https://mushroomie.io.vn/sitemap.xml",
      "status": 200,
      "contentType": "application/xml"
    },
    "robots": {
      "url": "https://mushroomie.io.vn/robots.txt",
      "status": 200,
      "contentType": "text/plain; charset=utf-8"
    },
    "health": {
      "url": "https://mushroomie.io.vn/api/health",
      "status": 200,
      "contentType": "application/json"
    }
  },
  "tags": {
    "googleTagManagerId": "GTM-K55B6RVG",
    "googleAnalyticsId": "G-R95TLDCP0W",
    "googleAdsId": "AW-18206718336",
    "productionBundleHasGtm": true,
    "productionBundleHasGa4": false,
    "productionBundleHasGoogleAds": true
  },
  "searchConsole": {
    "dnsVerificationTokenPresent": true,
    "dnsVerificationTokenCount": 1,
    "sitemapReferencedInRobots": true,
    "sitemapPublicUrlCount": 134,
    "authenticatedAccessConfigured": false,
    "submittedSitemapStatus": "pending_authenticated_data",
    "searchAnalyticsStatus": "pending_authenticated_data",
    "urlInspectionStatus": "pending_authenticated_data"
  },
  "analytics": {
    "ga4ReportingConfigured": false,
    "organicTrafficStatus": "pending_authenticated_data",
    "purchaseReportingStatus": "pending_authenticated_data"
  },
  "performance": {
    "cruxApiConfigured": false,
    "coreWebVitalsStatus": "pending_authenticated_data"
  },
  "local": {
    "gbpReportingConfigured": false,
    "performanceStatus": "pending_authenticated_data",
    "localPackStatus": "pending_authenticated_data"
  },
  "keywords": {
    "count": 30,
    "canonicalOwnerCount": 8,
    "rankingStatus": "pending_authenticated_data"
  }
}
```
