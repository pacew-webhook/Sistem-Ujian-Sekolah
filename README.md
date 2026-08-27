# Sistem Ujian Sekolah — Google Sheets + Gmail

## Isi
- `Sistem_Ujian_Sekolah_Template.xlsx` — template database.
- `Code.gs` — Google Apps Script untuk menu dan pengiriman email massal.

## Cara memasang
1. Upload XLSX ke Google Drive lalu buka dengan Google Sheets.
2. Buka **Extensions → Apps Script**.
3. Hapus kode bawaan dan paste isi `Code.gs`.
4. Simpan.
5. Kembali ke Spreadsheet dan reload.
6. Menu **🎓 UJIAN SEKOLAH** akan muncul.
7. Isi data siswa, ujian, dan bank soal.
8. Pastikan status peserta `BELUM` dan ujian `AKTIF`.
9. Pilih **🎓 UJIAN SEKOLAH → 📧 Kirim Ujian**.
10. Pilih kelas dan ujian, lalu klik **KIRIM**.

## Catatan
- Contoh email memakai alamat dummy `example.com`; ganti dengan email siswa sebenarnya.
- Script hanya mengirim peserta dengan status `BELUM`, kelas sesuai pilihan, dan ID ujian sesuai pilihan.
- Setelah berhasil, status menjadi `TERKIRIM`.
- Batas pengiriman email Google tetap berlaku sesuai jenis akun.
