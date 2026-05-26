"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Locale = "en" | "am";

export const TRANSLATIONS = {
  en: {
    // General
    "RoadHero": "RoadHero",
    "Technician Portal": "Technician Portal",
    "Loading your portal…": "Loading your portal…",
    "Authenticating your session…": "Authenticating your session…",
    "Profile unavailable": "Profile unavailable",
    "Could not load your profile. Please log in again.": "Could not load your profile. Please log in again.",
    "Go to Login": "Go to Login",
    
    // Nav
    "Jobs": "Jobs",
    "History": "History",
    "Profile": "Profile",

    // Login
    "Welcome back": "Welcome back",
    "Enter your phone number to continue": "Enter your phone number to continue",
    "Please enter your phone number.": "Please enter your phone number.",
    "Invalid PIN or phone number.": "Invalid PIN or phone number.",
    "Continue": "Continue",
    "Enter your PIN": "Enter your PIN",
    "6-digit PIN sent by your provider": "6-digit PIN sent by your provider",
    "Secured by RoadHero · Technician Access Only": "Secured by RoadHero · Technician Access Only",

    // Active Jobs
    "All": "All",
    "Arrived": "Arrived",
    "Diagnosing": "Diagnosing",
    "Awaiting Approval": "Awaiting Approval",
    "Approved": "Approved",
    "In Progress": "In Progress",
    "Accepted": "Accepted",
    "En Route": "En Route",
    "Completed": "Completed",
    "Start Diagnosing": "Start Diagnosing",
    "Start Work": "Start Work",
    "Complete Job": "Complete Job",
    "Waiting for driver to approve your estimate.": "Waiting for driver to approve your estimate.",
    "Create & Send Spare Part Recommendation": "Create & Send Spare Part Recommendation",
    "Active Jobs": "Active Jobs",
    "assigned": "assigned",
    "No active jobs": "No active jobs",
    "No jobs": "No jobs",
    "New jobs will appear here when assigned.": "New jobs will appear here when assigned.",
    "Try a different filter.": "Try a different filter.",
    "Provider": "Provider",
    "Description": "Description",
    "auto-refreshes every 30s": "auto-refreshes every 30s",
    "Waiting for assignment… refreshing every 30s.": "Waiting for assignment… refreshing every 30s.",

    // Status labels
    "Quote Pending": "Estimate Pending",
    "Quote Accepted": "Estimate Accepted",
    "Cancelled": "Cancelled",
    "I'm On My Way": "I'm On My Way",
    "I've Arrived": "I've Arrived",
    "Complete Job ✓": "Complete Job ✓",
    "Navigate & Mark En Route": "Navigate & Mark En Route",
    "Open Navigation": "Open Navigation",
    "Service Request": "Service Request",
    "Scheduled": "Scheduled",
    "Problem Description": "Problem Description",
    "Requested Spare Parts": "Requested Spare Parts",

    // Job card actions
    "Confirm job completion?": "Confirm job completion?",
    "This will notify the driver and cannot be undone.": "This will notify the driver and cannot be undone.",
    "Cancel": "Cancel",
    "Yes, Complete": "Yes, Complete",
    "View Sent Recommendation": "View Sent Recommendation",
    "No location provided for this job.": "No location provided for this job.",

    // Spare Part Recommendation Modal (was Quote Modal)
    "New Spare Part Recommendation": "New Spare Part Recommendation",
    "Create Estimate": "Create Estimate",
    "Add Line Items": "Add Line Items",
    "Estimate Sent!": "Estimate Sent!",
    "Recommendation Sent!": "Recommendation Sent!",
    "Diagnostic Notes (optional)": "Diagnostic Notes (optional)",
    "e.g. Engine oil depleted. Full replacement needed.": "e.g. Engine oil depleted. Full replacement needed.",
    "Total Amount": "Total Amount",
    "Items": "Items",
    "Add Item": "Add Item",
    "PART": "PART",
    "LABOR": "LABOR",
    "Description *": "Description *",
    "Qty": "Qty",
    "Unit price (ETB) *": "Unit price (ETB) *",
    "Send Recommendation to Driver": "Send Recommendation to Driver",
    "Add diagnostic notes, then build your itemised recommendation with parts & labour. The driver will receive a push notification to approve.": "Add diagnostic notes, then build your itemised recommendation with parts & labour. The driver will receive a push notification to approve.",
    "Create Recommendation": "Create Recommendation",
    "Line Items": "Line Items",
    "Spare Part — links to inventory": "Spare Part — links to inventory",
    "Loading parts…": "Loading parts…",
    "Could not load — enter manually": "Could not load — enter manually",
    "No parts in inventory": "No parts in inventory",
    "Select spare part (optional)": "Select spare part (optional)",
    "No part selected (manual entry)": "No part selected (manual entry)",
    "Out of stock": "Out of stock",
    "left": "left",
    "selected": "selected",
    "Auto-deducted on driver approval": "Auto-deducted on driver approval",
    "in stock": "in stock",
    "parts in warehouse": "parts in warehouse",
    "out of stock": "out of stock",
    "Linked part will be auto-deducted from inventory when driver approves.": "Linked part will be auto-deducted from inventory when driver approves.",
    "Live Stock": "Live Stock",
    "units available": "units available",
    "Low Stock!": "Low Stock!",
    "Out of Stock!": "Out of Stock!",
    "Description is required.": "Description is required.",
    "Enter a valid price greater than 0.": "Enter a valid price greater than 0.",
    "Item added successfully.": "Item added successfully.",
    "Failed to add item.": "Failed to add item.",
    "Failed to remove item.": "Failed to remove item.",
    "Add at least one item before submitting.": "Add at least one item before submitting.",
    "Failed to submit recommendation.": "Failed to submit recommendation.",
    "Add at least one item before sending the recommendation.": "Add at least one item before sending the recommendation.",
    "The driver has been notified and is reviewing your recommendation.": "The driver has been notified and is reviewing your recommendation.",
    "Recommendation Summary": "Recommendation Summary",
    "Total": "Total",
    "Recommendation": "Recommendation",
    "Status": "Status",
    "Failed to create recommendation.": "Failed to create recommendation.",
    "Network error. Please try again.": "Network error. Please try again.",

    // Spare Part Recommendation Detail Modal (was Quote Detail Modal)
    "Recommendation Detail": "Recommendation Detail",
    "Driver Approved": "Driver Approved",
    "The driver accepted this recommendation. Proceed with the repair.": "The driver accepted this recommendation. Proceed with the repair.",
    "Driver Rejected": "Driver Rejected",
    "Fetching recommendation...": "Fetching recommendation...",
    "The recommendation may not have been created yet or there was a network error.": "The recommendation may not have been created yet or there was a network error.",
    "Diagnostic Notes": "Diagnostic Notes",
    "No items attached.": "No items attached.",

    // Profile
    "Active": "Active",
    "Inactive": "Inactive",
    "Specialties": "Specialties",
    "No specialties listed.": "No specialties listed.",
    "Rating": "Rating",
    "Sign Out": "Sign Out",
    "Technician": "Technician",

    // History
    "Job History": "Job History",
    "total jobs": "total jobs",
    "Past completed & cancelled jobs": "Past completed & cancelled jobs",
    "Try Again": "Try Again",
    "No history yet": "No history yet",
    "Completed jobs will appear here.": "Completed jobs will appear here.",
    "Load more": "Load more",
    "— End of history —": "— End of history —",
    "Job Detail": "Job Detail",
    "Final Price": "Final Price",
    "No charge": "No charge",
    "Total Earned": "Total Earned",
    "Load More": "Load More",
    "completed": "completed",
  },
  am: {
    // General
    "RoadHero": "RoadHero",
    "Technician Portal": "የቴክኒሻን ፖርታል",
    "Loading your portal…": "ፖርታልዎን በመጫን ላይ...",
    "Authenticating your session…": "ክፍለ-ጊዜዎን በማረጋገጥ ላይ...",
    "Profile unavailable": "መገለጫ አይገኝም",
    "Could not load your profile. Please log in again.": "መገለጫዎን መጫን አልተቻለም። እባክዎ እንደገና ይግቡ።",
    "Go to Login": "ወደ መግቢያ ይሂዱ",
    
    // Nav
    "Jobs": "ስራዎች",
    "History": "ታሪክ",
    "Profile": "መገለጫ",

    // Login
    "Welcome back": "እንኳን በደህና መጡ",
    "Enter your phone number to continue": "ለመቀጠል ስልክ ቁጥርዎን ያስገቡ",
    "Please enter your phone number.": "እባክዎ ስልክ ቁጥርዎን ያስገቡ።",
    "Invalid PIN or phone number.": "የተሳሳተ ፒን ወይም ስልክ ቁጥር።",
    "Continue": "ቀጥል",
    "Enter your PIN": "ፒንዎን ያስገቡ",
    "6-digit PIN sent by your provider": "በአቅራቢዎ የተላከ ባለ 6 አሃዝ ፒን",
    "Secured by RoadHero · Technician Access Only": "በ RoadHero የተጠበቀ · የቴክኒሻን መዳረሻ ብቻ",

    // Active Jobs
    "All": "ሁሉም",
    "Arrived": "ደርሷል",
    "Diagnosing": "በመመርመር ላይ",
    "Awaiting Approval": "ማረጋገጫ በመጠባበቅ ላይ",
    "Approved": "ጸድቋል",
    "In Progress": "በሂደት ላይ",
    "Accepted": "ተቀባይነት አግኝቷል",
    "En Route": "በመንገድ ላይ",
    "Completed": "ተጠናቋል",
    "Start Diagnosing": "ምርመራ ጀምር",
    "Start Work": "ስራ ጀምር",
    "Complete Job": "ስራ ጨርስ",
    "Waiting for driver to approve your estimate.": "አሽከርካሪው ግምቱን እስኪያጸድቅ በመጠባበቅ ላይ።",
    "Create & Send Spare Part Recommendation": "የመለዋወጫ ክፍሎች ምክረ ሃሳብ ይፍጠሩ እና ይላኩ",
    "Active Jobs": "ንቁ ስራዎች",
    "assigned": "ተመድቧል",
    "No active jobs": "ምንም ንቁ ስራዎች የሉም",
    "No jobs": "ምንም ስራዎች የሉም",
    "New jobs will appear here when assigned.": "አዳዲስ ስራዎች ሲመደቡ እዚህ ይታያሉ።",
    "Try a different filter.": "ሌላ ማጣሪያ ይሞክሩ።",
    "Provider": "አቅራቢ",
    "Description": "መግለጫ",
    "auto-refreshes every 30s": "በ30 ሰከንድ ይታደሳል",
    "Waiting for assignment… refreshing every 30s.": "ምደባ በመጠበቅ ላይ… በ30 ሰከንድ ይታደሳል።",

    // Status labels
    "Quote Pending": "ግምት በመጠባበቅ ላይ",
    "Quote Accepted": "ግምት ተቀባይነት አግኝቷል",
    "Cancelled": "ተሰርዟል",
    "I'm On My Way": "በመንገድ ላይ ነኝ",
    "I've Arrived": "ደርሻለሁ",
    "Complete Job ✓": "ስራ ጨርስ ✓",
    "Navigate & Mark En Route": "ዳስስ እና በመንገድ ላይ ምልክት ይደርጉ",
    "Open Navigation": "ዳሰሳ ክፈት",
    "Service Request": "የአገልግሎት ጥያቄ",
    "Scheduled": "የታቀደ",
    "Problem Description": "የችግር መግለጫ",
    "Requested Spare Parts": "የተጠየቁ መለዋወጫዎች",

    // Job card actions
    "Confirm job completion?": "የስራ ማጠናቀቅ ያረጋግጡ?",
    "This will notify the driver and cannot be undone.": "ይህ አሽከርካሪውን ያሳውቃል እና ሊቀለበስ አይችልም።",
    "Cancel": "ሰርዝ",
    "Yes, Complete": "አዎ፣ ጨርስ",
    "View Sent Recommendation": "የተላከ ምክረ ሃሳብ ይመልከቱ",
    "No location provided for this job.": "ለዚህ ስራ ቦታ አልተሰጠም።",

    // Spare Part Recommendation Modal (was Quote Modal)
    "New Spare Part Recommendation": "አዲስ የመለዋወጫ ክፍሎች ምክረ ሃሳብ",
    "Create Estimate": "ግምት ይፍጠሩ",
    "Add Line Items": "እቃዎች ያክሉ",
    "Estimate Sent!": "ግምቱ ተልኳል!",
    "Recommendation Sent!": "ምክረ ሃሳቡ ተልኳል!",
    "Diagnostic Notes (optional)": "የምርመራ ማስታወሻዎች (አማራጭ)",
    "e.g. Engine oil depleted. Full replacement needed.": "ለምሳሌ፦ የሞተር ዘይት አልቋል። ሙሉ በሙሉ መቀየር ያስፈልጋል።",
    "Total Amount": "አጠቃላይ ድምር",
    "Items": "እቃዎች",
    "Add Item": "እቃ አክል",
    "PART": "መለዋወጫ",
    "LABOR": "የጉልበት ስራ",
    "Description *": "መግለጫ *",
    "Qty": "ብዛት",
    "Unit price (ETB) *": "የአንዱ ዋጋ (ብር) *",
    "Send Recommendation to Driver": "ምክረ ሃሳቡን ለአሽከርካሪ ይላኩ",
    "Add diagnostic notes, then build your itemised recommendation with parts & labour. The driver will receive a push notification to approve.": "የምርመራ ማስታወሻዎችን ያክሉ፣ ከዚያ ከመለዋወጫ ክፍሎች እና ከጉልበት ስራ ጋር ዝርዝር ምክረ ሃሳብዎን ይገንቡ። አሽከርካሪው ለማጽደቅ ማሳወቂያ ያገኛል።",
    "Create Recommendation": "ምክረ ሃሳብ ይፍጠሩ",
    "Line Items": "ዝርዝር እቃዎች",
    "Spare Part — links to inventory": "መለዋወጫ — ከመጋዘን ጋር ተያይዟል",
    "Loading parts…": "መለዋወጫዎችን በመጫን ላይ…",
    "Could not load — enter manually": "መጫን አልተቻለም — በእጅ ያስገቡ",
    "No parts in inventory": "በመጋዘን ውስጥ መለዋወጫ የለም",
    "Select spare part (optional)": "መለዋወጫ ይምረጡ (አማራጭ)",
    "No part selected (manual entry)": "ምንም መለዋወጫ አልተመረጠም (የእጅ ግቤት)",
    "Out of stock": "ሸቀጥ የለም",
    "left": "ቀሪ",
    "selected": "ተመርጧል",
    "Auto-deducted on driver approval": "በአሽከርካሪ ማጽደቂያ በራስ-ሰር ይቀነሳል",
    "in stock": "በመጋዘን ውስጥ",
    "parts in warehouse": "በመጋዘን ውስጥ ያሉ ክፍሎች",
    "out of stock": "ሸቀጥ የለም",
    "Linked part will be auto-deducted from inventory when driver approves.": "የተያያዘ ክፍል በአሽከርካሪ ማጽደቂያ ጊዜ ከመጋዘን በራስ-ሰር ይቀነሳል።",
    "Live Stock": "የቅጽበት ክምችት",
    "units available": "ክፍሎች ይገኛሉ",
    "Low Stock!": "ዝቅተኛ ክምችት!",
    "Out of Stock!": "ክምችት አልቋል!",
    "Description is required.": "መግለጫ ያስፈልጋል።",
    "Enter a valid price greater than 0.": "ከ0 በላይ ትክክለኛ ዋጋ ያስገቡ።",
    "Item added successfully.": "እቃው በተሳካ ሁኔታ ታክሏል።",
    "Failed to add item.": "እቃ ማከል አልተቻለም።",
    "Failed to remove item.": "እቃ ማስወገድ አልተቻለም።",
    "Add at least one item before submitting.": "ከማስገባትዎ በፊት ቢያንስ አንድ እቃ ያክሉ።",
    "Failed to submit recommendation.": "ምክረ ሃሳቡን ማስገባት አልተቻለም።",
    "Add at least one item before sending the recommendation.": "ምክረ ሃሳቡን ከመላክዎ በፊት ቢያንስ አንድ እቃ ያክሉ።",
    "The driver has been notified and is reviewing your recommendation.": "አሽከርካሪው ታውቆ ምክረ ሃሳብዎን እየገመገመ ነው።",
    "Recommendation Summary": "የምክረ ሃሳብ ማጠቃለያ",
    "Total": "ጠቅላላ",
    "Recommendation": "ምክረ ሃሳብ",
    "Status": "ሁኔታ",
    "Failed to create recommendation.": "ምክረ ሃሳብ መፍጠር አልተቻለም።",
    "Network error. Please try again.": "የአውታረ መረብ ስህተት። እባክዎ እንደገና ይሞክሩ።",

    // Spare Part Recommendation Detail Modal (was Quote Detail Modal)
    "Recommendation Detail": "የምክረ ሃሳብ ዝርዝር",
    "Driver Approved": "አሽከርካሪው ፈቅዷል",
    "The driver accepted this recommendation. Proceed with the repair.": "አሽከርካሪው ይህን ምክረ ሃሳብ ተቀብሏል። ከጥገና ጋር ይቀጥሉ።",
    "Driver Rejected": "አሽከርካሪው ውድቅ አድርጓል",
    "Fetching recommendation...": "ምክረ ሃሳብ በማምጣት ላይ...",
    "The recommendation may not have been created yet or there was a network error.": "ምክረ ሃሳቡ ገና ላይፈጠር ይችላል ወይም የአውታረ መረብ ስህተት ነበር።",
    "Diagnostic Notes": "የምርመራ ማስታወሻዎች",
    "No items attached.": "ምንም እቃዎች አልተያያዙም።",

    // Profile
    "Active": "ንቁ",
    "Inactive": "እንቅስቃሴ-አልባ",
    "Specialties": "ልዩ ሙያዎች",
    "No specialties listed.": "ምንም ልዩ ሙያዎች አልተዘረዘሩም።",
    "Rating": "ደረጃ",
    "Sign Out": "ውጣ",
    "Technician": "ቴክኒሻን",

    // History
    "Job History": "የስራ ታሪክ",
    "total jobs": "ጠቅላላ ስራዎች",
    "Past completed & cancelled jobs": "ያለፉ የተጠናቀቁ እና የተሰረዙ ስራዎች",
    "Try Again": "እንደገና ይሞክሩ",
    "No history yet": "እስካሁን ታሪክ የለም",
    "Completed jobs will appear here.": "የተጠናቀቁ ስራዎች እዚህ ይታያሉ።",
    "Load more": "ተጨማሪ ጫን",
    "— End of history —": "— የታሪክ መጨረሻ —",
    "Job Detail": "የስራ ዝርዝር",
    "Final Price": "የመጨረሻ ዋጋ",
    "No charge": "ክፍያ የለም",
    "Total Earned": "ጠቅላላ ገቢ",
    "Load More": "ተጨማሪ ጫን",
    "completed": "ተጠናቅቋል",
  }
};

type TranslationKey = keyof typeof TRANSLATIONS.en;

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("rh_lang") as Locale;
    if (stored === "en" || stored === "am") {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    localStorage.setItem("rh_lang", lang);
  };

  const t = (key: TranslationKey): string => {
    if (!mounted) return TRANSLATIONS.en[key] || key; // Default to English during SSR
    return TRANSLATIONS[language][key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
