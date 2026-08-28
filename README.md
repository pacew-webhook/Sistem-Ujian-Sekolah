Sistem Ujian Sekolah

Sistem Ujian Sekolah berbasis Google Apps Script yang dikelola melalui GitHub dan menggunakan clasp untuk sinkronisasi otomatis.

🚀 Arsitektur Project

GitHub Repository
       │
       │ Push / Commit
       ▼
GitHub Actions
       │
       │ clasp push
       ▼
Google Apps Script
       │
       ▼
Web App Sistem Ujian Sekolah

GitHub digunakan sebagai sumber kode utama.

Setiap perubahan yang masuk ke branch "main" akan otomatis dikirim ke Google Apps Script.

---

📁 Struktur Repository

Sistem-Ujian-Sekolah/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── src/
│   ├── Code.gs
│   ├── appsscript.json
│   ├── Index.html
│   ├── CSS.html
│   └── JavaScript.html
│
├── .clasp.json
├── .gitignore
├── .claspignore
├── package.json
├── README.md
│
├── Sistem_Ujian_Sekolah_Template.xlsx
└── Template_Sistem_Ujian_Sekolah.xlsx

«File HTML, JavaScript, CSS, dan ".gs" yang digunakan Apps Script harus ditempatkan di dalam folder "src".»

---

🔧 Konfigurasi Clasp

File:

.clasp.json

berfungsi menentukan Google Apps Script project yang menjadi tujuan deployment.

Contoh:

{
  "scriptId": "SCRIPT_ID_GOOGLE_APPS_SCRIPT",
  "rootDir": "src"
}

"scriptId"

Gunakan Script ID dari Google Apps Script:

Google Apps Script → Project Settings → IDs → Script ID

"rootDir"

Project menggunakan:

"rootDir": "src"

Artinya clasp hanya menggunakan folder "src" sebagai sumber project Apps Script.

---

🔐 GitHub Secret

GitHub Actions menggunakan secret:

CLASP_CREDENTIALS

Secret tersebut berisi credentials dari:

~/.clasprc.json

Credentials tidak boleh disimpan di repository.

Jangan memasukkan credentials ke:

Code.gs
.clasp.json
package.json
README.md

Jangan pernah mempublikasikan isi:

.clasprc.json

---

⚙️ GitHub Actions

Workflow berada di:

.github/workflows/deploy.yml

Contoh konfigurasi:

name: Deploy Google Apps Script

on:
  push:
    branches:
      - main

  workflow_dispatch:

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy to Google Apps Script
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Install clasp
        run: npm install -g @google/clasp

      - name: Configure clasp credentials
        env:
          CLASP_CREDENTIALS: ${{ secrets.CLASP_CREDENTIALS }}
        run: |
          printf '%s' "$CLASP_CREDENTIALS" > "$HOME/.clasprc.json"
          chmod 600 "$HOME/.clasprc.json"

      - name: Check clasp connection
        run: clasp status

      - name: Push project to Google Apps Script
        run: clasp push --force

      - name: Deployment completed
        run: echo "Deploy Google Apps Script berhasil."

---

🔄 Automatic Deployment

Setelah konfigurasi selesai, deployment berlangsung otomatis.

Contoh:

Edit src/Code.gs
       │
       ▼
Commit perubahan
       │
       ▼
Push ke branch main
       │
       ▼
GitHub Actions
       │
       ├── Checkout
       ├── Install clasp
       ├── Configure credentials
       ├── Check connection
       └── clasp push
              │
              ▼
       Google Apps Script

Tidak perlu melakukan copy-paste kode secara manual.

---

📱 Workflow dari HP Android

Untuk mengubah kode:

1. Buka repository GitHub.
2. Masuk ke folder:

src/

3. Pilih file yang ingin diedit, misalnya:

Code.gs

4. Tekan Edit.
5. Lakukan perubahan.
6. Tekan Commit changes.
7. Pastikan perubahan masuk ke branch:

main

8. GitHub Actions otomatis menjalankan deployment.

---

✅ Mengecek Deployment

Buka:

Repository
→ Actions
→ Deploy Google Apps Script

Deployment berhasil jika seluruh langkah memiliki tanda:

