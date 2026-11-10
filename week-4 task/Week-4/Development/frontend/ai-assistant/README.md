# AI Assistant Web Application - Angular Frontend

A modern, responsive, and secure Angular standalone frontend for the Week 4 Full-Stack AI Assistant. Designed as a dark-mode AI SaaS interface with high-contrast typography, subtle yellow accents, reactive authentication, and seamless integration with the Flask + MongoDB + Groq backend.

---

## 1. Project Overview & Architecture

The frontend follows the Angular 21 Standalone Component architecture without legacy NgModules:

```
src/
├── environments/
│   ├── environment.ts                # Production API configuration (http://localhost:5000/api)
│   └── environment.development.ts    # Development API configuration
│
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts         # Protects /dashboard (redirects unauthenticated users to /login)
│   │   │   └── guest.guard.ts        # Protects /login & /register (redirects authenticated users to /dashboard)
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts   # Injects 'Authorization: Bearer <token>' & auto-handles 401 token revocation
│   │   ├── models/
│   │   │   ├── auth.models.ts        # User, AuthResponse, Register/Login contracts
│   │   │   ├── ai.models.ts          # ChatMessage, ChatResponse, ProviderDetail, ChatUsage
│   │   │   └── health.model.ts       # HealthResponse contract
│   │   └── services/
│   │       ├── auth.service.ts       # Central auth state (BehaviorSubject), sessionStorage JWT management
│   │       ├── ai.service.ts         # Chat completions, provider metadata & health checks
│   │       └── markdown.service.ts   # Marked + Prism.js + DOMPurify ChatGPT-grade renderer with code copy
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/                # Sign-in page with validation & password toggle
│   │   │   └── register/             # User creation with confirmation password match validation
│   │   └── dashboard/                # Main interface: sidebar, model badge, AI chat with markdown & copy
│   │
│   ├── app.component.ts              # Root standalone component (<router-outlet>)
│   ├── app.config.ts                 # ApplicationConfig with provideRouter and provideHttpClient
│   └── app.routes.ts                 # Route definitions with lazy component loading
│
├── index.html                        # Base HTML with metadata and title
└── styles.css                        # Design system tokens, variables, scrollbars, and reset
```

---

## 2. Technology Stack

- **Framework:** Angular 21.2 (Standalone Components)
- **Language:** TypeScript 5.9
- **Markdown & Code Highlighting:** `marked` (v18.2), `prismjs` (v1.30), `dompurify` (v3.4)
- **Routing:** `@angular/router` with lazy-loading and route guards
- **State & Reactivity:** RxJS (`BehaviorSubject`, `Observable`, `tap`, `catchError`)
- **HTTP Client:** Angular `provideHttpClient` with functional HTTP interceptors
- **Form Handling:** Angular Reactive Forms with custom match validators
- **Styling:** Vanilla CSS with modern custom properties (Zero heavy UI dependencies)
- **Testing:** Vitest with Angular Testbed (`@vitest/expect`) - 21 unit tests across 5 suites

---

## 3. UI/UX Design System (Premium Minimal AI Chatbot)

- **Palette:**
  - Main Canvas: `#0B0D10`
  - Sidebar: `#11141A` (collapsible to icon-only rail or mobile drawer)
  - User Messages: `#1C2533` with rounded bubble corners
  - Assistant Messages: Direct on main canvas (transparent background with subtle elevation)
  - Primary Accent: `#E8B43D` (warm gold) with subtle glow
  - Typography: `#F5F5F5` (crisp white) and `#929BAA` (secondary slate)
  - Subtle Borders: `#252B35`
- **Layout & Conversation Focus:**
  - Centered conversation column (`max-width: 850px`) for optimal readability.
  - Zero developer clutter: removed GROQ badges, model chips, JWT pills, and diagnostic cards from the chat viewport.
  - Collapsible sidebar: desktop collapse toggle + mobile slide-out drawer with backdrop.
  - Welcome Screen: refined hero with spark badge, "What would you like to explore today?" heading, and 4 responsive starter cards (Learn Something, Write Code, Problem Solving, Explore Ideas).
  - Anchored Composer: rounded `#151921` container with multiline input, auto-character warning near limit, and circular gold send action.
  - Compact User Profile: initial avatar circle + dropdown popover for account information and sign out.
  - Token Usage Disclosure: prompt, completion, and total tokens neatly tucked into an on-demand "Tokens" toggle button.

---

## 4. Application Routes

| Route | Guard | Description |
| :--- | :--- | :--- |
| `/login` | `guestGuard` | User authentication form with email/password validation |
| `/register` | `guestGuard` | Account registration with password confirmation & strength rules |
| `/dashboard` | `authGuard` | Protected minimal AI chatbot interface, conversation flow, and profile popover |
| `**` | — | Fallback redirect to `/dashboard` |

---

## 5. Prerequisites & Environment Setup

