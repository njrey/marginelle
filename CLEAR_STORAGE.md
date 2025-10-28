# Clear LiveStore Storage

When schema changes, you need to clear both server and client storage.

## Server Storage (Already Done)

```bash
rm -rf apps/web/.wrangler/state
```

## Client Storage (Browser)

LiveStore uses OPFS (Origin Private File System) which isn't visible in IndexedDB.

### Option 1: Clear from Browser Console (Recommended)

Open Firefox/Edge DevTools Console and run:

```javascript
(async () => {
  const root = await navigator.storage.getDirectory();
  for await (const entry of root.values()) {
    await root.removeEntry(entry.name, { recursive: true });
    console.log('Removed:', entry.name);
  }
  console.log('OPFS cleared! Refresh the page.');
})()
```

### Option 2: Clear Site Data (Easier but clears everything)

**Firefox:**
1. Click the lock icon in address bar (next to URL)
2. Click "Clear cookies and site data..."

**Edge/Chrome:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear site data" button

### Option 3: Use Private Window

Open `http://localhost:60001` in a Private/Incognito window - starts with clean storage.

## After Clearing

1. Restart dev server: `pnpm dev`
2. Refresh browser
3. Data should persist after refresh now
