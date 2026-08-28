const SPREADSHEET_ID='1hsiIbEhm3eDCE84_wTUfgET1IaLl80lk';

function doGet(e){
  const a=e&&e.parameter?String(e.parameter.action||''):'';
  if(a==='cek')return apiCek(e);
  if(a==='soal')return apiSoal(e);
  if(a==='status')return apiStatus(e);
  return halamanGuru();
}

function doPost(e){
  try{
    const d=JSON.parse(e.postData.contents||'{}');
    if(d.action==='jawaban')return apiJawaban(d);
    return json({success:false,message:'Action POST tidak dikenal'});
  }catch(x){return json({success:false,message:x.message});}
}

function apiCek(e){
  const p=cariPeserta(e.parameter.kode);
  if(!p)return json({success:false,message:'Kode ujian tidak ditemukan'});
  return json({success:true,peserta:{id:p.id,nama:p.nama,kelas:p.kelas,idUjian:p.idUjian,status:p.status}});
}

function apiSoal(e){
  const p=cariPeserta(e.parameter.kode);
  if(!p)return json({success:false,message:'Kode ujian tidak valid'});
  const d=sheet('BankSoal').getDataRange().getValues(), s=[];
  for(let i=1;i<d.length;i++){
    if(norm(d[i][1])!==norm(p.idUjian))continue;
    s.push({id:d[i][0],nomor:d[i][2],soal:d[i][3],pilihan:{A:d[i][4],B:d[i][5],C:d[i][6],D:d[i][7]}});
  }
  s.sort((a,b)=>Number(a.nomor)-Number(b.nomor));
  return json({success:true,peserta:{id:p.id,nama:p.nama,kelas:p.kelas,idUjian:p.idUjian},jumlahSoal:s.length,soal:s});
}

function apiStatus(e){
  const p=cariPeserta(e.parameter.kode);
  if(!p)return json({success:false,message:'Kode tidak valid'});
  return json({success:true,status:p.status});
}

function apiJawaban(d){
  const p=cariPeserta(d.kode);
  if(!p)return json({success:false,message:'Kode ujian tidak valid'});
  if(norm(p.status)==='SELESAI')return json({success:false,message:'Ujian sudah selesai'});
  const sj=sheet('Jawaban'), ss=sheet('BankSoal'), bd=ss.getDataRange().getValues();
  const k={},n={};
  for(let i=1;i<bd.length;i++)if(norm(bd[i][1])===norm(p.idUjian)){k[String(bd[i][0])]=norm(bd[i][8]);n[String(bd[i][0])]=Number(bd[i][9])||0;}
  const arr=Array.isArray(d.jawaban)?d.jawaban:[], now=new Date(); let benar=0,salah=0,kosong=0,perolehan=0,total=0;
  Object.keys(n).forEach(x=>total+=n[x]);
  arr.forEach((x,i)=>{
    const id=String(x.idSoal||''),j=norm(x.jawaban);let h='KOSONG';
    if(!j)kosong++; else if(j===k[id]){h='YA';benar++;perolehan+=n[id]||0;}else{h='TIDAK';salah++;}
    sj.appendRow(['J-'+Date.now()+'-'+i,norm(d.kode),p.id,p.idUjian,id,j,h,now]);
  });
  const nilai=total?Math.round(perolehan/total*100):0;
  simpanNilai(p,benar,salah,kosong,nilai);ubahStatus(p.id,'SELESAI');
  return json({success:true,message:'Jawaban berhasil disimpan',benar:benar,salah:salah,kosong:kosong,nilai:nilai});
}

function simpanNilai(p,b,s,k,n){
  const sh=sheet('Nilai'),d=sh.getDataRange().getValues();
  for(let i=1;i<d.length;i++)if(String(d[i][0])===String(p.id)&&norm(d[i][3])===norm(p.idUjian)){
    sh.getRange(i+1,5,1,5).setValues([[b,s,k,n,'SELESAI']]);return;
  }
  sh.appendRow([p.id,p.nama,p.kelas,p.idUjian,b,s,k,n,'SELESAI']);
}

