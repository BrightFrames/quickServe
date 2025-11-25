# Supabase Migration Guide 🚀

## Why Supabase?
- ✅ **Free tier**: 500MB database, unlimited API requests
- ✅ **PostgreSQL**: Same database we're already using
- ✅ **Hosted**: No local PostgreSQL needed
- ✅ **Backups**: Automatic daily backups
- ✅ **Dashboard**: Web UI to view/manage data
- ✅ **Global CDN**: Fast worldwide access

## Step-by-Step Migration

### 1. Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub/Google/Email

### 2. Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name**: quickserve-db (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
3. Click "Create new project" (takes 2-3 minutes)

### 3. Get Connection String
1. Go to **Project Settings** (gear icon)
2. Click **Database** in sidebar
3. Scroll to **Connection string**
4. Select **URI** tab
5. Copy the connection string
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password

### 4. Update Backend Configuration

**Option A: Using DATABASE_URL (Recommended)**

Edit `backend/.env`:
```env
# Comment out these lines:
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=sourabh
# POSTGRES_DB=quickserve_db

# Add this line with your Supabase connection string:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

**Option B: Using Individual Parameters**
```env
POSTGRES_HOST=db.xxxxxxxxxxxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_supabase_password
POSTGRES_DB=postgres
```

### 5. Restart Backend
```bash
cd backend
npm start
```

You should see:
```
PostgreSQL connection established successfully.
Database synchronized successfully.
```

### 6. Seed Data (Optional)
```bash
cd backend
npm run seed
```

This will create:
- 10 menu items (Pizza, Burgers, etc.)
- Kitchen users (kitchen1, cook1)

### 7. Verify Migration

**Check Supabase Dashboard:**
1. Go to Supabase Dashboard
2. Click **Table Editor**
3. You should see tables: `menu_items`, `orders`, `users`, `ratings`, `tables`

**Test Application:**
1. Customer app: `http://localhost:8082/customer/menu/table/1`
2. Kitchen app: `http://localhost:5176/admin/kitchen`
3. Place an order and verify it appears in kitchen

## Troubleshooting

### Connection Failed
- ✅ Check password is correct
- ✅ Verify connection string format
- ✅ Ensure project is "Active" (not Paused)
- ✅ Check firewall isn't blocking port 5432

### SSL Error
The config already handles SSL automatically. If you see SSL errors, they should auto-resolve.

### Tables Not Created
```bash
cd backend
node seed.js
```

### View Data in Supabase
1. Supabase Dashboard → **Table Editor**
2. Select table from dropdown
3. View/edit data directly

## Benefits After Migration

### No Local PostgreSQL Needed
- ✅ Uninstall local PostgreSQL if desired
- ✅ No maintenance or updates needed
- ✅ Works on any computer with internet

### Team Collaboration
- ✅ Share connection string with team
- ✅ Everyone uses same database
- ✅ Real-time data sync

### Production Ready
- ✅ Same database for dev and production
- ✅ Just update connection string
- ✅ Automatic backups

### Data Management
- ✅ View data via Supabase dashboard
- ✅ Run SQL queries in web UI
- ✅ Export data as CSV

## Cost Comparison

| Feature | Local PostgreSQL | Supabase Free | Supabase Pro |
|---------|------------------|---------------|--------------|
| Database Size | Unlimited | 500 MB | 8 GB |
| Bandwidth | Free | Unlimited | Unlimited |
| Storage | Local disk | 1 GB | 100 GB |
| Backups | Manual | Daily | Daily |
| Cost | $0 (+ electricity) | $0 | $25/month |

## Security Notes

### Keep Secret
- ❌ Don't commit `.env` to git (already in `.gitignore`)
- ✅ Share connection string securely (encrypted)
- ✅ Rotate password periodically

### Production Security
- ✅ Use environment variables
- ✅ Enable Row Level Security in Supabase
- ✅ Restrict IP access if needed

## Rollback to Local PostgreSQL

If you want to switch back:

1. Comment out `DATABASE_URL` in `.env`
2. Uncomment `POSTGRES_*` variables
3. Start local PostgreSQL
4. Restart backend

## Next Steps

After successful migration:

1. ✅ Update production `.env` with Supabase URL
2. ✅ Deploy to hosting (Render, Railway, Vercel)
3. ✅ Share database access with team
4. ✅ Set up monitoring in Supabase
5. ✅ Configure backups schedule

## Support

- 📖 Supabase Docs: https://supabase.com/docs
- 💬 Supabase Discord: https://discord.supabase.com
- 🐛 Issues: Open GitHub issue

---

**Ready to migrate?** Follow steps 1-6 above! 🚀
