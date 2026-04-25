import DOMPurify from 'dompurify';

// Sanitize HTML content before rendering with dangerouslySetInnerHTML
// Allows safe HTML tags (formatting) but strips scripts, event handlers, etc.
export const sanitizeHtml = (dirty) => {
    if (!dirty) return '';
    const sanitized = DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'table', 'thead',
            'tbody', 'tr', 'th', 'td', 'blockquote', 'span', 'div', 'hr', 'sub', 'sup',
            'svg', 'path', 'rect', 'circle', 'g', 'line', 'polyline', 'polygon'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
            'width', 'height', 'colspan', 'rowspan', 'viewBox', 'fill', 'stroke', 
            'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'xmlns', 'd', 'x', 'y', 'rx'],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
    // Force all links to open safely
    return sanitized.replace(/<a /g, '<a rel="noopener noreferrer" ');
};

// Create a safe object for dangerouslySetInnerHTML
export const createSafeHtml = (dirty) => ({
    __html: sanitizeHtml(dirty)
});
