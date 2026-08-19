/**
 * Parse a repeatable list query parameter (?k=a&k=b) into an exact array.
 *
 * ⚠️ Never split a list parameter on a delimiter that can occur in the data.
 * Newsletter categories are stored as their TITLES ("Cooking, Food & Wine",
 * "Health, Mind & Body", "Electrical,  Electronics and Telecommunications
 * Engineering") — three real category names contain commas, so the old
 * `categories.split(',')` shredded them into tokens that match nothing and the
 * filter silently returned zero subscribers for ~4,000 people.
 *
 * Callers should send each value as its own occurrence of the parameter, which
 * Express hands us as an array — no delimiter, nothing to escape.
 */
export const parseListParam = (value) => {
    if (value === undefined || value === null) return [];

    // Preferred form: repeated params arrive as an array and are already exact.
    // Values are preserved byte-for-byte (a title may legitimately carry inner
    // or trailing whitespace); only blank entries are dropped.
    if (Array.isArray(value)) {
        return [...new Set(value.map(v => String(v)).filter(v => v.trim() !== ''))];
    }

    const raw = String(value);
    if (raw.trim() === '') return [];

    // Legacy form: one comma-joined string, still sent by cached older bundles.
    // The whole string may itself be a single name containing commas, so offer
    // BOTH it and the split tokens as candidates — `hasSome` then matches
    // whichever actually exists. Tokens that match no stored value are inert,
    // so this can only recover matches, never invent them.
    const tokens = raw.split(',').map(t => t.trim()).filter(Boolean);
    return [...new Set([raw, ...tokens].filter(v => v.trim() !== ''))];
};

export default parseListParam;
