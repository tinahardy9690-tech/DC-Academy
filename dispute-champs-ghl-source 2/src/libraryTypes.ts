export const libraryCategories = [
  "Legal Documents",
  "Collections",
  "Charge-Off",
  "Inquiries",
  "Personal Information",
  "Education",
  "Credit Building",
  "Bankruptcy",
  "Payment History",
  "Metro 2",
  "Miscellaneous",
] as const;

export const libraryResourceTypes = [
  "E-book",
  "Template",
  "Guide",
  "Checklist",
  "Worksheet",
  "Reference",
  "Form",
  "Video",
] as const;

export type LibraryCategory = (typeof libraryCategories)[number];
export type LibraryResourceType = (typeof libraryResourceTypes)[number];

export interface LibraryResource {
  id: string;
  title: string;
  description: string;
  category: LibraryCategory;
  resourceType: LibraryResourceType;
  tags: string[];
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey?: string;
  externalUrl?: string;
  coverImageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryResourceInput {
  id?: string;
  title: string;
  description: string;
  category: LibraryCategory;
  resourceType: LibraryResourceType;
  tags: string[];
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey?: string;
  externalUrl?: string;
  coverImageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
}

export interface LibraryUploadResult {
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}
