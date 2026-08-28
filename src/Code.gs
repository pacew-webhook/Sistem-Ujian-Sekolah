/**
 * SISTEM UJIAN SEKOLAH
 * GitHub-ready version
 *
 * Konfigurasi sensitif disimpan di Script Properties:
 * SPREADSHEET_ID
 */
const CONFIG = { SPREADSHEET_ID_KEY: 'SPREADSHEET_ID' };

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '').trim().toLowerCase() : '';
  if (action === 'cek') return apiCek(e);
  if (action === 'soal') return apiSoal(e);
  if (action === 'status') return apiStatus(e);
  return halamanGuru();
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ success: false, message: 'Data POST tidak ditemukan' });
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.action === 'jawaban') return apiJawaban(data);
    return json({ success: false, message: 'Action POST tidak dikenal' });
  } catch (error) {
    return json({ success: false, message: error.message });
  }
}

function apiCek(e) {
  const kode = e && e.parameter ? e.parameter.kode : '';
  if (!kode) return json({ success: false, message: 'Kode ujian wajib diisi' });
  const peserta = cariPeserta(kode);
  if (!peserta) return json({ success: false, message: 'Kode ujian tidak ditemukan' });
  return json({ success: true, peserta: { id: peserta.id, nama: peserta.nama, kelas: peserta.kelas, idUjian: peserta.idUjian, status: peserta.status } });
}

function apiSoal(e) {
  const kode = e && e.parameter ? e.parameter.kode : '';
  if (!kode) return json({ success: false, message: 'Kode ujian wajib diisi' });
  const peserta = cariPeserta(kode);
  if (!peserta) return json({ success: false, message: 'Kode ujian tidak valid' });
  if (norm(peserta.status) === 'SELESAI') return json({ success: false, message: 'Ujian sudah selesai' });

  const data = sheet('BankSoal').getDataRange().getValues();
  const soal = [];
  for (let i = 1; i < data.length; i++) {
    if (norm(data[i][1]) !== norm(peserta.idUjian)) continue;
    soal.push({ id: data[i][0], nomor: data[i][2], soal: data[i][3], pilihan: { A: data[i][4], B: data[i][5], C: data[i][6], D: data[i][7] } });
  }
  soal.sort((a, b) => Number(a.nomor) - Number(b.nomor));
  return json({ success: true, peserta: { id: peserta.id, nama: peserta.nama, kelas: peserta.kelas, idUjian: peserta.idUjian }, jumlahSoal: soal.length, soal: soal });
}

function apiStatus(e) {
  const kode = e && e.parameter ? e.parameter.kode : '';
  if (!kode) return json({ success: false, message: 'Kode ujian wajib diisi' });
  const peserta = cariPeserta(kode);
  if (!peserta) return json({ success: false, message: 'Kode tidak valid' });
  return json({ success: true, status: peserta.status });
}

function apiJawaban(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    if (!data.kode) return json({ success: false, message: 'Kode ujian wajib diisi' });
    const peserta = cariPeserta(data.kode);
    if (!peserta) return json({ success: false, message: 'Kode ujian tidak valid' });
    if (norm(peserta.status) === 'SELESAI') return json({ success: false, message: 'Ujian sudah selesai' });

    const bankData = sheet('BankSoal').getDataRange().getValues();
    const kunci = {}, nilaiSoal = {};
    for (let i = 1; i < bankData.length; i++) {
      if (norm(bankData[i][1]) === norm(peserta.idUjian)) {
        const id = String(bankData[i][0]);
        kunci[id] = norm(bankData[i][8]);
        nilaiSoal[id] = Number(bankData[i][9]) || 0;
      }
    }

    const jawabanMap = {};
    (Array.isArray(data.jawaban) ? data.jawaban : []).forEach(item => {
      const id = String(item.idSoal || '');
      if (id && Object.prototype.hasOwnProperty.call(kunci, id)) jawabanMap[id] = norm(item.jawaban);
    });

    let benar = 0, salah = 0, kosong = 0, perolehan = 0, total = 0;
    Object.keys(nilaiSoal).forEach(id => total += nilaiSoal[id]);

    const now = new Date();
    const rows = [];
    Object.keys(kunci).forEach((id, index) => {
      const jawaban = jawabanMap[id] || '';
      let hasil = 'KOSONG';
      if (!jawaban) kosong++;
      else if (jawaban === kunci[id]) { hasil = 'YA'; benar++; perolehan += nilaiSoal[id] || 0; }
      else { hasil = 'TIDAK'; salah++; }
      rows.push(['J-' + now.getTime() + '-' + index, norm(data.kode), peserta.id, peserta.idUjian, id, jawaban, hasil, now]);
    });

    if (rows.length) sheet('Jawaban').getRange(sheet('Jawaban').getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    const nilai = total ? Math.round((perolehan / total) * 100) : 0;
    simpanNilai(peserta, benar, salah, kosong, nilai);
    ubahStatus(peserta.id, 'SELESAI');
    return json({ success: true, message: 'Jawaban berhasil disimpan', benar, salah, kosong, nilai });
  } catch (error) {
    return json({ success: false, message: error.message });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function simpanNilai(p, benar, salah, kosong, nilai) {
  const sh = sheet('Nilai');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id) && norm(data[i][3]) === norm(p.idUjian)) {
      sh.getRange(i + 1, 5, 1, 5).setValues([[benar, salah, kosong, nilai, 'SELESAI']]);
      return;
    }
  }
  sh.appendRow([p.id, p.nama, p.kelas, p.idUjian, benar, salah, kosong, nilai, 'SELESAI']);
}

