/**
 * Returns an SVG icon based on the content type
 */
export function getTypeIcon(type: string): string {
  switch(type) {
    case 'theme':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>`;
    case 'widget':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#388e3c" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              </svg>`;
    case 'workflow':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f57c00" stroke-width="2">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
              </svg>`;
    default:
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"></path>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"></path>
              </svg>`;
  }
}

/**
 * Helper to determine current page from URL
 * This is a temporary solution until we implement a proper routing service
 * that can track the current page during client-side navigation
 */
export function getCurrentPage(): string {
  // Extract the page name from the URL path
  // Check if the URL contains a hash for client-side routing
  const path = window.location.hash ? window.location.hash.substring(1) : window.location.pathname;
  
  // Remove leading slash and trailing slash if present
  const normalizedPath = path.replace(/^\/|\/$/g, '');
  
  // If empty path, we're on the root/dashboard
  if (!normalizedPath) {
    return 'dashboard';
  }
  
  // Get the first segment of the path
  const pathSegments = normalizedPath.split('/');
  const firstSegment = pathSegments[0].toLowerCase();

  // Map common page paths to page types
  const pageMap: Record<string, string> = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'savings': 'savings',
    'investments': 'investments',
    'settings': 'settings',
    'accounts': 'accounts',
    'transactions': 'transactions'
  };

  return pageMap[firstSegment] || 'dashboard';
}
