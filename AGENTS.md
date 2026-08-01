<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Chrome DevTools MCP

- For Mushroomie frontend, browser, performance, network, console, responsive, and production UI verification, always use the `chrome-devtools` MCP when it is available.
- Use a dedicated MCP-managed Chrome profile by default. Do not attach to a personal Chrome profile or authenticated session unless the user explicitly asks for it.
- Verify relevant UI changes at desktop and mobile viewport sizes, inspect console and failed network requests, and report clearly when MCP access is unavailable.

### Cấu hình

Server khai báo ở `.mcp.json` trong repo (project scope) nên mọi phiên làm việc trong dự án
này đều nhận được, không cần cài lại từng lần.

- Gói: [`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp), chạy qua
  `npx -y chrome-devtools-mcp@latest`. Yêu cầu Node `^20.19 || ^22.12 || >=23`.
- Trình duyệt: **Chrome for Testing**, không dùng Chromium hay bản Chrome cá nhân. Trên VM này
  cài bằng `npx @puppeteer/browsers install chrome@stable`, rồi trỏ symlink cố định
  `/usr/local/bin/chrome-for-testing` vào bản vừa tải — nâng cấp Chrome thì chỉ cần trỏ lại
  symlink, `.mcp.json` không phải sửa.
- Đường dẫn Chrome đọc qua `${CHROME_PATH:-/usr/local/bin/chrome-for-testing}`. Máy khác
  (Windows/macOS) chỉ cần đặt biến `CHROME_PATH` là dùng được cùng file cấu hình này.
- `--headless` vì VM không có `DISPLAY`; `--isolated` để mỗi phiên dùng profile tạm rồi tự
  xoá — đúng yêu cầu không đụng vào profile cá nhân ở trên.
- `--chromeArg=--no-sandbox` là bắt buộc do tiến trình chạy bằng root. Đừng bỏ cờ này trên VM,
  Chrome sẽ không khởi động được.

Kiểm tra nhanh khi nghi server hỏng: `npx -y chrome-devtools-mcp@latest --help` phải in ra danh
sách cờ, và `/usr/local/bin/chrome-for-testing --version` phải trả về "Google Chrome for Testing".

## Imported Claude Cowork project instructions

Code base website Mushroomie
