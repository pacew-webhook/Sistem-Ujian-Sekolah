# 🎓 Sistem Ujian Sekolah

Sistem ujian sekolah berbasis **Google Apps Script + Google Sheets** dengan API yang dapat digunakan oleh aplikasi Android.

## 📁 Struktur Project

```text
Sistem-Ujian-Sekolah/
├── src/
│   └── Code.gs
├── appsscript.json
├── .gitignore
├── .clasp.json.example
├── Template_Sistem_Ujian_Sekolah.xlsx
└── README.md
```

## ✨ Fitur

- API cek kode peserta
- API mengambil soal tanpa mengirim kunci jawaban
- API status ujian
- POST jawaban peserta
- Perhitungan nilai otomatis
- Pencegahan submit bersamaan menggunakan `LockService`
- Dashboard guru untuk mengirim kode ujian melalui email
- Konfigurasi Spreadsheet menggunakan Script Properties

## 📊 Sheet yang wajib ada

Jangan mengubah nama sheet berikut:

- `Peserta`
- `Ujian`
- `BankSoal`
- `Jawaban`
- `Nilai`
- `Pengaturan`

## 🚀 Instalasi Google Sheets

1. Upload `Template_Sistem_Ujian_Sekolah.xlsx` ke Google Drive.
2. Buka dengan Google Sheets.
3. Pastikan semua nama sheet tetap sama.
4. Isi data peserta, ujian, dan bank soal.

## 🔐 Konfigurasi SPREADSHEET_ID

Project ini **tidak menyimpan Spreadsheet ID di GitHub**.

Di Google Apps Script:

**Project Settings → Script Properties → Add script property**

Tambahkan:

```text
Property: SPREADSHEET_ID
Value: ID Google Spreadsheet Anda
```

Contoh URL spreadsheet:

```text
https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
```

Maka value yang digunakan adalah:

```text
ABC123XYZ
```

## 🧩 Instalasi Apps Script Manual

1. Buka Google Apps Script.
2. Buat project baru.
3. Copy isi `src/Code.gs` ke file `Code.gs`.
4. Tambahkan Script Property `SPREADSHEET_ID`.
5. Simpan project.
6. Deploy sebagai **Web app**.

## 🔄 Sinkronisasi dengan clasp

### Install Node.js

Install Node.js terlebih dahulu, kemudian:

```bash
npm install -g @google/clasp
```

Login:

```bash
clasp login
```

Buat file `.clasp.json` dari contoh:

```bash
cp .clasp.json.example .clasp.json
```

Isi `scriptId` dengan Script ID project Google Apps Script.

Upload source code:

```bash
clasp push
```

Mengambil perubahan dari Apps Script:

```bash
clasp pull
```

## 🌐 API

Ganti `WEB_APP_URL` dengan URL deployment Web App.

### Cek peserta

```text
GET WEB_APP_URL?action=cek&kode=X7K92
```

### Ambil soal

```text
GET WEB_APP_URL?action=soal&kode=X7K92
```

API ini tidak mengirim kolom kunci jawaban.

### Status ujian

```text
GET WEB_APP_URL?action=status&kode=X7K92
```

### Kirim jawaban

```json
{
  "action": "jawaban",
  "kode": "X7K92",
  "jawaban": [
    {"idSoal": "Q001", "jawaban": "B"},
    {"idSoal": "Q002", "jawaban": "C"}
  ]
}
```

## ⚠️ Catatan Keamanan

Sebelum digunakan untuk ujian resmi, pertimbangkan menambahkan:

- autentikasi/token API
- validasi waktu mulai dan selesai ujian
- batas perangkat atau sesi
- pengacakan soal yang aman
- logging aktivitas
- proteksi terhadap penggunaan kode ujian berulang

## 📌 Lisensi

Silakan sesuaikan lisensi repository sesuai kebutuhan sekolah atau project Anda.

# Project Ujian

Google Apps Script project yang disinkronkan dengan GitHub menggunakan clasp.

## Automatic Deployment

Setiap push ke branch `main` akan menjalankan:

1. GitHub Actions
2. Install clasp
3. Login menggunakan CLASP_CREDENTIALS
4. clasp push
5. Update Google Apps Script

## Struktur

- Code.gs
- appsscript.json
- .clasp.json
- .claspignore
- .github/workflows/deploy.yml
