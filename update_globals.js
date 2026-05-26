const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf-8');

const newTokens = `:root {
  /* LIGHT MODE TOKENS */
  --bg-primary: #f8fafc;
  --bg-secondary: #e2e8f0;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --bg-glass: rgba(255, 255, 255, 0.85);

  --accent-blue: #3b82f6;
  --accent-blue-light: #60a5fa;
  --accent-blue-dark: #1d4ed8;
  --accent-orange: #f97316;
  --accent-orange-light: #fb923c;
  --accent-green: #10b981;
  --accent-green-light: #34d399;
  --accent-yellow: #f59e0b;
  --accent-purple: #8b5cf6;
  --accent-red: #ef4444;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  --border-subtle: rgba(15, 23, 42, 0.08);
  --border-card: rgba(15, 23, 42, 0.12);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --shadow-glow-blue: 0 0 20px rgba(59,130,246,0.3);
  --shadow-glow-orange: 0 0 20px rgba(249,115,22,0.3);
  --shadow-glow-green: 0 0 20px rgba(16,185,129,0.3);

  --nav-height: 72px;
  --header-height: 64px;
}

.dark {
  /* DARK MODE TOKENS */
  --bg-primary: #0a0f1e;
  --bg-secondary: #111827;
  --bg-card: #141c2e;
  --bg-card-hover: #1a2438;
  --bg-glass: rgba(20, 28, 46, 0.85);

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #475569;

  --border-subtle: rgba(148, 163, 184, 0.08);
  --border-card: rgba(148, 163, 184, 0.12);
}`;

css = css.replace(/:root\s*\{[\s\S]*?--header-height: 64px;\n\}/, newTokens);

// Update status colors for light mode to look good
css = css.replace(
  /\.status-arrived       \{ background: rgba\(249,115,22,0\.15\); color: #fb923c; border-color: rgba\(249,115,22,0\.25\); \}/,
  `.status-arrived       { background: rgba(249,115,22,0.15); color: var(--accent-orange); border-color: rgba(249,115,22,0.25); }`
);
css = css.replace(
  /\.status-diagnosing    \{ background: rgba\(59,130,246,0\.15\); color: #60a5fa; border-color: rgba\(59,130,246,0\.25\); \}/,
  `.status-diagnosing    { background: rgba(59,130,246,0.15); color: var(--accent-blue); border-color: rgba(59,130,246,0.25); }`
);
css = css.replace(
  /\.status-quote-pending \{ background: rgba\(245,158,11,0\.15\); color: #fbbf24; border-color: rgba\(245,158,11,0\.25\); \}/,
  `.status-quote-pending { background: rgba(245,158,11,0.15); color: var(--accent-yellow); border-color: rgba(245,158,11,0.25); }`
);
css = css.replace(
  /\.status-quote-accept  \{ background: rgba\(16,185,129,0\.15\); color: #34d399; border-color: rgba\(16,185,129,0\.25\); \}/,
  `.status-quote-accept  { background: rgba(16,185,129,0.15); color: var(--accent-green); border-color: rgba(16,185,129,0.25); }`
);
css = css.replace(
  /\.status-in-progress   \{ background: rgba\(139,92,246,0\.15\); color: #a78bfa; border-color: rgba\(139,92,246,0\.25\); \}/,
  `.status-in-progress   { background: rgba(139,92,246,0.15); color: var(--accent-purple); border-color: rgba(139,92,246,0.25); }`
);
css = css.replace(
  /\.status-completed     \{ background: rgba\(16,185,129,0\.15\); color: #34d399; border-color: rgba\(16,185,129,0\.25\); \}/,
  `.status-completed     { background: rgba(16,185,129,0.15); color: var(--accent-green); border-color: rgba(16,185,129,0.25); }`
);
css = css.replace(
  /\.status-cancelled     \{ background: rgba\(239,68,68,0\.15\);  color: #f87171; border-color: rgba\(239,68,68,0\.25\); \}/,
  `.status-cancelled     { background: rgba(239,68,68,0.15);  color: var(--accent-red); border-color: rgba(239,68,68,0.25); }`
);

fs.writeFileSync('src/app/globals.css', css);
console.log("Updated globals.css");
