# Fitur Distribusi Ekuitas

## 🎯 Overview

Sistem SAKU menyediakan 3 cara untuk mengatur distribusi ekuitas:

### 1. **Hitung dari Kontribusi Modal** (Smart Auto)
Sistem otomatis menghitung ekuitas berdasarkan situasi:
- ✅ **Jika belum ada kontribusi modal** → Bagi rata otomatis
- ✅ **Jika sudah ada kontribusi modal** → Hitung berdasarkan proporsi

**Contoh:**
```
Scenario 1: Belum ada modal
- 2 anggota: Alphard & Lilo
- Kontribusi: Rp 0
- Hasil: 50-50%

Scenario 2: Sudah ada modal
- Alphard kontribusi: Rp 7,000,000
- Lilo kontribusi: Rp 3,000,000
- Total: Rp 10,000,000
- Hasil: Alphard 70%, Lilo 30%
```

### 2. **Bagi Rata ke Semua Anggota** (Explicit Equal Split)
Membagi ekuitas secara merata tanpa melihat kontribusi modal.

**Use Case:**
- Partnership dengan kesepakatan equal ownership
- Bisnis dengan kontribusi non-finansial (skill, waktu, network)
- Startup dengan co-founders yang equal

**Contoh:**
```
2 orang = 50-50%
3 orang = 33.33% masing-masing
4 orang = 25% masing-masing
```

### 3. **Atur Manual**
Pemilik bisnis mengatur sendiri persentase untuk setiap anggota.

**Validasi:**
- Total harus tepat 100%
- Setiap anggota: 0-100%
- Presisi: 2 desimal

---

## 🚀 Cara Menggunakan

### Akses Halaman Setup Ekuitas
1. Buka dashboard bisnis
2. Klik menu **"Mitra"** di sidebar
3. Klik tombol **"Atur Ekuitas"**

### Opsi 1: Hitung Otomatis dari Kontribusi
1. Di card biru, klik **"Preview"** untuk melihat hasil perhitungan
2. Jika cocok, klik **"Terapkan"** untuk langsung simpan
3. Sistem akan memberitahu metode apa yang digunakan:
   - "Ekuitas dibagi rata karena belum ada kontribusi modal"
   - "Ekuitas dihitung berdasarkan kontribusi modal total Rp X"

### Opsi 2: Bagi Rata Explicit
1. Di card biru bagian bawah, lihat preview: "X anggota = Y% per orang"
2. Klik **"Bagi Rata Sekarang"**
3. Ekuitas langsung dibagi rata dan tersimpan

### Opsi 3: Manual
1. Di form "Atur Distribusi Ekuitas Manual"
2. Input persentase untuk setiap anggota
3. Perhatikan indikator total di atas (hijau = valid, merah = invalid)
4. Klik **"Simpan Distribusi"**

---

## 📊 Logika Perhitungan

### Auto Calculate Logic
```typescript
if (totalContributions === 0) {
  // Split evenly
  percentage = 100 / totalMembers
} else {
  // Calculate based on contribution ratio
  percentage = (memberContribution / totalContributions) * 100
}
```

### Rounding
- Semua persentase dibulatkan ke 2 desimal
- Contoh: 33.333... → 33.33%

---

## 🔐 Keamanan & Akses

### Siapa yang Bisa Mengubah Ekuitas?
- ✅ **Owner bisnis**: Full access
- ❌ **Member biasa**: Read only

### Activity Logging
Setiap perubahan ekuitas dicatat di activity log dengan detail:
- Siapa yang mengubah
- Kapan
- Metode apa (auto/even_split/manual)
- Distribusi sebelum & sesudah

---

## 💡 Best Practices

### Kapan Pakai Auto Calculate?
- ✅ Bisnis berbasis investasi modal
- ✅ Partnership dengan kontribusi finansial berbeda
- ✅ Transparansi berdasarkan kontribusi real

### Kapan Pakai Bagi Rata?
- ✅ Co-founders dengan equal role
- ✅ Partnership skill-based (tidak hanya modal)
- ✅ Kesepakatan equal ownership

### Kapan Pakai Manual?
- ✅ Struktur ekuitas kompleks
- ✅ Ada kesepakatan khusus
- ✅ Kombinasi berbagai faktor (modal + skill + waktu)

---

## 🎬 Workflow Recommended

### Untuk Bisnis Baru (Belum Ada Modal)
1. Invite semua co-founders
2. Gunakan **"Bagi Rata"** untuk distribusi awal
3. Setelah ada kontribusi modal, gunakan **"Auto Calculate"**

### Untuk Bisnis dengan Investor
1. Owner invite investor
2. Catat kontribusi modal masing-masing di halaman "Modal"
3. Gunakan **"Auto Calculate"** untuk fair distribution

### Untuk Partnership Non-Finansial
1. Gunakan **"Bagi Rata"** atau **"Manual"**
2. Sesuaikan dengan kesepakatan (misal: 40-30-30 berdasarkan role)

---

## 📝 Notes

- Ekuitas dapat diubah kapan saja oleh owner
- Perubahan ekuitas tidak mengubah saldo modal partner
- Ekuitas mempengaruhi distribusi laba di masa depan
- Kontribusi modal historis tetap tercatat terpisah
