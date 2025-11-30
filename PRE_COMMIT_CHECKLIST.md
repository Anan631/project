# Pre-Commit Checklist

Before pushing to GitHub, make sure to:

## ✅ Files Already Ignored (via .gitignore)
- `node_modules/` - Dependencies (auto-installed)
- `.env` and `.env*.local` - Environment variables with secrets
- `.next/` - Next.js build output
- `*.tsbuildinfo` - TypeScript build cache
- `*.log` - Log files

## ⚠️ Files to Check/Remove

### 1. Environment Files
- [ ] **`.env`** - Should NOT exist in repo (contains MONGO_URI, secrets)
- [ ] **`.env.local`** - Should NOT exist in repo
- [ ] **`.env.production`** - Should NOT exist in repo (unless using public config)

### 2. Build Artifacts
- [ ] **`frontend/.next/`** - Next.js build folder (should be ignored)
- [ ] **`frontend/out/`** - Next.js export folder (should be ignored)
- [ ] **`frontend/tsconfig.tsbuildinfo`** - TypeScript cache (should be ignored)

### 3. Sensitive Files
- [ ] **`backend/scripts/create-admin.js`** - ⚠️ **DECISION NEEDED**
  - Option A: Keep it (useful for setup documentation)
  - Option B: Remove it (security best practice - create admin via API only)
  - **Recommendation**: Keep it but add a warning in README

### 4. Development Files
- [ ] **`frontend/restart-dev.bat`** - Windows batch file (optional, can keep for convenience)

### 5. Lock Files
- [ ] **`package-lock.json`** and **`yarn.lock`** - Usually keep both, or standardize on one
  - If using npm: keep `package-lock.json`, remove `yarn.lock`
  - If using yarn: keep `yarn.lock`, remove `package-lock.json`

## 🔒 Security Checklist

- [ ] No hardcoded passwords or API keys in code
- [ ] No database connection strings in code
- [ ] No admin credentials in code
- [ ] `.env` file is in `.gitignore` and not tracked
- [ ] Review `backend/scripts/create-admin.js` - contains password hashing logic (okay to keep)

## 📝 Recommended Actions

1. **Create `.env.example`** files:
   ```bash
   # backend/.env.example
   MONGO_URI=your_mongodb_connection_string
   PORT=3001
   
   # frontend/.env.example (if needed)
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

2. **Verify .gitignore is working**:
   ```bash
   git status
   # Should NOT show: .env, node_modules, .next, etc.
   ```

3. **Check for accidentally tracked sensitive files**:
   ```bash
   git ls-files | grep -E "\.env|password|secret|key"
   ```

## 🚀 Ready to Push?

After checking all items above, you're ready to push to GitHub!

```bash
git add .
git commit -m "Your commit message"
git push origin main
```


