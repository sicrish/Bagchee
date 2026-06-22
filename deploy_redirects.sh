#!/bin/bash
# Deploy URL redirect rules to old site .htaccess
# Run on VPS: bash /tmp/deploy_redirects.sh

HTACCESS="/var/www/html/bagchee/.htaccess"
BACKUP="${HTACCESS}.bak.$(date +%Y%m%d_%H%M%S)"

echo "Backing up $HTACCESS → $BACKUP"
cp "$HTACCESS" "$BACKUP"

# Write the redirect block
cat > /tmp/bagchee_redirects.txt << 'REDIRECTBLOCK'
    # =====================================================
    # BAGCHEE MIGRATION: www.bagchee.com → www.bagchee.com
    # Added 2026-05-22
    # =====================================================

    # 1. Book detail pages
    # Old: /books-detail/BB123-the-book-title  →  New: /books/BB123/the-book-title
    RewriteRule ^books-detail/([^-]+)-(.+)$ https://www.bagchee.com/books/$1/$2 [R=301,L]

    # 2. Author detail pages (plural → singular)
    # Old: /authors/ruskin-bond  →  New: /author/ruskin-bond
    RewriteRule ^authors/(.+)$ https://www.bagchee.com/author/$1 [R=301,L]

    # 3. Authors & Publishers page
    RewriteRule ^authors_and_publishers/?$ https://www.bagchee.com/publishers-authors [R=301,L]

    # 4. Static pages with changed URLs
    RewriteRule ^categories/?$ https://www.bagchee.com/allcategories [R=301,L]
    RewriteRule ^contact/?$ https://www.bagchee.com/contact-us [R=301,L]
    RewriteRule ^privacy/?$ https://www.bagchee.com/privacy-policy [R=301,L]
    RewriteRule ^term_of_use/?$ https://www.bagchee.com/terms-conditions [R=301,L]
    RewriteRule ^new_arrival/?$ https://www.bagchee.com/new-arrivals [R=301,L]
    RewriteRule ^new_arrivals/?$ https://www.bagchee.com/new-arrivals [R=301,L]
    RewriteRule ^about_us/?$ https://www.bagchee.com/about-us [R=301,L]

    # 5. Auth pages
    RewriteRule ^auth/login/?$ https://www.bagchee.com/login [R=301,L]
    RewriteRule ^auth/register/?$ https://www.bagchee.com/register [R=301,L]

    # 6. Order tracking
    RewriteRule ^order/status_check/?$ https://www.bagchee.com/trace-order [R=301,L]

    # 7. Help pages
    RewriteRule ^help_page/(.+)$ https://www.bagchee.com/help/$1 [R=301,L]

    # 8. Catch-all: same-path URLs (categories, bestsellers, sale, search, etc.)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ https://www.bagchee.com/$1 [R=301,L]

    # ===================================================
REDIRECTBLOCK

# Use Python to insert the block BEFORE the CodeIgniter fallback line
python3 - "$HTACCESS" << 'PYEOF'
import sys

path = sys.argv[1]
with open(path, 'r') as f:
    content = f.read()

with open('/tmp/bagchee_redirects.txt', 'r') as f:
    block = f.read()

# Find the CodeIgniter fallback — matches "RewriteRule . /index.php [L]"
marker = 'RewriteRule . /index.php [L]'

if marker not in content:
    print("ERROR: Could not find CodeIgniter fallback line in .htaccess")
    print("Current .htaccess content:")
    print(content)
    print()
    print("Redirect block (insert manually before the fallback):")
    print(block)
    sys.exit(1)

# Check if already applied
if 'www.bagchee.com' in content:
    print("WARNING: Redirect rules already appear to be present. Skipping to avoid duplicates.")
    sys.exit(0)

new_content = content.replace(marker, block + '\n    ' + marker)
with open(path, 'w') as f:
    f.write(new_content)

print("✓ Redirect rules inserted successfully")
PYEOF

if [ $? -ne 0 ]; then
    echo ""
    echo "Script failed. Backup is at: $BACKUP"
    echo "To restore: cp '$BACKUP' '$HTACCESS'"
    exit 1
fi

echo ""
echo "=== Updated .htaccess (first 90 lines) ==="
head -90 "$HTACCESS"

echo ""
echo "=== Testing redirects (give Apache 2s to reload) ==="
sleep 2
curl -s -o /dev/null -w "book-detail:    %{http_code}  →  %{redirect_url}\n" \
    "http://www.bagchee.com/books-detail/BB1-test-book"
curl -s -o /dev/null -w "author:         %{http_code}  →  %{redirect_url}\n" \
    "http://www.bagchee.com/authors/ruskin-bond"
curl -s -o /dev/null -w "contact:        %{http_code}  →  %{redirect_url}\n" \
    "http://www.bagchee.com/contact"
curl -s -o /dev/null -w "categories:     %{http_code}  →  %{redirect_url}\n" \
    "http://www.bagchee.com/categories"
curl -s -o /dev/null -w "history cat:    %{http_code}  →  %{redirect_url}\n" \
    "http://www.bagchee.com/books/history"
curl -s -o /dev/null -w "bestsellers:    %{http_code}  →  %{redirect_url}\n" \
    "http://www.bagchee.com/bestsellers"