function halamanGuru() {
  const pd = sheet('Peserta').getDataRange().getValues();
  const ud = sheet('Ujian').getDataRange().getValues();
  const kelasMap = {};
  for (let i = 1; i < pd.length; i++) if (pd[i][2]) kelasMap[pd[i][2]] = true;
  const kelas = Object.keys(kelasMap).sort();
  const ujian = [];
  for (let i = 1; i < ud.length; i++) if (ud[i][0] && norm(ud[i][6]) === 'AKTIF') ujian.push({ id: ud[i][0], nama: ud[i][1] });
  const ko = kelas.map(x => '<option>' + esc(x) + '</option>').join('');
  const uo = ujian.map(x => '<option value="' + esc(x.id) + '">' + esc(x.id) + ' - ' + esc(x.nama) + '</option>').join('');
  return HtmlService.createHtmlOutput(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px}.box{max-width:450px;margin:20px auto;background:#fff;padding:22px;border-radius:15px}select,button{width:100%;padding:13px;margin:8px 0 18px;font-size:16px}button{background:#1a73e8;color:#fff;border:0;border-radius:8px;font-weight:bold;cursor:pointer}#h{white-space:pre-line;font-weight:bold}</style></head><body><div class="box"><h2>🎓 Sistem Ujian Sekolah</h2><label>Kelas</label><select id="k">${ko}</select><label>Ujian</label><select id="u">${uo}</select><button onclick="kirim()">📧 KIRIM UJIAN</button><div id="h"></div></div><script>function kirim(){const k=document.getElementById('k').value,u=document.getElementById('u').value;if(!confirm('Kirim ujian ke semua siswa kelas '+k+'?'))return;document.getElementById('h').innerText='⏳ Sedang mengirim...';google.script.run.withSuccessHandler(r=>document.getElementById('h').innerText=r).withFailureHandler(e=>document.getElementById('h').innerText='❌ ERROR: '+e.message).kirimUjian(k,u)}</script></body></html>`).setTitle('Sistem Ujian Sekolah');
}

function kirimUjian(kelas, idUjian) {
  const ps = sheet('Peserta'), pd = ps.getDataRange().getValues(), ud = sheet('Ujian').getDataRange().getValues();
  let info = null;
  for (let i = 1; i < ud.length; i++) if (norm(ud[i][0]) === norm(idUjian)) { info = { nama: ud[i][1], mapel: ud[i][2], durasi: ud[i][4] }; break; }
  if (!info) throw new Error('Ujian tidak ditemukan: ' + idUjian);
  let berhasil = 0, dilewati = 0, gagal = 0;
  for (let i = 1; i < pd.length; i++) {
    const kelasS = String(pd[i][2] || '').trim(), email = String(pd[i][3] || '').trim(), uj = String(pd[i][5] || '').trim(), status = norm(pd[i][6]);
    let kode = String(pd[i][4] || '').trim();
    if (kelasS !== String(kelas).trim() || uj !== String(idUjian).trim() || status !== 'BELUM') { dilewati++; continue; }
    if (!email) { gagal++; continue; }
    if (!kode) { kode = buatKode(); ps.getRange(i + 1, 5).setValue(kode); }
    try {
      MailApp.sendEmail({ to: email, subject: 'Ujian Sekolah - ' + info.nama, body: 'Halo ' + pd[i][1] + ',\n\nAnda mendapatkan ujian sekolah.\n\nNama Ujian : ' + info.nama + '\nMata Pelajaran : ' + info.mapel + '\nKelas : ' + kelas + '\nDurasi : ' + info.durasi + ' menit\n\nKODE UJIAN ANDA:\n' + kode + '\n\nSilakan buka aplikasi Ujian Sekolah dan masukkan kode tersebut.\n\nSelamat mengerjakan.' });
      ps.getRange(i + 1, 7).setValue('TERKIRIM'); berhasil++;
    } catch (_) { gagal++; }
  }
  return '✅ SELESAI\n\nBerhasil dikirim : ' + berhasil + '\nDilewati : ' + dilewati + '\nGagal : ' + gagal;
}

function cariPeserta(kode) {
  kode = norm(kode); if (!kode) return null;
  const data = sheet('Peserta').getDataRange().getValues();
  for (let i = 1; i < data.length; i++) if (norm(data[i][4]) === kode) return { row: i + 1, id: data[i][0], nama: data[i][1], kelas: data[i][2], email: data[i][3], kode: data[i][4], idUjian: data[i][5], status: data[i][6] };
  return null;
}
function ubahStatus(id, statusBaru) { const sh = sheet('Peserta'), data = sh.getDataRange().getValues(); for (let i = 1; i < data.length; i++) if (String(data[i][0]) === String(id)) { sh.getRange(i + 1, 7).setValue(statusBaru); return; } }
function getSpreadsheetId() { const id = PropertiesService.getScriptProperties().getProperty(CONFIG.SPREADSHEET_ID_KEY); if (!id) throw new Error('SPREADSHEET_ID belum dikonfigurasi. Buka Project Settings → Script Properties.'); return id.trim(); }
function getSpreadsheet() { return SpreadsheetApp.openById(getSpreadsheetId()); }
function sheet(nama) { const sh = getSpreadsheet().getSheetByName(nama); if (!sh) throw new Error('Sheet "' + nama + '" tidak ditemukan'); return sh; }
function buatKode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let kode = ''; for (let i = 0; i < 5; i++) kode += c[Math.floor(Math.random() * c.length)]; return kode; }
function norm(v) { return String(v == null ? '' : v).trim().toUpperCase(); }
function json(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
