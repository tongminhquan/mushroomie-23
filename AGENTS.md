<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Chrome DevTools MCP

- For Mushroomie frontend, browser, performance, network, console, responsive, and production UI verification, always use the `chrome-devtools` MCP when it is available.
- Use a dedicated MCP-managed Chrome profile by default. Do not attach to a personal Chrome profile or authenticated session unless the user explicitly asks for it.
- Verify relevant UI changes at desktop and mobile viewport sizes, inspect console and failed network requests, and report clearly when MCP access is unavailable.
