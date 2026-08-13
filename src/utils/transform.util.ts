export const trim = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const trimLower = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export const trimStripHtml = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().replace(/<[^>]*>/g, '') : value;
