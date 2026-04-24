# KTV Management Frontend

React + Vite frontend for the KTV Management System.

## Local Development

Start the backend first:

```powershell
cd ..\..\backend
Copy-Item .env.example .env
npm install
npm run dev
```

The backend listens on `http://localhost:5000` by default and exposes API routes under `/api`.

Start the frontend in a second terminal:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Connection

The frontend uses Axios with `VITE_API_BASE_URL=/api`. In development, Vite proxies `/api/*` to `VITE_BACKEND_URL`, which defaults to `http://localhost:5000`.

Expected `.env`:

```text
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:5000
```

Verify:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```