- **Node.js:** v20+ or v22+
- **npm:** v10+ or v11+
- **Backend:** Flask running on `http://127.0.0.1:5000`

### Configure Environment

Verify API base URL in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:5000/api'
};
```

---

## 6. Running the Application

### 1. Start the Flask Backend
From the project root:
```bash
cd Week-4/Development/backend
python app.py
```
Backend will start on `http://127.0.0.1:5000`.

### 2. Start the Angular Development Server
Open a separate terminal:
```bash
cd Week-4/Development/frontend/ai-assistant
npm install
npm start
```
Navigate your browser to: **`http://localhost:4200`**

---

## 7. Polished Chatbot Engine & Markdown Pipeline

The chat interface features an industrial-grade Markdown and interaction engine encapsulated in `MarkdownService` and `DashboardComponent`:

1. **Selective Prose Normalization & Math Rendering:**
   - Unescapes LLM artifacts outside code blocks: `\##` → `##`, `\|` → `|`, `\*\*` → `**`, `\_` → `_`, `\>` → `>`, `\[` / `\]` → `[` / `]`, `&#x20;` → ` `.
   - Fenced code blocks (` ```...``` `) are strictly preserved without corrupting language keywords, regexes, escapes, or indentation.
   - LaTeX mathematical expressions: display math (`$$...$$`, `\[...\]`) and inline math (`\(...\)`, `$math$`), with negative lookahead protecting currency values (e.g. `$100` remains currency).
2. **Grammar & Syntax Highlighting:**
   - Powered by `Prism.js` with comprehensive language tokenizers: TypeScript, JavaScript, Python, Java, C, C++, C#, Go, Rust, Bash, SQL, JSON, YAML, and Docker.
   - Code blocks render inside `.code-block-wrapper` with a custom header displaying language pill and a 1-click **Copy snippet** button (copies code only, displays "Copied" feedback).
3. **Assistant Message Action Toolbar:**
   - **Copy Response:** Copies raw markdown response to clipboard with visual confirmation.
   - **Regenerate Response:** Re-invokes backend inference with the original user prompt and replaces the answer.
   - **Feedback (Thumbs Up / Thumbs Down):** Interactive toggle states with gold and coral highlights.
   - **Token Metrics Disclosure:** Expandable popover detailing prompt, completion, and total tokens on demand.
4. **Smart Auto-Scroll & Error Resilience:**
   - Intelligent auto-scroll smoothly moves down when user sends or receives messages, but preserves scroll position if the user has scrolled up to read earlier responses.
   - Structured error presentation with **Retry** (automatic re-execution) and **Edit prompt** (restores failed prompt to composer).

---

## 8. Build & Testing

### Production Build
```bash
npm run build
```
Generates production-optimized standalone bundles inside `dist/ai-assistant/` with zero budget or compiler errors.

### Run Unit Tests
```bash
npx ng test --watch=false
```
Executes all **27 unit tests** across 5 test suites:
- `MarkdownService` (9 tests): Normalization, heading/list rendering, nested lists, responsive tables, Prism syntax highlighting, XSS sanitization, REST API sample, LaTeX math formulas, and secure external links.
- `AuthService` (4 tests): Login, token persistence, user profile emission, and logout token revocation.
- `AiService` (4 tests): Prompt completion requests, provider metadata, and backend health monitoring.
- `DashboardComponent` (9 tests): Message streaming, markdown rendering, code copy, response regeneration, feedback toggles, request retry, and prompt restore.
- `AppComponent` (1 test): Shell routing and outlet verification.
- `AppComponent`: Shell routing and outlet verification.

---

## 9. Security & Sanitization Highlights

1. **Defense-in-Depth HTML Sanitization:**
   - AI outputs are first parsed by `marked` into semantic HTML.
   - Raw HTML is strictly sanitized using `DOMPurify.sanitize()` with an explicit whitelist of safe tags (`div`, `span`, `pre`, `code`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `button`, `svg`, `path`, `rect`) and attributes (`class`, `data-code`, `title`, `viewBox`, `fill`, `stroke`, `stroke-width`, `d`, `x`, `y`, `width`, `height`, `rx`, `ry`).
   - All `<script>`, `onerror`, `onload`, `javascript:` URI schemes, and dangerous attributes are neutralized before calling Angular's `DomSanitizer.bypassSecurityTrustHtml()`.
2. **Short-Lived Token in SessionStorage:** The JWT access token is stored in `sessionStorage` (cleared immediately when the browser tab closes).
3. **Server-Side Token Invalidation:** When the user clicks **Sign Out**, the backend revokes the token's `jti` in MongoDB.
4. **Automatic 401 Interception:** Any response with status `401 Unauthorized` triggers immediate local session clearing and redirection to `/login?sessionExpired=true`.
5. **No Secrets in Frontend:** API keys (Groq / OpenAI) remain strictly isolated on the backend server.
