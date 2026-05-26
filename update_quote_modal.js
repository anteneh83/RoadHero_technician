const fs = require('fs');

let content = fs.readFileSync('src/components/QuoteModal.tsx', 'utf-8');

// 1. Add import and useLanguage hook
content = content.replace(
  'import { useAuth, API_BASE_URL } from "../context/AuthContext";',
  'import { useAuth, API_BASE_URL } from "../context/AuthContext";\nimport { useLanguage } from "../context/LanguageContext";'
);

content = content.replace(
  'const { accessToken, profile } = useAuth();',
  'const { accessToken, profile } = useAuth();\n  const { t } = useLanguage();'
);

// 2. Replace Strings with t()
content = content.replace(/\{step === "notes" && "New Quote"\}/, '{step === "notes" && t("New Spare Part Recommendation")}');
content = content.replace(/\{step === "items" && "Add Line Items"\}/, '{step === "items" && t("Add Line Items")}');
content = content.replace(/\{step === "submitted" && "Quote Sent! 🎉"\}/, '{step === "submitted" && (t("Recommendation Sent!") + " 🎉")}');

content = content.replace(/"Quote #"/g, 't("Recommendation") + " #"'); // Not exact but ok, wait, I'll manually replace
content = content.replace(/Quote #\{quote\.id\}/g, 'Recommendation #{quote.id}');
content = content.replace(/<p className="text-xs mt-0\.5 font-mono" style=\{\{ color: "#475569" \}\}>\s*Quote #\{quote\.id\}/, '<p className="text-xs mt-0.5 font-mono" style={{ color: "#475569" }}>\n                Recommendation #{quote.id}');

content = content.replace(/Add diagnostic notes, then build your itemised quote with parts & labour\. The driver will receive a push notification to approve\./g, 
  '{t("Add diagnostic notes, then build your itemised recommendation with parts & labour. The driver will receive a push notification to approve.")}');

content = content.replace(/>Create Quote<\//g, '>{t("Create Estimate")}</');
content = content.replace(/>Total Amount<\//g, '>{t("Total Amount")}</');
content = content.replace(/Line Items \(\{quote.items.length\}\)/g, '{t("Line Items")} ({quote.items.length})');

content = content.replace(/>Add Item<\//g, '>{t("Add Item")}</');
content = content.replace(/placeholder="Description \*"/g, 'placeholder={t("Description *")}');
content = content.replace(/placeholder="Qty"/g, 'placeholder={t("Qty")}');
content = content.replace(/placeholder="Unit price \(ETB\) \*"/g, 'placeholder={t("Unit price (ETB) *")}');

content = content.replace(/<h3 className="text-2xl font-black mb-2" style=\{\{ color: "#f1f5f9" \}\}>Quote Sent!<\/h3>/g,
  '<h3 className="text-2xl font-black mb-2" style={{ color: "#f1f5f9" }}>{t("Recommendation Sent!")}</h3>');
  
content = content.replace(/The driver has been notified and is reviewing your quote\./g,
  '{t("The driver has been notified and is reviewing your recommendation.")}');
  
content = content.replace(/Quote #\{quote\?\.id\} · Status: SENT/g,
  'Recommendation #{quote?.id} · Status: SENT');

content = content.replace(/Quote Summary/g, '{t("Recommendation Summary")}');
content = content.replace(/>Total<\//g, '>{t("Total")}</');

content = content.replace(/Add at least one item before sending the quote\./g,
  '{t("Add at least one item before sending the recommendation.")}');

content = content.replace(/Send Quote to Driver/g, '{t("Send Recommendation to Driver")}');

// 3. Labor Logic
const oldLaborLogic = `onChange={e => setNewItem(p => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}`;
const newLaborLogic = `onChange={e => setNewItem(p => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}\n                    disabled={newItem.item_type === "LABOR"}`;
content = content.replace(oldLaborLogic, newLaborLogic);

const oldItemTypeClick = `onClick={() => setNewItem(p => ({ ...p, item_type: t }))}`;
const newItemTypeClick = `onClick={() => setNewItem(p => ({ ...p, item_type: t, quantity: t === "LABOR" ? 1 : p.quantity }))}`;
content = content.replace(oldItemTypeClick, newItemTypeClick);

fs.writeFileSync('src/components/QuoteModal.tsx', content);
console.log("Updated QuoteModal");
