# Bagchee — Developer Setup

## Prerequisites
- Node.js v18+
- npm v9+
- Git

---

## 1. Clone the repo

```bash
git clone https://github.com/sicrish/Bagchee.git
cd Bagchee
```

---

## 2. Set up the API (Backend)

```bash
cd api
npm install
```

Create a file called `.env` inside the `api/` folder:

```env
NODE_ENV=development
PORT=3001

DATABASE_URL=postgresql://neondb_owner:npg_jlP93fWZIORe@ep-still-glitter-ai5lkca1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30
DIRECT_URL=postgresql://neondb_owner:npg_jlP93fWZIORe@ep-still-glitter-ai5lkca1.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET_KEY=IkqwfPnbtuD5KWpWA0G0CxByef5HMv4Oed/ZAtfQh9MMZpAE4P1n0FT2kwRqJU2C
ENCRYPTION_SECRET=metXFqhCDc39LVSNnwthDmdYQLGZZVx10rR8Qzybw7Au3C2lW/JqdunzKD9ieoQ+

CLOUD_NAME=dgmkcyrl7
CLOUD_API_KEY=565771915474825
CLOUD_API_SECRET=2HW6py7gRaCEyk4ggd1JxNyn79Q

RAZORPAY_KEY_ID=rzp_test_SLp1axPzfknnrQ
RAZORPAY_KEY_SECRET=MdWCjCDOUj5ghVKovTEBrvxy

EMAIL_USER=anshuljaiswal568@gmail.com
EMAIL_PASS=evoh ljkc gmkx mhtr

FRONTEND_URL=http://localhost:3000
```

Generate the Prisma client then start the API:

```bash
npx prisma generate
npm run dev
```

API runs at `http://localhost:3001`

---

## 3. Set up the UI (Frontend)

Open a new terminal:

```bash
cd ui
npm install
```

Create a file called `.env` inside the `ui/` folder:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENCRYPTION_SECRET=metXFqhCDc39LVSNnwthDmdYQLGZZVx10rR8Qzybw7Au3C2lW/JqdunzKD9ieoQ+
REACT_APP_EXCHANGE_RATE_API_KEY=01b425d377751fbbed67dcdc
REACT_APP_RAZORPAY_KEY_ID=rzp_test_SLp1axPzfknnrQ
```

Start the frontend:

```bash
npm start
```

Frontend runs at `http://localhost:3000`

---

## 4. Admin panel

- URL: `http://localhost:3000/admin`
- Email: `admin@bagchee.com`
- Password: `Admin@123`

---

## 5. Deploy changes

Push to GitHub — Railway auto-deploys on every push to `main`:

```bash
git add .
git commit -m "your message"
git push origin main
```

---

## Live URLs

| | URL |
|---|---|
| Website | https://ui-production-cf27.up.railway.app |
| Admin | https://ui-production-cf27.up.railway.app/admin |
| API | https://api-production-b9cb.up.railway.app |

---

## Key notes

- **Database is shared** — everyone connects to the same live Neon PostgreSQL. Coordinate before running any migrations.
- **Never commit `.env` files** — they are gitignored.
- **All API fields are camelCase** (Prisma). If you see old `snake_case` fields, always add both as fallback: `data.firstName || data.firstname`.
- **All POST/PUT/PATCH requests are AES-encrypted** automatically by the Axios interceptor — do not add manual encryption.
- **Images** go to Cloudinary — upload via the admin panel, not by adding files to the repo.
