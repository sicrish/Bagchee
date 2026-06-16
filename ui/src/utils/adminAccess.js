// Single source of truth for what a restricted 'staff' admin login may see/reach.
//
// Staff exist for catalog data entry only. The backend is the real security boundary
// (adminAuth -> 403 on every non-data-entry route; adminOrStaff opens the catalog
// write routes). These lists drive the UI: which sidebar menus show, and which
// /admin paths a staff login is allowed to open (others redirect to /admin/products).

export const getAdminRole = () => {
  try { return JSON.parse(localStorage.getItem('auth'))?.userDetails?.role || null; }
  catch { return null; }
};

// Top-level sidebar items a staff login sees (must match paths in AdminSidebar.jsx).
export const STAFF_MENU_PATHS = [
  '/admin/products',
  '/admin/authors',
  '/admin/languages',
  '/admin/publishers',
  '/admin/series',
];

// Every /admin path PREFIX a staff login may visit — the menu items above plus their
// add/edit screens and the related catalog entities reachable from data entry
// (books list, actors, artists, labels). Anything not matching here is admin-only.
export const STAFF_ALLOWED_PREFIXES = [
  '/admin/products', '/admin/books',
  '/admin/add-book', '/admin/edit-book',
  '/admin/authors', '/admin/add-authors', '/admin/edit-author',
  '/admin/actors', '/admin/add-actor', '/admin/edit-actor',
  '/admin/artists', '/admin/add-artist', '/admin/edit-artist',
  '/admin/languages', '/admin/add-languages', '/admin/edit-languages',
  '/admin/publishers', '/admin/add-publishers', '/admin/edit-publishers',
  '/admin/series', '/admin/add-series', '/admin/edit-series',
  '/admin/labels', '/admin/add-labels', '/admin/edit-labels',
];

// True if `pathname` is within a staff-allowed area (exact match or a sub-path).
export const isStaffAllowedPath = (pathname) =>
  STAFF_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
