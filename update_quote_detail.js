const fs = require('fs');

let content = fs.readFileSync('src/components/QuoteDetailModal.tsx', 'utf-8');

// 1. Add import and useLanguage hook
content = content.replace(
  'import { useQuote, Quote } from "../context/QuoteContext";',
  'import { useQuote, Quote } from "../context/QuoteContext";\nimport { useLanguage } from "../context/LanguageContext";'
);

content = content.replace(
  'const { fetchQuoteByJob, quoteLoading, quoteError } = useQuote();',
  'const { fetchQuoteByJob, quoteLoading, quoteError } = useQuote();\n  const { t } = useLanguage();'
);

// 2. Replace Strings
content = content.replace(/> Quote Detail/g, '> </span\n              >{t("Recommendation Detail")}');
content = content.replace(/Quote #\{quote\.id\}/g, 'Recommendation #{quote.id}');
content = content.replace(/Fetching quote\.\.\./g, '{t("Fetching recommendation...")}');
content = content.replace(/The driver accepted this quote\. Proceed with the repair\./g, '{t("The driver accepted this recommendation. Proceed with the repair.")}');
content = content.replace(/>Diagnostic Notes</g, '>{t("Diagnostic Notes")}<');
content = content.replace(/>No items attached\.</g, '>{t("No items attached.")}<');
content = content.replace(/>Total Amount</g, '>{t("Total Amount")}<');
content = content.replace(/>Line Items</g, '>{t("Line Items")}<');
content = content.replace(/>Driver Approved</g, '>{t("Driver Approved")}<');
content = content.replace(/>Driver Rejected</g, '>{t("Driver Rejected")}<');
content = content.replace(/The quote may not have been created yet or there was a network error\./g, '{t("The recommendation may not have been created yet or there was a network error.")}');

fs.writeFileSync('src/components/QuoteDetailModal.tsx', content);
console.log("Updated QuoteDetailModal");
