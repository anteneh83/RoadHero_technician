const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Import ThemeContext and icons
content = content.replace(
  'import { useLanguage } from "../context/LanguageContext";',
  'import { useLanguage } from "../context/LanguageContext";\nimport { useTheme } from "../context/ThemeContext";'
);
content = content.replace(
  'import { Briefcase, History, User, Wrench } from "lucide-react";',
  'import { Briefcase, History, User, Wrench, Moon, Sun } from "lucide-react";'
);

content = content.replace(
  'const { t, language, setLanguage } = useLanguage();',
  'const { t, language, setLanguage } = useLanguage();\n  const { theme, toggleTheme } = useTheme();'
);

// Add ThemeToggle button next to LanguageSwitcher
content = content.replace(
  '{/* Language Toggle */}\n            <LanguageSwitcher />',
  `{/* Theme Toggle */}\n            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}>\n              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}\n            </button>\n            {/* Language Toggle */}\n            <LanguageSwitcher />`
);

// Replace hardcoded styles with CSS variables
content = content.replace(/#0a0f1e/g, 'var(--bg-primary)');
content = content.replace(/#050a14/g, 'var(--bg-secondary)');
content = content.replace(/rgba\(10,15,30,0\.98\)/g, 'var(--bg-primary)');
content = content.replace(/rgba\(10,15,30,0\.97\)/g, 'var(--bg-glass)');

content = content.replace(/#f1f5f9/g, 'var(--text-primary)');
content = content.replace(/#94a3b8/g, 'var(--text-secondary)');
content = content.replace(/#475569/g, 'var(--text-muted)');
content = content.replace(/#64748b/g, 'var(--text-muted)');
content = content.replace(/#334155/g, 'var(--text-muted)');

content = content.replace(/rgba\(148,163,184,0\.06\)/g, 'var(--border-subtle)');
content = content.replace(/rgba\(148,163,184,0\.08\)/g, 'var(--border-subtle)');
content = content.replace(/rgba\(255,255,255,0\.05\)/g, 'var(--bg-card-hover)');
content = content.replace(/rgba\(255,255,255,0\.1\)/g, 'var(--border-card)');

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Updated Dashboard");
