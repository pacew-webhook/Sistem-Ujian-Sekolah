/**
 * SISTEM UJIAN SEKOLAH
 * Google Sheets + Gmail
 *
 * Cara pakai:
 * 1. Upload/import file XLSX ke Google Sheets.
 * 2. Extensions > Apps Script.
 * 3. Hapus kode bawaan dan paste kode ini.
 * 4. Simpan, reload Spreadsheet.
 * 5. Menu "🎓 UJIAN SEKOLAH" akan muncul.
 *
 * Kirim hanya peserta dengan Status = BELUM.
 * Setelah email berhasil dikirim, status menjadi TERKIRIM.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎓 UJIAN SEKOLAH')
    .addItem('📧 Kirim Ujian', 'tampilkanDialogKirim')
    .addItem('🔄 Buat Kode Peserta', 'buatKodePeserta')
    .addItem('📊 Lihat Status', 'lihatStatus')
    .addToUi();
}

function tampilkanDialogKirim() {
  const ss = SpreadsheetApp.getActive();
  const peserta = ss.getSheetByName('Peserta');
  const ujian = ss.getSheetByName('Ujian');

  if (!peserta || !ujian) {
    SpreadsheetApp.getUi().alert('Sheet Peserta atau Ujian tidak ditemukan.');
    return;
  }

  const p = peserta.getDataRange().getValues();
  const u = ujian.getDataRange().getValues();

  const kelasSet = {};
  const ujianSet = {};

  for (let i = 1; i < p.length; i++) {
    if (p[i][2]) kelasSet[p[i][2]] = true;
  }
  for (let i = 1; i < u.length; i++) {
    if (u[i][0] && String(u[i][6]).toUpperCase() === 'AKTIF') {
      ujianSet[pick(u[i][0])] = pick(u[i][1]);
    }
  }

  const kelas = Object.keys(kelasSet).sort();
  const ujianIds = Object.keys(ujianSet).sort();

  if (!kelas.length || !ujianIds.length) {
    SpreadsheetApp.getUi().alert('Pastikan data kelas dan ujian AKTIF sudah tersedia.');
    return;
  }

  const html = HtmlService.createHtmlOutput(`
    <div style="font-family:Arial;padding:16px">
      <h3>Kirim Ujian</h3>
      <label>Kelas</label><br>
      <select id="kelas" style="width:100%;padding:8px;margin:6px 0 12px">
        ${kelas.map(x => `<option>${escapeHtml(x)}</option>`).join('')}
      </select>
      <label>Ujian</label><br>
      <select id="ujian" style="width:100%;padding:8px;margin:6px 0 16px">
        ${ujianIds.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)} - ${escapeHtml(ujianSet[x])}</option>`).join('')}
      </select>
      <button onclick="kirim()" style="padding:9px 16px">📧 KIRIM</button>
      <div id="hasil" style="margin-top:14px"></div>
      <script>
        function kirim() {
          document.getElementById('hasil').innerText = 'Memproses...';
          google.script.run
            .withSuccessHandler(function(r) {
              document.getElementById('hasil').innerText = r;
            })
            .kirimUjian(document.getElementById('kelas').value, document.getElementById('ujian').value);
        }
      </script>
    </div>
  `).setWidth(380).setHeight(330);

  SpreadsheetApp.getUi().showModalDialog(html, '📧 Kirim Ujian');
}

function kirimUjian(kelas, idUjian) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Peserta');
  const data = sh.getDataRange().getValues();
  let terkirim = 0, dilewati = 0, gagal = 0;

  const ujian = cariUjian(idUjian);
  if (!ujian) throw new Error('ID ujian tidak ditemukan: ' + idUjian);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = String(row[3] || '').trim();
    const kode = String(row[4] || '').trim();
    const status = String(row[6] || '').trim().toUpperCase();

    if (String(row[2]).trim() !== kelas || String(row[5]).trim() !== idUjian || status !== 'BELUM') {
      dilewati++;
      continue;
    }

    if (!email) {
      gagal++;
      continue;
    }

    const kodeFinal = kode || buatKodeUnik();
    if (!kode) sh.getRange(i + 1, 5).setValue(kodeFinal);

    const nama = row[1] || '';
    const subject = 'Ujian Sekolah - ' + ujian.nama;
    const body =
      'Halo ' + nama + ',\\n\\n' +
      'Anda mendapatkan ujian: ' + ujian.nama + '\\n' +
      'Mata pelajaran: ' + ujian.mapel + '\\n' +
      'Kelas: ' + kelas + '\\n\\n' +
      'Kode Ujian Anda: ' + kodeFinal + '\\n' +
      'Durasi: ' + ujian.durasi + ' menit\\n\\n' +
      'Silakan buka aplikasi Ujian Sekolah dan masukkan kode tersebut.\\n\\n' +
      'Selamat mengerjakan.';

    try {
      MailApp.sendEmail(email, subject, body);
      sh.getRange(i + 1, 7).setValue('TERKIRIM');
      terkirim++;
    } catch (e) {
      gagal++;
    }
  }

  return 'Selesai. Terkirim: ' + terkirim + ', dilewati: ' + dilewati + ', gagal: ' + gagal;
}

function buatKodePeserta() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Peserta');
  const data = sh.getDataRange().getValues();
  const used = {};
  for (let i = 1; i < data.length; i++) if (data[i][4]) used[String(data[i][4])] = true;

  let dibuat = 0;
  for (let i = 1; i < data.length; i++) {
    if (!data[i][4]) {
      let code;
      do { code = buatKodeUnik(); } while (used[code]);
      used[code] = true;
      sh.getRange(i + 1, 5).setValue(code);
      dibuat++;
    }
  }
  SpreadsheetApp.getUi().alert('Kode dibuat: ' + dibuat);
}

function lihatStatus() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Peserta');
  const data = sh.getDataRange().getValues();
  let belum=0, terkirim=0, mulai=0, selesai=0;
  for (let i=1;i<data.length;i++) {
    const s=String(data[i][6]||'').toUpperCase();
    if(s==='BELUM') belum++;
    else if(s==='TERKIRIM') terkirim++;
    else if(s==='MULAI') mulai++;
    else if(s==='SELESAI') selesai++;
  }
  SpreadsheetApp.getUi().alert(
    'STATUS PESERTA\\n\\nBELUM: '+belum+
    '\\nTERKIRIM: '+terkirim+
    '\\nMULAI: '+mulai+
    '\\nSELESAI: '+selesai
  );
}

function cariUjian(id) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Ujian');
  const data = sh.getDataRange().getValues();
  for (let i=1;i<data.length;i++) {
    if(String(data[i][0]).trim()===String(id).trim()) {
      return {nama:data[i][1], mapel:data[i][2], durasi:data[i][4]};
    }
  }
  return null;
}

function buatKodeUnik() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i=0;i<5;i++) s += chars.charAt(Math.floor(Math.random()*chars.length));
  return s;
}

function pick(v) { return String(v == null ? '' : v); }

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
