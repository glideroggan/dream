/**
 * Generate a unique ID with an optional prefix
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${randomPart}`;
}

/**
 * Generate a shortened unique ID (for situations where space is a concern)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generate a UUID v4 (standard format)
 */
export function generateUUID(): string {
  // Implementation based on RFC4122 version 4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}