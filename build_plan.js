const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    PageNumber, LevelFormat, PageBreak, TableOfContents
  } = require('docx');
  const fs = require('fs');
  
  const BRAND = "1A3A5C";
  const ACCENT = "E24B4A";
  const LIGHT_BLUE = "D5E8F8";
  const LIGHT_RED = "FCEAEA";
  const LIGHT_GRAY = "F5F5F5";
  const LIGHT_AMBER = "FEF3E2";
  const LIGHT_GREEN = "EAF3DE";
  const MID_GRAY = "CCCCCC";
  const WHITE = "FFFFFF";
  
  const border = { style: BorderStyle.SINGLE, size: 1, color: MID_GRAY };
  const borders = { top: border, bottom: border, left: border, right: border };
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: WHITE },
    bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
    left: { style: BorderStyle.NONE, size: 0, color: WHITE },
    right: { style: BorderStyle.NONE, size: 0, color: WHITE },
  };
  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };
  
  function h1(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 340, after: 120 },
      children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: BRAND })],
    });
  }
  
  function h2(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 80 },
      children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: BRAND })],
    });
  }
  
  function h3(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 180, after: 60 },
      children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: "333333" })],
    });
  }
  
  function p(text, opts = {}) {
    return new Paragraph({
      spacing: { before: 60, after: 100 },
      children: [new TextRun({ text, font: "Arial", size: 22, color: "333333", ...opts })],
    });
  }
  
  function bullet(text, level = 0) {
    return new Paragraph({
      numbering: { reference: "bullets", level },
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, font: "Arial", size: 22, color: "333333" })],
    });
  }
  
  function mono(text) {
    return new TextRun({ text, font: "Courier New", size: 18, color: "1A3A5C" });
  }
  
  function codeBlock(lines) {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({
        children: [new TableCell({
          borders: noBorders,
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: "1E2A38", type: ShadingType.CLEAR },
          margins: { top: 140, bottom: 140, left: 200, right: 200 },
          children: lines.map(line => new Paragraph({
            spacing: { before: 20, after: 20 },
            children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "A8D4F5" })],
          }))
        })]
      })]
    });
  }
  
  function twoColRow(label, value, shade = WHITE) {
    return new TableRow({
      children: [
        new TableCell({
          borders, width: { size: 2800, type: WidthType.DXA },
          shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: "333333" })] })]
        }),
        new TableCell({
          borders, width: { size: 6560, type: WidthType.DXA },
          shading: { fill: shade, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: value, font: "Arial", size: 20, color: "333333" })] })]
        }),
      ]
    });
  }
  
  function headerRow(cols, widths) {
    return new TableRow({
      children: cols.map((col, i) => new TableCell({
        borders, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: BRAND, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: col, font: "Arial", size: 20, bold: true, color: WHITE })] })]
      }))
    });
  }
  
  function dataRow(cols, widths, shade = WHITE) {
    return new TableRow({
      children: cols.map((col, i) => new TableCell({
        borders, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: shade, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: col, font: "Arial", size: 20, color: "333333" })] })]
      }))
    });
  }
  
  function spacer() {
    return new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun("")] });
  }
  
  function divider() {
    return new Paragraph({
      spacing: { before: 160, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" } },
      children: [new TextRun("")],
    });
  }
  
  function sectionBadge(text, color = BRAND) {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({
        children: [new TableCell({
          borders: noBorders,
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: color, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: WHITE })] })]
        })]
      })]
    });
  }
  
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } },
            { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 280 } } } },
          ]
        },
        {
          reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }]
        }
      ]
    },
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: BRAND }, paragraph: { spacing: { before: 340, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: BRAND }, paragraph: { spacing: { before: 260, after: 80 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: "333333" }, paragraph: { spacing: { before: 180, after: 60 }, outlineLevel: 2 } },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
        }
      },
      children: [
  
        // ── COVER ────────────────────────────────────────────────────────────────
        new Table({
          width: { size: 9720, type: WidthType.DXA },
          columnWidths: [9720],
          rows: [new TableRow({ children: [new TableCell({
            borders: noBorders,
            width: { size: 9720, type: WidthType.DXA },
            shading: { fill: BRAND, type: ShadingType.CLEAR },
            margins: { top: 500, bottom: 500, left: 400, right: 400 },
            children: [
              new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: "SIEM Case Manager", font: "Arial", size: 56, bold: true, color: WHITE })] }),
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "AI-Powered Security Incident Response Platform", font: "Arial", size: 28, color: "A8D4F5" })] }),
              new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Full-Stack Build Plan  |  v1.0  |  2025", font: "Arial", size: 22, color: "7AACCC" })] }),
            ]
          })]})],
        }),
  
        spacer(),
        spacer(),
  
        new Table({
          width: { size: 9720, type: WidthType.DXA },
          columnWidths: [4780, 4780],  // slightly narrower each + 160 gap approach — use plain split
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 4780, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: cellMargins, children: [
                new Paragraph({ children: [new TextRun({ text: "Frontend", font: "Arial", size: 20, bold: true, color: BRAND })] }),
                new Paragraph({ children: [new TextRun({ text: "Next.js 14 (App Router)", font: "Arial", size: 20, color: "333333" })] }),
              ]}),
              new TableCell({ borders: noBorders, width: { size: 4780, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: cellMargins, children: [
                new Paragraph({ children: [new TextRun({ text: "Backend", font: "Arial", size: 20, bold: true, color: BRAND })] }),
                new Paragraph({ children: [new TextRun({ text: "Python / FastAPI", font: "Arial", size: 20, color: "333333" })] }),
              ]}),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 4780, type: WidthType.DXA }, shading: { fill: LIGHT_AMBER, type: ShadingType.CLEAR }, margins: cellMargins, children: [
                new Paragraph({ children: [new TextRun({ text: "Integrations", font: "Arial", size: 20, bold: true, color: "6B3A00" })] }),
                new Paragraph({ children: [new TextRun({ text: "FastMCP + VirusTotal + CrowdStrike", font: "Arial", size: 20, color: "333333" })] }),
              ]}),
              new TableCell({ borders: noBorders, width: { size: 4780, type: WidthType.DXA }, shading: { fill: LIGHT_AMBER, type: ShadingType.CLEAR }, margins: cellMargins, children: [
                new Paragraph({ children: [new TextRun({ text: "Hosting", font: "Arial", size: 20, bold: true, color: "6B3A00" })] }),
                new Paragraph({ children: [new TextRun({ text: "DigitalOcean App Platform + DO Registry", font: "Arial", size: 20, color: "333333" })] }),
              ]}),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 4780, type: WidthType.DXA }, shading: { fill: LIGHT_GREEN, type: ShadingType.CLEAR }, margins: cellMargins, children: [
                new Paragraph({ children: [new TextRun({ text: "Database", font: "Arial", size: 20, bold: true, color: "1B5E20" })] }),
                new Paragraph({ children: [new TextRun({ text: "MongoDB (Motor async) + Redis", font: "Arial", size: 20, color: "333333" })] }),
              ]}),
              new TableCell({ borders: noBorders, width: { size: 4780, type: WidthType.DXA }, shading: { fill: LIGHT_GREEN, type: ShadingType.CLEAR }, margins: cellMargins, children: [
                new Paragraph({ children: [new TextRun({ text: "AI / MCP", font: "Arial", size: 20, bold: true, color: "1B5E20" })] }),
                new Paragraph({ children: [new TextRun({ text: "Anthropic claude-sonnet-4-6 + FastMCP", font: "Arial", size: 20, color: "333333" })] }),
              ]}),
            ]}),
          ]
        }),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── TOC ──────────────────────────────────────────────────────────────────
        h1("Contents"),
        new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 1. OVERVIEW ──────────────────────────────────────────────────────────
        sectionBadge("1. Project overview"),
        spacer(),
        p("SIEM Case Manager is an AI-powered security incident response platform built for SOC analysts. It combines traditional case management (alert triage, timelines, IOC tracking, playbook execution) with a live MCP integration layer that calls VirusTotal, CrowdStrike Falcon, AlienVault OTX, and LDAP enrichment tools directly from within a case — and an analyst AI console powered by the Anthropic API that lets analysts query case context in natural language."),
        spacer(),
        p("The platform is designed as a showcase-grade production application: realistic mock data, full authentication, dynamic MITRE-aligned playbooks with conditional branching, and a CI/CD pipeline deploying to DigitalOcean."),
        spacer(),
  
        h2("1.1 Core modules"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2600, 6760],
          rows: [
            headerRow(["Module", "Description"], [2600, 6760]),
            dataRow(["Case management", "Create, triage, assign, and close security incidents. Full timeline, severity, MITRE tagging, SLA tracking."], [2600, 6760]),
            dataRow(["IOC enrichment", "Automatic and on-demand enrichment via VirusTotal, OTX, and GeoIP. Score, tag, and correlate indicators."], [2600, 6760], LIGHT_GRAY),
            dataRow(["LDAP / identity", "Pull Active Directory user context on affected accounts: OU, groups, MFA status, manager, privilege level."], [2600, 6760]),
            dataRow(["MCP integration layer", "CrowdStrike Falcon EDR, VirusTotal, AlienVault OTX, and LDAP connected via FastMCP with demo-mode fixture fallback."], [2600, 6760], LIGHT_GRAY),
            dataRow(["Analyst AI console", "Free-form and template-based prompting against case context. Prompt history, context toggles, MCP tool auto-selection."], [2600, 6760]),
            dataRow(["Playbook engine", "Five default MITRE-aligned playbooks with dynamic step branching. Steps can trigger MCP tool calls and spawn child playbooks."], [2600, 6760], LIGHT_GRAY),
            dataRow(["Authentication", "JWT access + refresh tokens, bcrypt passwords, RBAC roles (analyst, tier2, admin), route-level middleware."], [2600, 6760]),
          ]
        }),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 2. TECH STACK ─────────────────────────────────────────────────────────
        sectionBadge("2. Technology stack"),
        spacer(),
  
        h2("2.1 Frontend — Next.js 14"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 3080, 3880],
          rows: [
            headerRow(["Package", "Version", "Purpose"], [2400, 3080, 3880]),
            dataRow(["next", "14.x", "App Router, SSR, middleware auth"], [2400, 3080, 3880]),
            dataRow(["react", "18.x", "UI component tree"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["tailwindcss", "3.x", "Utility-first styling"], [2400, 3080, 3880]),
            dataRow(["shadcn/ui", "latest", "Accessible pre-built components"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["@tanstack/react-query", "5.x", "Server state, cache, background refetch"], [2400, 3080, 3880]),
            dataRow(["zustand", "4.x", "UI-only state (open panels, active case)"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["next-auth", "5.x", "JWT session, middleware route protection"], [2400, 3080, 3880]),
            dataRow(["zod", "3.x", "Schema validation on forms and API calls"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["lucide-react", "latest", "Icon set"], [2400, 3080, 3880]),
          ]
        }),
  
        spacer(),
        h2("2.2 Backend — FastAPI"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 3080, 3880],
          rows: [
            headerRow(["Package", "Version", "Purpose"], [2400, 3080, 3880]),
            dataRow(["fastapi", "0.115.x", "Async API framework, OpenAPI auto-docs"], [2400, 3080, 3880]),
            dataRow(["uvicorn", "0.30.x", "ASGI server"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["motor", "3.x", "Async MongoDB driver (wraps PyMongo)"], [2400, 3080, 3880]),
            dataRow(["redis[asyncio]", "5.x", "Session cache, rate limiting, task queue"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["pydantic", "2.x", "Request/response models, settings"], [2400, 3080, 3880]),
            dataRow(["pydantic-settings", "2.x", "Env-var config with type validation"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["python-jose", "3.x", "JWT encode/decode"], [2400, 3080, 3880]),
            dataRow(["passlib[bcrypt]", "1.x", "Password hashing"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["anthropic", "0.40.x", "Claude API — analyst AI console"], [2400, 3080, 3880]),
            dataRow(["httpx", "0.27.x", "Async HTTP client for external APIs"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["pytest-asyncio", "0.24.x", "Async test runner"], [2400, 3080, 3880]),
          ]
        }),
  
        spacer(),
        h2("2.3 MCP server — FastMCP"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 3080, 3880],
          rows: [
            headerRow(["Package", "Version", "Purpose"], [2400, 3080, 3880]),
            dataRow(["fastmcp", "2.x", "MCP server framework, tool decorator registration"], [2400, 3080, 3880]),
            dataRow(["httpx", "0.27.x", "Async calls to VirusTotal, CrowdStrike APIs"], [2400, 3080, 3880], LIGHT_GRAY),
            dataRow(["python-ldap3", "2.x", "LDAP/AD enrichment queries"], [2400, 3080, 3880]),
            dataRow(["pydantic", "2.x", "Tool input/output schemas"], [2400, 3080, 3880], LIGHT_GRAY),
          ]
        }),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 3. PROJECT STRUCTURE ──────────────────────────────────────────────────
        sectionBadge("3. Project structure"),
        spacer(),
        p("The monorepo is organised into three top-level packages that each deploy as separate services, sharing a Docker Compose network for local development."),
        spacer(),
        codeBlock([
          "siem-case-manager/",
          "├── frontend/                   # Next.js 14 app",
          "│   ├── app/",
          "│   │   ├── (auth)/login/       # Login page (public route)",
          "│   │   ├── (auth)/logout/",
          "│   │   ├── dashboard/          # Case queue + stats",
          "│   │   ├── cases/[id]/         # Case detail (timeline, IOCs, console)",
          "│   │   ├── cases/[id]/playbook/[pbId]/",
          "│   │   ├── playbooks/          # Playbook library",
          "│   │   └── api/auth/[...nextauth]/  # NextAuth handler",
          "│   ├── components/",
          "│   │   ├── cases/              # CaseHeader, Timeline, IOCTable, StatusBadge",
          "│   │   ├── enrichment/         # LDAPPanel, GeoIPPanel, MCPCallViewer",
          "│   │   ├── playbooks/          # PlaybookRunner, StepCard, BranchDecision",
          "│   │   ├── console/            # AnalystPrompt, PromptHistory, ContextToggles",
          "│   │   └── ui/                 # shadcn base (button, card, badge, dialog...)",
          "│   ├── lib/",
          "│   │   ├── api.ts              # React Query hooks (useCases, useCase, useEnrich)",
          "│   │   ├── auth.ts             # NextAuth config + JWT helpers",
          "│   │   └── utils.ts",
          "│   ├── types/                  # Shared TypeScript interfaces",
          "│   └── middleware.ts           # Route protection (matcher: /dashboard, /cases)",
          "│",
          "├── backend/                    # FastAPI app",
          "│   ├── app/",
          "│   │   ├── main.py             # App factory, CORS, lifespan",
          "│   │   ├── api/v1/",
          "│   │   │   ├── auth.py         # /login, /refresh, /logout",
          "│   │   │   ├── cases.py        # CRUD + timeline + status transitions",
          "│   │   │   ├── playbooks.py    # Library + execution engine",
          "│   │   │   ├── enrichment.py   # LDAP, GeoIP, IOC endpoints",
          "│   │   │   └── console.py      # SSE streaming AI prompt endpoint",
          "│   │   ├── core/",
          "│   │   │   ├── config.py       # pydantic-settings (env vars)",
          "│   │   │   ├── security.py     # JWT create/verify, bcrypt",
          "│   │   │   └── deps.py         # Depends(get_current_user), Depends(require_role)",
          "│   │   ├── models/             # Pydantic schemas (request + response)",
          "│   │   │   ├── case.py",
          "│   │   │   ├── user.py",
          "│   │   │   ├── ioc.py",
          "│   │   │   └── playbook.py",
          "│   │   ├── db/",
          "│   │   │   ├── mongo.py        # Motor client, collection helpers",
          "│   │   │   └── redis.py        # aioredis client",
          "│   │   └── services/",
          "│   │       ├── case_service.py",
          "│   │       ├── playbook_engine.py   # Branch evaluator",
          "│   │       ├── console_service.py   # Anthropic SDK + SSE",
          "│   │       └── auth_service.py",
          "│   ├── seed/",
          "│   │   ├── cases.json          # 6 mock cases (incl. CASE-2024-0847)",
          "│   │   ├── users.json          # analyst, tier2, admin accounts",
          "│   │   ├── playbooks.json      # 5 MITRE-aligned playbook definitions",
          "│   │   └── seed.py             # python seed/seed.py — drops + repopulates",
          "│   └── tests/",
          "│       ├── test_cases.py",
          "│       ├── test_auth.py",
          "│       └── test_playbook_engine.py",
          "│",
          "├── mcp-server/                 # FastMCP sidecar",
          "│   ├── server.py               # FastMCP() app, tool registration",
          "│   ├── tools/",
          "│   │   ├── virustotal.py       # vt_ip_report, vt_hash_lookup, vt_domain_scan",
          "│   │   ├── crowdstrike.py      # cs_host_details, cs_contain_host, cs_ioc_search",
          "│   │   ├── otx.py              # otx_pulse_search, otx_indicator",
          "│   │   └── ldap_tool.py        # ldap_user_lookup (mocked in DEMO_MODE)",
          "│   ├── mock_responses/         # JSON fixtures for every tool (DEMO_MODE=true)",
          "│   │   ├── vt_ip_185.220.101.47.json",
          "│   │   ├── cs_ioc_search_finance.json",
          "│   │   └── ...",
          "│   └── tests/",
          "│",
          "├── docker-compose.yml",
          "├── docker-compose.prod.yml     # Overrides for DO App Platform",
          "├── .github/",
          "│   └── workflows/",
          "│       ├── ci.yml              # Lint + test on PR",
          "│       └── deploy.yml          # Build → push DOCR → rolling deploy",
          "└── .env.example",
        ]),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 4. AUTH ────────────────────────────────────────────────────────────────
        sectionBadge("4. Authentication design"),
        spacer(),
        p("Authentication uses a standard OAuth2 password flow backed by JWT. The backend issues two tokens: a short-lived access token (15 minutes) used as a Bearer header, and a long-lived refresh token (7 days) stored in an httpOnly cookie that is never accessible to JavaScript."),
        spacer(),
        h2("4.1 Token flow"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1800, 7560],
          rows: [
            headerRow(["Step", "Detail"], [1800, 7560]),
            dataRow(["POST /login", "Client sends email + password. Backend verifies bcrypt hash, issues access_token (JWT, 15m) + sets refresh_token cookie (httpOnly, 7d)."], [1800, 7560]),
            dataRow(["Authenticated request", "Client sends Authorization: Bearer <access_token>. FastAPI dependency verifies signature, expiry, and injects current_user."], [1800, 7560], LIGHT_GRAY),
            dataRow(["POST /refresh", "Called silently by React Query when 401 is received. Backend reads refresh cookie, issues new access token."], [1800, 7560]),
            dataRow(["POST /logout", "Backend invalidates refresh token in Redis blocklist. Cookie cleared."], [1800, 7560], LIGHT_GRAY),
          ]
        }),
        spacer(),
        h2("4.2 RBAC roles"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1600, 7760],
          rows: [
            headerRow(["Role", "Permissions"], [1600, 7760]),
            dataRow(["analyst", "Read cases, submit prompts, view playbook steps, run enrichment. Cannot change case severity or close cases."], [1600, 7760]),
            dataRow(["tier2", "All analyst permissions + update case status, escalate, execute containment MCP actions, mark false positive."], [1600, 7760], LIGHT_GRAY),
            dataRow(["admin", "All tier2 permissions + manage users, edit playbook definitions, view audit logs, access seed endpoints."], [1600, 7760]),
          ]
        }),
        spacer(),
        h2("4.3 Mock user accounts (seed data)"),
        codeBlock([
          "# analyst account",
          "email: analyst.kim@corp.local  |  password: Demo1234!  |  role: analyst",
          "",
          "# tier2 account",
          "email: lead.reyes@corp.local   |  password: Demo1234!  |  role: tier2",
          "",
          "# admin account",
          "email: admin@corp.local        |  password: Admin5678!  |  role: admin",
        ]),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 5. PLAYBOOK ENGINE ────────────────────────────────────────────────────
        sectionBadge("5. Playbook engine"),
        spacer(),
        p("The playbook engine evaluates a MongoDB-stored directed graph of steps. Each step has an optional condition_field, a branches array, and an optional mcp_tools list. After an analyst completes a step, the engine evaluates the branch conditions against the step's result_data and returns the next step ID. Steps with auto: true are executed immediately on case creation or escalation without analyst intervention."),
        spacer(),
        h2("5.1 Step document schema"),
        codeBlock([
          "{",
          "  '_id':            ObjectId,",
          "  'playbook_id':    str,           # e.g. 'phishing'",
          "  'step_id':        str,           # e.g. 'step_2a'",
          "  'title':          str,",
          "  'description':    str,",
          "  'auto':           bool,          # execute without analyst input",
          "  'mcp_tools':      list[str],     # tool names to call automatically",
          "  'condition_field': str | None,   # field name from result_data to branch on",
          "  'branches': [",
          "    {",
          "      'when':   str,   # operator:value  e.g. 'gte:70', 'eq:attachment', 'contains:FIN7'",
          "      'goto':   str,   # step_id or 'escalate:<playbook_id>'",
          "      'label':  str",
          "    }",
          "  ],",
          "  'default_goto':  str | None,    # fallback if no branch matches",
          "  'mitre_technique': str          # e.g. 'T1566.001'",
          "}",
        ]),
        spacer(),
        h2("5.2 Branch evaluation logic (Python)"),
        codeBlock([
          "def evaluate_branch(condition_field: str, result_data: dict, branches: list) -> str:",
          "    value = result_data.get(condition_field)",
          "    for branch in branches:",
          "        op, operand = branch['when'].split(':', 1)",
          "        if op == 'gte'   and float(value) >= float(operand): return branch['goto']",
          "        if op == 'lt'    and float(value) <  float(operand): return branch['goto']",
          "        if op == 'eq'    and str(value) == operand:          return branch['goto']",
          "        if op == 'contains' and operand in str(value):       return branch['goto']",
          "        if op == 'bool'  and bool(value) == (operand=='true'): return branch['goto']",
          "    return step.get('default_goto') or 'END'",
        ]),
        spacer(),
        h2("5.3 Default playbook library"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2000, 1800, 5560],
          rows: [
            headerRow(["Playbook", "MITRE tactics", "Key branching decisions"], [2000, 1800, 5560]),
            dataRow(["Phishing", "TA0001 T1566", "Delivery type (attachment vs URL) → VT score → privileged user affected"], [2000, 1800, 5560]),
            dataRow(["Credential theft", "TA0006 T1078", "Dump method (LSASS vs PTH vs stuffing) → lateral movement found"], [2000, 1800, 5560], LIGHT_GRAY),
            dataRow(["Ransomware", "TA0040 T1486", "Decryptor available → encrypted asset criticality"], [2000, 1800, 5560]),
            dataRow(["Malware / C2", "TA0011 T1071", "Malware category (RAT / loader / stealer) → spread count"], [2000, 1800, 5560], LIGHT_GRAY),
            dataRow(["DDoS", "TA0040 T1498", "Attack type (volumetric / protocol / app-layer) → campaign attribution"], [2000, 1800, 5560]),
          ]
        }),
        spacer(),
        p("Escalation: any branch with goto: 'escalate:<playbook_id>' causes the engine to create a linked child case and start the target playbook autonomously, inheriting the parent case's IOCs and LDAP context."),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 6. MCP SERVER ─────────────────────────────────────────────────────────
        sectionBadge("6. MCP server (FastMCP)"),
        spacer(),
        p("The MCP server runs as a standalone sidecar process (port 8001). The FastAPI backend connects to it as an MCP client when the analyst AI console or playbook engine needs to call an external tool. In DEMO_MODE=true every tool returns fixture JSON from the mock_responses/ directory — no API keys required for the showcase."),
        spacer(),
        h2("6.1 Tool registry"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2600, 2000, 4760],
          rows: [
            headerRow(["Tool name", "Provider", "What it returns"], [2600, 2000, 4760]),
            dataRow(["vt_ip_report", "VirusTotal", "Detection count, reputation score, ASN, country, historical reports"], [2600, 2000, 4760]),
            dataRow(["vt_hash_lookup", "VirusTotal", "Malware family, detection count, sandbox verdict, MITRE technique"], [2600, 2000, 4760], LIGHT_GRAY),
            dataRow(["vt_domain_scan", "VirusTotal", "Category, registrar, creation date, resolving IPs, TLS org"], [2600, 2000, 4760]),
            dataRow(["vt_file_submit", "VirusTotal", "Async scan job ID + poll for result"], [2600, 2000, 4760], LIGHT_GRAY),
            dataRow(["cs_host_details", "CrowdStrike", "Device ID, OS, sensor version, prevention policy, last seen, containment status"], [2600, 2000, 4760]),
            dataRow(["cs_process_tree", "CrowdStrike", "Parent/child process chain for a given hash + device + timestamp"], [2600, 2000, 4760], LIGHT_GRAY),
            dataRow(["cs_contain_host", "CrowdStrike", "Network-isolate a host via Falcon Real Time Response"], [2600, 2000, 4760]),
            dataRow(["cs_ioc_search", "CrowdStrike", "Hunt a hash, IP, or domain across all hosts in a given OU"], [2600, 2000, 4760], LIGHT_GRAY),
            dataRow(["otx_pulse_search", "AlienVault OTX", "Threat intel pulses matching an IOC — campaign tags, malware family"], [2600, 2000, 4760]),
            dataRow(["otx_indicator", "AlienVault OTX", "Reputation, related IPs, threat type, adversary attribution"], [2600, 2000, 4760], LIGHT_GRAY),
            dataRow(["ldap_user_lookup", "AD / LDAP", "SAM account, UPN, OU path, groups, MFA status, manager, account status"], [2600, 2000, 4760]),
          ]
        }),
        spacer(),
        h2("6.2 Tool registration pattern (FastMCP)"),
        codeBlock([
          "from fastmcp import FastMCP",
          "from app.core.config import settings",
          "from app.mock_responses import load_mock",
          "",
          "mcp = FastMCP('siem-enrichment', port=8001)",
          "",
          "@mcp.tool()",
          "async def vt_ip_report(ip: str, include_resolutions: bool = True) -> dict:",
          "    '''Query VirusTotal v3 for IP reputation and resolution history.'''",
          "    if settings.DEMO_MODE:",
          "        return load_mock('vt_ip_report', ip)",
          "    async with httpx.AsyncClient() as client:",
          "        r = await client.get(",
          "            f'https://www.virustotal.com/api/v3/ip_addresses/{ip}',",
          "            headers={'x-apikey': settings.VT_API_KEY}",
          "        )",
          "        return r.json()",
        ]),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 7. AI CONSOLE ─────────────────────────────────────────────────────────
        sectionBadge("7. Analyst AI console"),
        spacer(),
        p("The analyst AI console calls the Anthropic API directly from the FastAPI backend. Case context (case details, LDAP enrichment, IOC data, playbook state) is assembled server-side and injected as a system prompt. The response streams back to the frontend via Server-Sent Events (SSE)."),
        spacer(),
        h2("7.1 Streaming endpoint"),
        codeBlock([
          "# backend/app/api/v1/console.py",
          "",
          "@router.post('/cases/{case_id}/console/stream')",
          "async def stream_console(",
          "    case_id: str,",
          "    body: ConsolePromptRequest,",
          "    current_user: User = Depends(get_current_user),",
          "    db: AsyncIOMotorDatabase = Depends(get_db),",
          "):",
          "    case = await case_service.get_case(db, case_id)",
          "    system_prompt = build_system_prompt(case, body.context_flags)",
          "",
          "    async def event_generator():",
          "        async with anthropic.AsyncAnthropic().messages.stream(",
          "            model='claude-sonnet-4-6',",
          "            max_tokens=1500,",
          "            system=system_prompt,",
          "            messages=[{'role': 'user', 'content': body.prompt}]",
          "        ) as stream:",
          "            async for text in stream.text_stream:",
          "                yield f'data: {json.dumps({\"delta\": text})}\\n\\n'",
          "        yield 'data: [DONE]\\n\\n'",
          "",
          "    return StreamingResponse(event_generator(), media_type='text/event-stream')",
        ]),
        spacer(),
        h2("7.2 System prompt assembly"),
        p("The build_system_prompt() function assembles context blocks based on the context_flags sent by the frontend. Each block is only included if the analyst has toggled it on in the UI."),
        codeBlock([
          "def build_system_prompt(case: Case, flags: ContextFlags) -> str:",
          "    blocks = [",
          "        'You are an expert SOC analyst AI assistant. Analyse the following case',",
          "        'context and answer the analyst query concisely and precisely.',",
          "        'Always cite evidence. Flag uncertainty. Suggest next steps.',",
          "    ]",
          "    if flags.case_details:   blocks.append(f'CASE:\\n{case.to_context_str()}')",
          "    if flags.ldap:           blocks.append(f'LDAP:\\n{case.ldap_context}')",
          "    if flags.ioc_data:       blocks.append(f'IOCs:\\n{case.ioc_context}')",
          "    if flags.virustotal:     blocks.append(f'VT RESULTS:\\n{case.vt_results}')",
          "    if flags.crowdstrike:    blocks.append(f'CS TELEMETRY:\\n{case.cs_results}')",
          "    if flags.playbook_state: blocks.append(f'PLAYBOOK:\\n{case.playbook_state}')",
          "    return '\\n\\n'.join(blocks)",
        ]),
        spacer(),
        h2("7.3 Prompt templates"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 7160],
          rows: [
            headerRow(["Template", "Prompt text sent to Claude"], [2200, 7160]),
            dataRow(["Attribution analysis", "Based on all available IOC data, LDAP enrichment, and MCP tool results, provide a full threat actor attribution analysis. Include confidence level, supporting evidence, and matching TTPs."], [2200, 7160]),
            dataRow(["Exfil scope check", "Review all evidence and determine whether data exfiltration occurred. Check email forward rules, large file transfers, and DNS/HTTP traffic to the C2. Quantify risk if exfil cannot be ruled out."], [2200, 7160], LIGHT_GRAY),
            dataRow(["Blast radius", "What is the full blast radius? Identify every account, host, and data asset that may have been touched or is at risk. Prioritise by sensitivity."], [2200, 7160]),
            dataRow(["Hunt new IOCs", "Using existing IOCs, generate a list of additional related indicators to hunt for. Include YARA rule ideas and network signatures."], [2200, 7160], LIGHT_GRAY),
            dataRow(["Exec summary", "Write an executive summary for CISO briefing: what happened, who was affected, business risk, containment actions taken, remediation outstanding. Max 200 words."], [2200, 7160]),
            dataRow(["Remediation steps", "Provide a complete prioritised remediation checklist covering identity, endpoint, email, network, and policy layers. Flag items needing change management."], [2200, 7160], LIGHT_GRAY),
            dataRow(["Reconstruct timeline", "Reconstruct the full attack timeline from initial delivery through containment, with timestamps, techniques, and evidence sources for each event."], [2200, 7160]),
          ]
        }),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 8. MOCK DATA ──────────────────────────────────────────────────────────
        sectionBadge("8. Mock data strategy"),
        spacer(),
        p("The seed script populates a dev MongoDB instance with a complete realistic dataset drawn from the scenarios prototyped in the design phase. Running python seed/seed.py drops and fully repopulates all collections in under two seconds."),
        spacer(),
        h2("8.1 Mock cases"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 1600, 1400, 3960],
          rows: [
            headerRow(["Case ID", "Severity", "Status", "Scenario"], [2400, 1600, 1400, 3960]),
            dataRow(["CASE-2024-0847", "Critical", "In progress", "Credential stuffing + lateral movement — Finance OU. Primary showcase case."], [2400, 1600, 1400, 3960]),
            dataRow(["CASE-2024-0851", "High", "Open", "Phishing campaign — Word macro dropper. Three Finance recipients."], [2400, 1600, 1400, 3960], LIGHT_GRAY),
            dataRow(["CASE-2024-0839", "Critical", "Closed", "Ransomware — LockBit variant on FS-FINANCE-01. Resolved via backup restore."], [2400, 1600, 1400, 3960]),
            dataRow(["CASE-2024-0855", "Medium", "Open", "Malware beacon — Cobalt Strike implant on WKST-MW-007. C2 blocked."], [2400, 1600, 1400, 3960], LIGHT_GRAY),
            dataRow(["CASE-2024-0831", "Low", "Closed", "DDoS — volumetric UDP flood on public API. Mitigated via CDN."], [2400, 1600, 1400, 3960]),
            dataRow(["CASE-2024-0860", "High", "Open", "Insider threat — suspicious bulk download from SharePoint by departing employee."], [2400, 1600, 1400, 3960], LIGHT_GRAY),
          ]
        }),
        spacer(),
        h2("8.2 Mock IOCs"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1600, 3760, 1400, 2600],
          rows: [
            headerRow(["Type", "Value", "Score", "Associated case"], [1600, 3760, 1400, 2600]),
            dataRow(["IPv4", "185.220.101.47", "92 / malicious", "CASE-2024-0847"], [1600, 3760, 1400, 2600]),
            dataRow(["SHA256", "a3f1c9b2e847d6f0391cc52a4e1b7f3d", "78 / Mimikatz", "CASE-2024-0847"], [1600, 3760, 1400, 2600], LIGHT_GRAY),
            dataRow(["Domain", "corp-mail-auth.ru", "88 / EvilProxy", "CASE-2024-0847, 0851"], [1600, 3760, 1400, 2600]),
            dataRow(["IPv4", "45.142.212.100", "74 / Cobalt Strike", "CASE-2024-0855"], [1600, 3760, 1400, 2600], LIGHT_GRAY),
            dataRow(["SHA256", "b7e2f4a9c183d0e5274bc61a3f928e1c", "91 / LockBit loader", "CASE-2024-0839"], [1600, 3760, 1400, 2600]),
          ]
        }),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 9. DEPLOYMENT ─────────────────────────────────────────────────────────
        sectionBadge("9. Deployment — DigitalOcean"),
        spacer(),
        p("The production topology uses three DigitalOcean App Platform components backed by a managed MongoDB Atlas cluster and a managed Redis instance. Each component is built from its own Dockerfile and deployed independently via GitHub Actions."),
        spacer(),
        h2("9.1 DigitalOcean topology"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 2000, 4960],
          rows: [
            headerRow(["Component", "DO resource type", "Notes"], [2400, 2000, 4960]),
            dataRow(["frontend", "App Platform — web", "Next.js. DO detects automatically. Zero-config HTTPS + custom domain."], [2400, 2000, 4960]),
            dataRow(["backend", "App Platform — web", "FastAPI / Uvicorn. Dockerfile build. Internal service URL for MCP."], [2400, 2000, 4960], LIGHT_GRAY),
            dataRow(["mcp-server", "App Platform — worker", "FastMCP. Internal-only, not exposed publicly. backend calls it over private network."], [2400, 2000, 4960]),
            dataRow(["MongoDB", "MongoDB Atlas M0 (free tier)", "Separate cluster. Connection string in DO secret env var."], [2400, 2000, 4960], LIGHT_GRAY),
            dataRow(["Redis", "DO Managed Redis (1GB)", "Used for sessions and rate limiting. Internal VPC access only."], [2400, 2000, 4960]),
            dataRow(["Container registry", "DO Container Registry", "Built images pushed here by CI. App Platform pulls from it."], [2400, 2000, 4960], LIGHT_GRAY),
          ]
        }),
        spacer(),
        h2("9.2 Environment variables (.env.example)"),
        codeBlock([
          "# backend",
          "MONGODB_URL=mongodb+srv://...",
          "REDIS_URL=redis://...",
          "JWT_SECRET_KEY=<64-char random hex>",
          "JWT_ALGORITHM=HS256",
          "ACCESS_TOKEN_EXPIRE_MINUTES=15",
          "REFRESH_TOKEN_EXPIRE_DAYS=7",
          "ANTHROPIC_API_KEY=sk-ant-...",
          "DEMO_MODE=true                    # true = use mock fixtures, no live API calls",
          "",
          "# mcp-server",
          "VT_API_KEY=<virustotal key>",
          "CS_CLIENT_ID=<crowdstrike client id>",
          "CS_CLIENT_SECRET=<crowdstrike secret>",
          "OTX_API_KEY=<alienvault key>",
          "LDAP_HOST=ldap://10.0.0.1",
          "LDAP_BIND_DN=cn=svc-siem,...",
          "LDAP_BIND_PASSWORD=...",
          "DEMO_MODE=true",
          "",
          "# frontend (Next.js public env)",
          "NEXTAUTH_SECRET=<32-char random>",
          "NEXTAUTH_URL=https://your-domain.com",
          "NEXT_PUBLIC_API_URL=https://api.your-domain.com",
        ]),
        spacer(),
        h2("9.3 CI/CD pipeline (GitHub Actions)"),
        p("Two workflows: ci.yml runs on every pull request (lint, type-check, pytest), and deploy.yml runs on push to main (build Docker images → push to DO Container Registry → trigger rolling deploy via DO API)."),
        codeBlock([
          "# .github/workflows/deploy.yml (simplified)",
          "on:",
          "  push:",
          "    branches: [main]",
          "",
          "jobs:",
          "  deploy:",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "",
          "      - name: Install doctl",
          "        uses: digitalocean/action-doctl@v2",
          "        with:",
          "          token: ${{ secrets.DO_ACCESS_TOKEN }}",
          "",
          "      - name: Log in to DO Container Registry",
          "        run: doctl registry login",
          "",
          "      - name: Build + push backend",
          "        run: |",
          "          docker build -t registry.digitalocean.com/siem/backend:$GITHUB_SHA ./backend",
          "          docker push registry.digitalocean.com/siem/backend:$GITHUB_SHA",
          "",
          "      - name: Build + push mcp-server",
          "        run: |",
          "          docker build -t registry.digitalocean.com/siem/mcp:$GITHUB_SHA ./mcp-server",
          "          docker push registry.digitalocean.com/siem/mcp:$GITHUB_SHA",
          "",
          "      - name: Trigger App Platform deploy",
          "        run: doctl apps create-deployment ${{ secrets.DO_APP_ID }}",
        ]),
        spacer(),
        h2("9.4 Docker Compose (local development)"),
        codeBlock([
          "# docker-compose.yml",
          "services:",
          "  frontend:",
          "    build: ./frontend",
          "    ports: ['3000:3000']",
          "    environment:",
          "      NEXT_PUBLIC_API_URL: http://localhost:8000",
          "    depends_on: [backend]",
          "",
          "  backend:",
          "    build: ./backend",
          "    ports: ['8000:8000']",
          "    environment:",
          "      MONGODB_URL: mongodb://mongo:27017/siem",
          "      REDIS_URL: redis://redis:6379",
          "      DEMO_MODE: 'true'",
          "    depends_on: [mongo, redis, mcp]",
          "",
          "  mcp:",
          "    build: ./mcp-server",
          "    ports: ['8001:8001']",
          "    environment:",
          "      DEMO_MODE: 'true'",
          "",
          "  mongo:",
          "    image: mongo:7",
          "    ports: ['27017:27017']",
          "    volumes: ['mongo_data:/data/db']",
          "",
          "  redis:",
          "    image: redis:7-alpine",
          "    ports: ['6379:6379']",
          "",
          "volumes:",
          "  mongo_data:",
        ]),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 10. SPRINT PLAN ───────────────────────────────────────────────────────
        sectionBadge("10. Sprint plan"),
        spacer(),
        p("Six two-week sprints. Each sprint produces a shippable increment. The showcase demo milestone is end of sprint 5 — sprint 6 handles hardening and final polish."),
        spacer(),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1200, 2000, 6160],
          rows: [
            headerRow(["Sprint", "Theme", "Deliverables"], [1200, 2000, 6160]),
            dataRow(["1", "Foundation", "Monorepo scaffold, Docker Compose, MongoDB + Redis, FastAPI skeleton, Next.js skeleton, NextAuth JWT flow, seed script, 3 mock users, CI lint+test workflow."], [1200, 2000, 6160]),
            dataRow(["2", "Core case management", "Case CRUD API, case list + detail pages, timeline component, severity/status badges, MITRE tagging, SLA tracking, IOC table. No enrichment yet."], [1200, 2000, 6160], LIGHT_GRAY),
            dataRow(["3", "MCP + enrichment layer", "FastMCP server, all 11 tools registered, DEMO_MODE fixture responses, VirusTotal + CrowdStrike + OTX panels in UI, LDAP enrichment panel, GeoIP."], [1200, 2000, 6160]),
            dataRow(["4", "Playbook engine", "All 5 playbook definitions seeded, step runner API, branch evaluator, PlaybookRunner UI component, step completion + branching in frontend, child playbook escalation."], [1200, 2000, 6160], LIGHT_GRAY),
            dataRow(["5", "Analyst AI console", "SSE streaming endpoint, context assembly, all 7 prompt templates, PromptHistory component, context toggle UI, MCP tool call display in history. Demo-ready."], [1200, 2000, 6160]),
            dataRow(["6", "Hardening + deploy", "DO App Platform setup, deploy.yml CI/CD, HTTPS + domain, RBAC enforcement audit, rate limiting, error handling polish, README, demo walkthrough script."], [1200, 2000, 6160], LIGHT_GRAY),
          ]
        }),
  
        spacer(),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 11. NEXT STEPS ────────────────────────────────────────────────────────
        sectionBadge("11. Immediate next steps"),
        spacer(),
        p("To begin sprint 1, run the following commands to scaffold the monorepo:"),
        spacer(),
        codeBlock([
          "# 1. Scaffold monorepo",
          "mkdir siem-case-manager && cd siem-case-manager",
          "git init",
          "",
          "# 2. Frontend",
          "npx create-next-app@latest frontend --typescript --tailwind --app --src-dir",
          "cd frontend && npx shadcn@latest init",
          "",
          "# 3. Backend",
          "cd ../",
          "mkdir backend && cd backend",
          "python -m venv .venv && source .venv/bin/activate",
          "pip install fastapi uvicorn motor redis pydantic-settings python-jose passlib anthropic httpx pytest-asyncio",
          "",
          "# 4. MCP server",
          "cd ../",
          "mkdir mcp-server && cd mcp-server",
          "python -m venv .venv && source .venv/bin/activate",
          "pip install fastmcp httpx ldap3 pydantic",
          "",
          "# 5. Start full stack",
          "cd ../",
          "docker compose up --build",
          "",
          "# 6. Seed database",
          "docker compose exec backend python seed/seed.py",
        ]),
        spacer(),
        p("After scaffolding, the recommended first pull request is the authentication flow end-to-end: FastAPI /login + /refresh + /logout endpoints, NextAuth configuration, JWT middleware protecting /dashboard and /cases routes, and the three seeded user accounts working on the login page."),
        spacer(),
        spacer(),
        new Paragraph({
          spacing: { before: 300, after: 100 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: MID_GRAY } },
          children: [new TextRun({ text: "SIEM Case Manager — Build Plan v1.0  |  Confidential  |  Generated 2025", font: "Arial", size: 18, color: "999999" })]
        }),
      ]
    }]
  });
  
  Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('/home/claude/siem_build_plan.docx', buffer);
    console.log('Done');
  });