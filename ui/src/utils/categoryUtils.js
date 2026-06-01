// The Category table has duplicate names (e.g. three "Music" rows that live under
// different parent modules). Newsletter targeting/tagging matches subscribers by
// category NAME, so duplicate-name rows are redundant in the picker — keep one
// entry per unique name to avoid showing "Music" several times.
export const dedupeByTitle = (cats = []) => {
  const seen = new Set();
  return cats.filter((c) => {
    const title = (c.title || c.categorytitle || '').trim();
    if (!title || seen.has(title)) return false;
    seen.add(title);
    return true;
  });
};

// Keep ONE category per name — the one with the most linked products (the canonical
// row). The book pickers in AddBook/EditBook use this so a duplicated name (e.g. three
// "Yoga" rows) collapses to the real, most-populated book category. Requires each
// category to carry `productCount` (fetch via /category/fetch?withCounts=true).
export const dedupeByTitleKeepMax = (cats = []) => {
  const best = new Map(); // lowercased title -> chosen category
  for (const c of cats) {
    const title = (c.title || c.categorytitle || '').trim().toLowerCase();
    if (!title) continue;
    const count = Number(c.productCount || 0);
    const cur = best.get(title);
    if (!cur || count > Number(cur.productCount || 0)) best.set(title, c);
  }
  const keptIds = new Set([...best.values()].map((c) => c.id || c._id));
  return cats.filter((c) => keptIds.has(c.id || c._id)); // preserve original (title-asc) order
};
