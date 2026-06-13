import type { LibraryCategory } from "./libraryTypes";

type CategoryRule = {
  category: LibraryCategory;
  patterns: RegExp[];
};

const categoryRules: CategoryRule[] = [
  {
    category: "Metro 2",
    patterns: [
      /\bdc\s*stg\s*004\b/i,
      /\bmetro\s*2\b/i,
      /\bmetro2\b/i,
      /\bcreditor\s*metro/i,
    ],
  },
  {
    category: "Charge-Off",
    patterns: [/\bcharge[\s-]*off\b/i],
  },
  {
    category: "Inquiries",
    patterns: [/\binquir(?:y|ies)\b/i],
  },
  {
    category: "Bankruptcy",
    patterns: [/\bbankruptcy\b/i],
  },
  {
    category: "Payment History",
    patterns: [
      /\blate payment\b/i,
      /\bpayment history\b/i,
      /\bgoodwill\b/i,
      /\bdeferment\b/i,
    ],
  },
  {
    category: "Collections",
    patterns: [
      /\bdc\s*stg\s*012\b/i,
      /\bdc\s*wrk\s*(?:005|010)\b/i,
      /\bcalling collector\b/i,
      /\bdebt validation response tracker\b/i,
      /\bdofd calculation worksheet\b/i,
      /\bcollection(?:s)?\b/i,
      /\bdebt collector\b/i,
      /\bmedical debt\b/i,
      /\brepossession\b/i,
    ],
  },
  {
    category: "Personal Information",
    patterns: [
      /\bdc\s*wrk\s*004\b/i,
      /\bclient intake form\b/i,
      /\bpersonal information\b/i,
      /\bidentity theft\b/i,
    ],
  },
  {
    category: "Credit Building",
    patterns: [
      /\bdc\s*wrk\s*(?:007|009)\b/i,
      /\bcredit score monitoring\b/i,
      /\b30\s*60\s*90 day action plan\b/i,
      /\bcredit building\b/i,
    ],
  },
  {
    category: "Legal Documents",
    patterns: [
      /\bdc\s*lgl\s*doc\b/i,
      /\bdc\s*stg\s*005\b/i,
      /\bdc\s*wrk\s*008\b/i,
      /\bfcra consumer rights\b/i,
      /\bevidence log\b/i,
      /\baffidavit\b/i,
    ],
  },
  {
    category: "Education",
    patterns: [
      /\bdc\s*stg\s*(?:002|003|007|008|009|010|011|013|014)\b/i,
      /\bdc\s*wrk\s*(?:001|002|003|006)\b/i,
      /\bclient onboarding script\b/i,
      /\bcalling furnisher\b/i,
      /\bcalling bureau\b/i,
      /\bbureau tricks\b/i,
      /\bdispute timeline\b/i,
      /\bunderstanding credit score\b/i,
      /\bclient progress update\b/i,
      /\bbureau response guide\b/i,
      /\bviolation detection cheat sheet\b/i,
      /\bviolation scorecard\b/i,
      /\bdispute round tracker\b/i,
      /\bthree bureau comparison\b/i,
      /\bcredit report audit worksheet\b/i,
    ],
  },
];

function normalizeCategoryText(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferLibraryCategory(
  title: string,
  fileName = "",
): LibraryCategory | null {
  const searchableText = normalizeCategoryText(`${title} ${fileName}`);
  for (const rule of categoryRules) {
    if (rule.patterns.some((pattern) => pattern.test(searchableText))) {
      return rule.category;
    }
  }
  return null;
}