✓ Checkout repository
✓ Setup Node.js
✓ Install clasp
✓ Configure clasp credentials
✓ Check clasp connection
✓ Push project to Google Apps Script
✓ Deployment completed

---

🧪 Manual Deployment

Workflow juga menyediakan:

workflow_dispatch

Artinya deployment dapat dijalankan secara manual.

Caranya:

GitHub
→ Actions
→ Deploy Google Apps Script
→ Run workflow
→ Run workflow

---

🛡️ File yang Tidak Perlu Dikirim ke Apps Script

Gunakan ".claspignore" untuk mencegah file yang tidak diperlukan ikut dikirim.

Contoh:

.git/
.github/
node_modules/
README.md
package.json
package-lock.json
*.xlsx
*.zip

Dengan demikian file Excel dan file konfigurasi GitHub tidak ikut masuk ke Google Apps Script.

---

🚫 File yang Tidak Boleh Dipublikasikan

Jangan pernah memasukkan file atau data berikut ke repository:

.clasprc.json
OAuth credentials
access token
refresh token
client secret
password
API key
private key

Jika credentials pernah terlanjur dipublikasikan, segera revoke credentials tersebut dan buat credentials baru.

---

📦 Package

Project menggunakan clasp:

{
  "name": "sistem-ujian-sekolah",
  "version": "1.0.0",
  "private": true,
  "devDependencies": {
    "@google/clasp": "^3.4.0"
  },
  "scripts": {
    "push": "clasp push --force",
    "pull": "clasp pull",
    "status": "clasp status"
  }
}

---

🔁 Sinkronisasi

GitHub → Google Apps Script

Didukung secara otomatis:

GitHub
   ↓
GitHub Actions
   ↓
clasp push
   ↓
Google Apps Script

Google Apps Script → GitHub

Untuk mengambil perubahan dari Google Apps Script secara manual:

clasp pull

Kemudian commit perubahan tersebut ke GitHub.

«Disarankan menjadikan GitHub sebagai sumber kode utama agar tidak terjadi konflik perubahan.»

---

🏷️ Branch

Branch utama:

main

Deployment otomatis hanya terjadi ketika ada perubahan pada:

main

Untuk eksperimen, gunakan branch lain:

develop
feature/nama-fitur

Setelah fitur selesai, merge ke:

main

Deployment akan berjalan otomatis.

---

🆘 Troubleshooting

Apps Script API belum aktif

Jika muncul:

User has not enabled the Apps Script API.

Buka:

https://script.google.com/home/usersettings

Aktifkan:

Google Apps Script API

Kemudian tunggu beberapa menit dan jalankan workflow kembali.

---

"appsscript" sudah ada

Jika muncul:

A file with this name already exists in the current project: appsscript

Pastikan hanya terdapat satu manifest Apps Script di dalam "rootDir".

Struktur yang benar:

src/
├── Code.gs
└── appsscript.json

Dan ".clasp.json" harus menggunakan:

{
  "scriptId": "SCRIPT_ID",
  "rootDir": "src"
}

---

🎯 Status Project

Komponen| Status
GitHub Repository| ✅
Google Apps Script| ✅
clasp| ✅
Google Apps Script API| ✅
CLASP_CREDENTIALS| ✅
GitHub Actions| ✅
Automatic Push| ✅
Node.js 24| ✅
GitHub → Apps Script| ✅

---

🔮 Pengembangan Berikutnya

Fitur yang dapat ditambahkan:

- Automatic versioning
- Automatic deployment Web App
- Production dan development environment
- Rollback deployment
- Branch protection
- Automated testing
- Backup otomatis
- Release/tag otomatis
- Deployment notification
- Validasi kode sebelum deployment
- Database Google Sheets
- Sistem login peserta
- Bank soal
- Randomisasi soal
- Timer ujian
- Penilaian otomatis
- Dashboard admin
- Rekap nilai
- Export hasil ujian

---

📌 Prinsip Utama

«Edit kode di GitHub → Commit → GitHub Actions → Google Apps Script otomatis diperbarui.»

Dengan konfigurasi ini, repository GitHub menjadi pusat pengelolaan kode Sistem Ujian Sekolah.
