import { getCompatibleUrl } from "@/utils/url-helpers";

type AccessItem = {
  title: string;
  url: string;
  read?: boolean;
  write?: boolean;
  icon?: any;
  items?: AccessItem[];
};

export const findFirstAvailableUrl = (
  items: AccessItem[] | string | undefined | null
): string | null => {
  if (!items) return null;

  // Normalize items to an array
  const ensureArray = (
    data: AccessItem[] | string | undefined | null
  ): AccessItem[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;

    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const normalizedItems = ensureArray(items);

  // Recursive function to locate the first valid URL
  const findUrl = (menuItems: AccessItem[]): string | null => {
    for (const item of menuItems) {
      if (item.items && item.items.length > 0) {
        // Check nested items first
        const nestedUrl = findUrl(item.items);
        if (nestedUrl) return nestedUrl;
      }
      if (item.url && item.url !== "#") return getCompatibleUrl(item.url); // Avoid returning "#"
    }
    return null;
  };

  return findUrl(normalizedItems);
};
