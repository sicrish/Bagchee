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
