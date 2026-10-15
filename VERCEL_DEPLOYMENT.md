# Deploying SmartStock AI to Vercel

This guide outlines the exact steps to deploy SmartStock AI on [Vercel](https://vercel.com) with client-side SPA routing, secure environment handling, and optimal asset caching.

---

## 1. Project Settings

When importing the repository into Vercel, use the following configuration:

| Setting | Value | Notes |
|---|---|---|
| **Framework Preset** | `Vite` | Automatically detected by Vercel |
| **Root Directory** | `./` (or `smartstock`) | If repository is cloned inside a nested folder, set the Root Directory to the folder containing `package.json` |
| **Build Command** | `npm run build` | Runs `tsc -b && vite build` |
| **Output Directory** | `dist` | Default Vite output folder |
| **Install Command** | `npm install` | Installs dependencies |
| **Node.js Version** | `18.x` or `20.x` | Supported LTS versions |

---

## 2. SPA Fallback & Routing Configuration

Single Page Applications (SPAs) using HTML5 `pushState` routing (`react-router-dom`) require all sub-routes to rewrite to `index.html`. This ensures direct links and page refreshes (e.g. `/pos`, `/inventory`, `/products/:id`, `/alerts`) work without returning 404 errors.

This is automatically configured in [`vercel.json`](./vercel.json):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 3. Environment Variables & Security

### Public vs. Secret Variables
- In Vite, **any variable prefixed with `VITE_` is baked directly into the JavaScript client bundle during `npm run build`**.
- Any user or visitor can inspect these values in browser DevTools.
- **Never prefix server secrets, service-role keys, or database credentials with `VITE_`**.

### Configurable Variables (Vercel Project Settings > Environment Variables)

| Variable | Required? | Visibility | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Optional | **Public** | Supabase project URL (e.g. `https://xyzcompany.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Optional | **Public** | Supabase publishable / anon API key only. |

> [!NOTE]
> **Zero-Config Demo Mode:**
> If no environment variables are provided, SmartStock AI automatically boots with its fully functional in-browser demo dataset for **Sharma Kirana Store**. All core features (billing, FEFO inventory, AI forecasting, stock rescue, and reporting) are fully interactive immediately without any backend setup.

---

## 4. Step-by-Step Deployment Instructions

### Method A: Deploy via Vercel Web Dashboard (Recommended)
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Log into [vercel.com](https://vercel.com) and click **"Add New..." → "Project"**.
3. Select your repository.
4. Verify the **Root Directory** (leave as `./` if `package.json` is at the repo root).
5. Build and Output Settings are preset to `npm run build` and `dist`.
6. (Optional) Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if connecting to a live Supabase project.
7. Click **Deploy**.

### Method B: Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Log in
vercel login

# 3. Deploy preview
vercel

# 4. Deploy to production
vercel --prod
```

---

## 5. Deployment Verification Checklist

After deployment succeeds, verify the following:
- [ ] **Home route**: `https://<your-project>.vercel.app/` loads the Sharma Kirana Store dashboard with store hero and KPI metrics.
- [ ] **Direct route navigation**: Visiting `https://<your-project>.vercel.app/pos` loads the POS checkout without 404s.
- [ ] **Deep link refresh**: Refreshing `https://<your-project>.vercel.app/products/prd_AMUL-TZ1L` loads the product page cleanly.
- [ ] **Interactive features**: Adding items to POS cart, calculating GST, and viewing receipt modal works smoothly.
- [ ] **Demo reset**: Click **Account Menu (Top Right) → Reset demo data** to verify browser state resets cleanly.
- [ ] **Responsiveness**: Verify top navigation collapses into mobile drawer below 1280px (`xl`).
- [ ] **Reduced motion**: In OS accessibility settings, enable "Reduce Motion" and verify animations adapt smoothly.
