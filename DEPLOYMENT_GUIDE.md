# 🚀 Deployment Guide - SAKU ke Vercel

Panduan lengkap deploy aplikasi SAKU dari GitHub Desktop ke Vercel.

---

## 📋 Prerequisites

- [x] GitHub Desktop sudah terinstall
- [x] Akun GitHub (gratis)
- [x] Akun Vercel (gratis, bisa login pakai GitHub)
- [x] Project SAKU sudah jalan di local

---

## 🔐 PENTING: Keamanan Environment Variables

⚠️ **JANGAN PERNAH** commit file `.env.local` ke GitHub!

File ini sudah otomatis di-ignore oleh `.gitignore`, jadi aman. ✅

---

## 📦 Step 1: Push ke GitHub (via GitHub Desktop)

### 1.1 Buka GitHub Desktop

1. Buka aplikasi **GitHub Desktop**
2. Klik **File** → **Add Local Repository**
3. Pilih folder: `D:\Pictures\SAKU`
4. Klik **Add Repository**

### 1.2 Create Repository di GitHub

1. Di GitHub Desktop, klik **Publish repository**
2. Isi form:
   - **Name**: `saku-app` (atau nama yang Anda mau)
   - **Description**: `Sistem Aplikasi Keuangan UMKM`
   - **Keep this code private**: ✅ CENTANG ini! (Untuk keamanan)
3. Klik **Publish Repository**

### 1.3 Verify

1. Buka browser ke: https://github.com/yourusername
2. Repository `saku-app` sudah ada! ✅
3. Cek tidak ada file `.env.local` di repo ✅

---

## 🌐 Step 2: Deploy ke Vercel

### 2.1 Sign Up / Login Vercel

1. Buka: https://vercel.com
2. Klik **Sign Up** atau **Login**
3. Pilih **Continue with GitHub**
4. Authorize Vercel

### 2.2 Import Project

1. Di Vercel Dashboard, klik **Add New** → **Project**
2. Pilih repository: **saku-app**
3. Klik **Import**

### 2.3 Configure Project

**Framework Preset**: Next.js (auto-detect) ✅

**Root Directory**: `./` (default)

**Build Command**: `npm run build` (default)

**Output Directory**: `.next` (default)

⚠️ **JANGAN klik Deploy dulu!** Kita perlu setup environment variables dulu.

---

## 🔑 Step 3: Setup Environment Variables di Vercel

Sebelum deploy, kita perlu copy semua variable dari `.env.local` ke Vercel.

### 3.1 Buka Environment Variables

Di halaman configure project (step 2.3), scroll ke bawah ke section **Environment Variables**

### 3.2 Add Variables Satu-Satu

Copy dari `.env.local` Anda:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: (copy dari .env.local Anda)
- **Environments**: Production, Preview, Development (centang semua)
- Klik **Add**

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: (copy dari .env.local Anda)
- **Environments**: Production, Preview, Development (centang semua)
- Klik **Add**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: (copy dari .env.local Anda)
- **Environments**: Production, Preview, Development (centang semua)
- Klik **Add**

#### Variable 4: NEXT_PUBLIC_APP_URL
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: (nanti diisi setelah deploy, skip dulu)
- Atau isi sementara: `https://saku-app.vercel.app`

### 3.3 Verify

Pastikan sudah ada **4 environment variables** ✅

---

## 🚀 Step 4: Deploy!

1. Scroll ke atas
2. Klik tombol **Deploy**
3. Tunggu 2-5 menit (build process)
4. ✅ **Deployment Complete!**

---

## 🔧 Step 5: Post-Deployment Setup

### 5.1 Get Deployment URL

Setelah deploy selesai, Anda akan dapat URL seperti:
```
https://saku-app-xxxxx.vercel.app
```

Copy URL ini!

### 5.2 Update NEXT_PUBLIC_APP_URL

1. Di Vercel Dashboard → Project Settings → **Environment Variables**
2. Edit variable `NEXT_PUBLIC_APP_URL`
3. Ganti value jadi URL deployment Anda
4. Klik **Save**

### 5.3 Update Supabase Redirect URLs

⚠️ **PENTING!** Agar login Google OAuth berfungsi:

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Go to **Authentication** → **URL Configuration**
4. Di **Redirect URLs**, tambahkan:
   ```
   https://your-app.vercel.app/auth/callback
   ```
5. Di **Site URL**, set:
   ```
   https://your-app.vercel.app
   ```
6. Klik **Save**

### 5.4 Redeploy (Optional)

Karena kita update env var, redeploy untuk apply changes:

1. Di Vercel Dashboard → **Deployments** tab
2. Klik **...** di deployment terakhir
3. Klik **Redeploy**
4. Tunggu selesai

---

## ✅ Step 6: Testing

1. Buka URL deployment: `https://your-app.vercel.app`
2. Test fitur:
   - ✅ Sign Up baru
   - ✅ Login
   - ✅ Buat bisnis
   - ✅ Invite member
   - ✅ Tambah transaksi
   - ✅ Lihat laporan

Kalau semua berfungsi → **SUKSES!** 🎉

---

## 🔄 Update Code di Masa Depan

Setelah ini, workflow jadi mudah:

### Via GitHub Desktop

1. Edit code di VS Code / editor favorit
2. Buka GitHub Desktop
3. Tulis commit message (misal: "Fix bug di laporan")
4. Klik **Commit to main**
5. Klik **Push origin**
6. **Auto-deploy!** Vercel otomatis build & deploy ✅

### Vercel Auto-Deploy

Setiap kali Anda push ke GitHub:
- Vercel otomatis detect changes
- Build & deploy automatically
- Selesai dalam 2-3 menit

---

## 🐛 Troubleshooting

### Error: Module not found

**Solusi**: Pastikan semua dependencies terinstall
```bash
npm install
```

### Error: Supabase connection failed

**Solusi**: Cek environment variables di Vercel
1. Vercel Dashboard → Settings → Environment Variables
2. Pastikan semua key & value benar
3. Redeploy

### Build failed di Vercel

**Solusi**:
1. Lihat build logs di Vercel
2. Test build di local dulu:
   ```bash
   npm run build
   ```
3. Fix error yang muncul
4. Push lagi ke GitHub

### OAuth redirect error

**Solusi**: Update Supabase redirect URLs (lihat Step 5.3)

---

## 📞 Support

Kalau ada masalah:
1. Cek build logs di Vercel Dashboard
2. Cek browser console (F12)
3. Cek Supabase logs

---

## 🎉 Selamat!

Aplikasi SAKU Anda sudah live di internet! 🚀

Share URL ke teman-teman untuk testing bersama!
