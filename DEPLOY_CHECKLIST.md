# ✅ Deploy Checklist - Super Simple!

Centang satu-satu sambil deploy:

---

## 🔐 Persiapan (5 menit)

- [ ] File `.env.local` ADA di folder SAKU (jangan commit ini!)
- [ ] File `.env.example` sudah dibuat (template)
- [ ] File `.gitignore` ada dan sudah include `.env` (sudah auto-ada)

---

## 📦 GitHub Desktop (10 menit)

- [ ] Buka **GitHub Desktop**
- [ ] Klik **File** → **Add Local Repository**
- [ ] Pilih folder `D:\Pictures\SAKU`
- [ ] Klik **Publish repository**
- [ ] Nama: `saku-app`
- [ ] **✅ CENTANG "Keep this code private"**
- [ ] Klik **Publish**
- [ ] Cek di GitHub.com → repo sudah ada
- [ ] Cek **TIDAK ADA** file `.env.local` di repo ✅

---

## 🌐 Vercel Deploy (15 menit)

### Login
- [ ] Buka https://vercel.com
- [ ] Login pakai **Continue with GitHub**

### Import Project
- [ ] Klik **Add New** → **Project**
- [ ] Pilih repo **saku-app**
- [ ] Klik **Import**

### Environment Variables (PENTING!)
Copy dari `.env.local` Anda ke Vercel:

- [ ] Key: `NEXT_PUBLIC_SUPABASE_URL`
  - Value: (copy dari .env.local)
  - ✅ Centang: Production, Preview, Development
  - Klik **Add**

- [ ] Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Value: (copy dari .env.local)
  - ✅ Centang: Production, Preview, Development
  - Klik **Add**

- [ ] Key: `SUPABASE_SERVICE_ROLE_KEY`
  - Value: (copy dari .env.local)
  - ✅ Centang: Production, Preview, Development
  - Klik **Add**

- [ ] Key: `NEXT_PUBLIC_APP_URL`
  - Value: `https://saku-app.vercel.app` (ganti nanti)
  - ✅ Centang: Production, Preview, Development
  - Klik **Add**

### Deploy!
- [ ] Klik **Deploy** (tombol biru)
- [ ] Tunggu 2-5 menit ☕
- [ ] Build selesai → **Visit** ✅

---

## 🔧 Post-Deploy (10 menit)

### Update App URL
- [ ] Copy URL deployment: `https://saku-app-xxxxx.vercel.app`
- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] Edit `NEXT_PUBLIC_APP_URL` → paste URL
- [ ] Klik **Save**

### Update Supabase
- [ ] Buka https://supabase.com/dashboard
- [ ] Pilih project SAKU
- [ ] Authentication → URL Configuration
- [ ] **Site URL**: paste `https://your-app.vercel.app`
- [ ] **Redirect URLs**: tambah `https://your-app.vercel.app/auth/callback`
- [ ] Klik **Save**

### Redeploy
- [ ] Balik ke Vercel → Deployments tab
- [ ] Klik **...** → **Redeploy**
- [ ] Tunggu selesai

---

## ✅ Testing

- [ ] Buka `https://your-app.vercel.app`
- [ ] Test Sign Up
- [ ] Test Login
- [ ] Test Buat Bisnis
- [ ] Test Invite Member

**Semua berfungsi?** → **SUKSES!** 🎉

---

## 🔄 Update Code Nanti

Workflow ke depan super simple:

1. Edit code di VS Code
2. Buka GitHub Desktop
3. Tulis message (misal: "Fix bug")
4. Klik **Commit to main**
5. Klik **Push origin**
6. **Auto-deploy!** ✅

---

## 🆘 Kalau Error

### Build Failed
1. Test di local: `npm run build`
2. Fix error
3. Push lagi

### Login Error
1. Cek Supabase redirect URLs
2. Pastikan pakai URL Vercel yang benar

### Env Var Error
1. Cek Vercel → Settings → Environment Variables
2. Pastikan semua ada dan benar
3. Redeploy

---

**Need help?** Lihat `DEPLOYMENT_GUIDE.md` untuk detail lengkap!