function halamanGuru(){
  const pd=sheet('Peserta').getDataRange().getValues(),ud=sheet('Ujian').getDataRange().getValues(),km={};
  for(let i=1;i<pd.length;i++)if(pd[i][2])km[pd[i][2]]=1;
  const kelas=Object.keys(km).sort(),uj=[];
  for(let i=1;i<ud.length;i++)if(ud[i][0]&&norm(ud[i][6])==='AKTIF')uj.push({id:ud[i][0],nama:ud[i][1]});
  const ko=kelas.map(x=>'<option>'+esc(x)+'</option>').join('');
  const uo=uj.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.id)+' - '+esc(x.nama)+'</option>').join('');
  return HtmlService.createHtmlOutput(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial;background:#f5f5f5;padding:20px}.box{max-width:450px;margin:20px auto;background:white;padding:22px;border-radius:15px}select,button{width:100%;padding:13px;margin:8px 0 18px;font-size:16px}button{background:#1a73e8;color:white;border:0;border-radius:8px;font-weight:bold}#h{white-space:pre-line;font-weight:bold}</style></head><body><div class="box"><h2>🎓 Sistem Ujian Sekolah</h2><label>Kelas</label><select id="k">${ko}</select><label>Ujian</label><select id="u">${uo}</select><button onclick="kirim()">📧 KIRIM UJIAN</button><div id="h"></div></div><script>function kirim(){let k=document.getElementById('k').value,u=document.getElementById('u').value;if(!confirm('Kirim ujian ke semua siswa kelas '+k+'?'))return;document.getElementById('h').innerText='⏳ Sedang mengirim...';google.script.run.withSuccessHandler(r=>document.getElementById('h').innerText=r).withFailureHandler(e=>document.getElementById('h').innerText='❌ ERROR: '+e.message).kirimUjian(k,u)}</script></body></html>`).setTitle('Sistem Ujian Sekolah');
}

function kirimUjian(kelas,idUjian){
  const ps=sheet('Peserta'),pd=ps.getDataRange().getValues(),ud=sheet('Ujian').getDataRange().getValues();let info=null;
  for(let i=1;i<ud.length;i++)if(norm(ud[i][0])===norm(idUjian)){info={nama:ud[i][1],mapel:ud[i][2],durasi:ud[i][4]};break;}
  if(!info)throw new Error('Ujian tidak ditemukan: '+idUjian);
  let b=0,d=0,g=0;
  for(let i=1;i<pd.length;i++){
    const kelasS=String(pd[i][2]||'').trim(),email=String(pd[i][3]||'').trim(),uj=String(pd[i][5]||'').trim(),st=norm(pd[i][6]);let kode=String(pd[i][4]||'').trim();
    if(kelasS!==String(kelas).trim()||uj!==String(idUjian).trim()||st!=='BELUM'){d++;continue;}
    if(!email){g++;continue;}
    if(!kode){kode=buatKode();ps.getRange(i+1,5).setValue(kode);}
    try{
      MailApp.sendEmail({to:email,subject:'Ujian Sekolah - '+info.nama,body:'Halo '+pd[i][1]+',\n\nAnda mendapatkan ujian sekolah.\n\nNama Ujian : '+info.nama+'\nMata Pelajaran : '+info.mapel+'\nKelas : '+kelas+'\nDurasi : '+info.durasi+' menit\n\nKODE UJIAN ANDA:\n'+kode+'\n\nSilakan buka aplikasi Ujian Sekolah dan masukkan kode tersebut.\n\nSelamat mengerjakan.'});
      ps.getRange(i+1,7).setValue('TERKIRIM');b++;
    }catch(x){g++;}
  }
  return '✅ SELESAI\n\nBerhasil dikirim : '+b+'\nDilewati : '+d+'\nGagal : '+g;
}

function cariPeserta(kode){
  kode=norm(kode);const d=sheet('Peserta').getDataRange().getValues();
  for(let i=1;i<d.length;i++)if(norm(d[i][4])===kode)return{row:i+1,id:d[i][0],nama:d[i][1],kelas:d[i][2],email:d[i][3],kode:d[i][4],idUjian:d[i][5],status:d[i][6]};
  return null;
}
function ubahStatus(id,s){
  const sh=sheet('Peserta'),d=sh.getDataRange().getValues();
  for(let i=1;i<d.length;i++)if(String(d[i][0])===String(id)){sh.getRange(i+1,7).setValue(s);return;}
}
function sheet(n){const s=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(n);if(!s)throw new Error('Sheet '+n+' tidak ditemukan');return s;}
function buatKode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
function norm(v){return String(v==null?'':v).trim().toUpperCase();}
function json(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
function esc(x){return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
