# How to Restart the Backend Server

The doctor routes are configured correctly, but the server needs to be restarted to load them.

## Quick Fix:

1. **Stop the current server:**
   - Find the terminal/command prompt where the server is running
   - Press `Ctrl + C` to stop it

2. **Start the server again:**
   ```bash
   cd Mumbai_hacks/backend
   npm start
   ```

   OR if you're using nodemon:
   ```bash
   npm run dev
   ```

3. **Verify it's working:**
   - You should see: `🚀 Server running on port 5000`
   - You should see: `✅ MongoDB connected`

## Alternative (Windows PowerShell):

Run this in PowerShell from the backend directory:
```powershell
.\restart-server.ps1
```

## Verify Routes Are Loaded:

After restarting, the server should respond to:
- `GET /api/doctor/me` (with auth token)
- `GET /api/doctor/me/appointments` (with auth token)
- `GET /api/doctor/alerts` (with auth token)

## If Still Getting 404:

1. Check that `server.js` includes: `app.use('/api/doctor', require('./routes/doctor'));`
2. Check that `routes/doctor.js` exists and exports the router
3. Make sure there are no syntax errors in the route files
4. Check the server console for any error messages


