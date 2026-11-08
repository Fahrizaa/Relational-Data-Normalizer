let globalState = {
  apiKey: '',
  fileB64: null,
  fileMimeType: null,
  fileName: '',
  fileSize: 0,
  isSimulatedData: false,
  rawData: [],
  columns: [],
  fds: [],
  primaryKeys: [],
  suggestedTables3NF: [],
  tables2NF: [],
  tables3NF: []
};

const MOCK_NOTA_DATA = {
  primaryKeys: ["NoNota", "KodeBarang"],
  columns: ["NoNota", "Tanggal", "KodePelanggan", "NamaPelanggan", "KodeBarang", "NamaBarang", "HargaSatuan", "Jumlah"],
  data: [
    ["N-001", "2026-03-28", "C-01", "Budi Santoso", "B-10", "Kopi Susu", 18000, 2],
    ["N-001", "2026-03-28", "C-01", "Budi Santoso", "B-12", "Roti Bakar", 15000, 1],
    ["N-002", "2026-03-29", "C-02", "Siti Aminah", "B-10", "Kopi Susu", 18000, 3]
  ],
  fds: [
    { lhs: ["NoNota"], rhs: ["Tanggal", "KodePelanggan", "NamaPelanggan"] },
    { lhs: ["KodePelanggan"], rhs: ["NamaPelanggan"] },
    { lhs: ["KodeBarang"], rhs: ["NamaBarang", "HargaSatuan"] },
    { lhs: ["NoNota", "KodeBarang"], rhs: ["Jumlah"] }
  ],
  suggestedTables3NF: [
    {
      name: "Tabel_Barang",
      description: "Data master katalog produk dan harga satuan",
      primaryKeys: ["KodeBarang"],
      foreignKeys: [],
      columns: ["KodeBarang", "NamaBarang", "HargaSatuan"]
    },
    {
      name: "Tabel_Pelanggan",
      description: "Data master identitas pelanggan",
      primaryKeys: ["KodePelanggan"],
      foreignKeys: [],
      columns: ["KodePelanggan", "NamaPelanggan"]
    },
    {
      name: "Tabel_Nota_Penjualan",
      description: "Data transaksi nota penjualan (KodePelanggan bertindak sebagai Foreign Key)",
      primaryKeys: ["NoNota"],
      foreignKeys: ["KodePelanggan"],
      columns: ["NoNota", "Tanggal", "KodePelanggan"]
    },
    {
      name: "Tabel_Detail_Nota",
      description: "Detail item belanja per nota dengan Composite PK sekaligus Foreign Key",
      primaryKeys: ["NoNota", "KodeBarang"],
      foreignKeys: ["NoNota", "KodeBarang"],
      columns: ["NoNota", "KodeBarang", "Jumlah"]
    }
  ]
};

const MOCK_GAJI_DATA = {
  primaryKeys: ["NIP", "Periode"],
  columns: ["NIP", "Periode", "NamaKaryawan", "Jabatan", "GajiPokok", "Tunjangan", "Potongan", "TotalGaji"],
  data: [
    ["PG-001", "2026-09", "Ayu Lestari", "Analis Data", 7500000, 1250000, 350000, 8400000],
    ["PG-002", "2026-09", "Raka Pratama", "Staf Keuangan", 6500000, 900000, 250000, 7150000],
    ["PG-003", "2026-09", "Dina Maharani", "Analis Data", 7500000, 1100000, 300000, 8300000],
    ["PG-001", "2026-10", "Ayu Lestari", "Analis Data", 7500000, 1350000, 350000, 8500000]
  ],
  fds: [
    { lhs: ["NIP"], rhs: ["NamaKaryawan", "Jabatan"] },
    { lhs: ["NIP", "Periode"], rhs: ["GajiPokok", "Tunjangan", "Potongan", "TotalGaji"] }
  ],
  suggestedTables3NF: [
    {
      name: "Tabel_Karyawan",
      description: "Data master identitas dan posisi jabatan pegawai",
      primaryKeys: ["NIP"],
      foreignKeys: [],
      columns: ["NIP", "NamaKaryawan", "Jabatan"]
    },
    {
      name: "Tabel_Slip_Gaji",
      description: "Data rincian pembayaran gaji periodik karyawan (NIP sebagai Foreign Key)",
      primaryKeys: ["NIP", "Periode"],
      foreignKeys: ["NIP"],
      columns: ["NIP", "Periode", "GajiPokok", "Tunjangan", "Potongan", "TotalGaji"]
    }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    document.getElementById('api-key-input').value = savedKey;
    globalState.apiKey = savedKey;
    updateKeyBadge(true, "Key Terpasang");
  }

  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-save-key').addEventListener('click', () => {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) return showToast('Masukkan Gemini API Key terlebih dahulu.', 'error');
    try {
      localStorage.setItem('gemini_api_key', key);
      globalState.apiKey = key;
      resolvedModel = null;
      updateKeyBadge(true, "Key tersimpan (belum diuji)");
      showToast('API key tersimpan di browser. Uji koneksi untuk memastikan key dapat digunakan.', 'success');
    } catch (err) {
      showToast('API key gagal disimpan. Periksa pengaturan browser Anda.', 'error');
    }
  });

  document.getElementById('btn-test-key').addEventListener('click', testApiKey);
  document.getElementById('btn-demo-nota').addEventListener('click', () => loadDemoData(MOCK_NOTA_DATA));
  document.getElementById('btn-demo-gaji').addEventListener('click', () => loadDemoData(MOCK_GAJI_DATA));

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFileUpload(event.dataTransfer.files[0]);
  });

  document.getElementById('btn-analyze').addEventListener('click', analyzeDocumentWithGemini);
  document.getElementById('btn-cancel-analyze').addEventListener('click', cancelAnalysis);
  document.getElementById('btn-parse-narrative').addEventListener('click', parseNarrativeToFDs);
  document.getElementById('btn-add-fd').addEventListener('click', addFDManual);
  document.getElementById('btn-process-unf').addEventListener('click', processUNFAnd1NF);
  document.getElementById('btn-process-2nf-3nf').addEventListener('click', process2NFAnd3NF);
  document.getElementById('btn-process-export').addEventListener('click', generateSQLExport);

  document.getElementById('btn-copy-sql').addEventListener('click', copySQL);
  document.getElementById('btn-download-sql').addEventListener('click', downloadSQLFile);
  document.getElementById('btn-export-json').addEventListener('click', exportSchemaJSON);
}

function updateKeyBadge(active, message) {
  const badge = document.getElementById('key-status');
  badge.classList.remove('hidden');
  badge.className = active ? 'badge badge-status' : 'badge badge-fk';
  badge.innerText = message;
}

function showToast(message, type = 'info') {
  const region = document.getElementById('toast-region');
  const toast = document.createElement('div');
  const icons = { success: 'circle-check', error: 'circle-exclamation', info: 'circle-info' };
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `<i class="fa-solid fa-${icons[type] || icons.info}" aria-hidden="true"></i><span></span>`;
  toast.querySelector('span').textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 5000);
}

function setKeyTestStatus(state, message) {
  const badge = document.getElementById('key-status');
  const detail = document.getElementById('key-test-detail');
  badge.classList.remove('hidden');
  badge.className = `badge ${state === 'checking' ? 'badge-checking' : state === 'success' ? 'badge-status' : 'badge-fk'}`;
  badge.innerHTML = state === 'checking'
    ? '<span class="status-spinner" aria-hidden="true"></span> Memeriksa API key...'
    : message;
  detail.textContent = state === 'checking'
    ? 'Menghubungi Gemini API, mohon tunggu hingga hasil validasi muncul.'
    : '';
}

async function testApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) {
    showToast('Masukkan Gemini API Key sebelum menguji koneksi.', 'error');
    document.getElementById('api-key-input').focus();
    return;
  }
  const button = document.getElementById('btn-test-key');
  const originalContent = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="status-spinner" aria-hidden="true"></span> Menguji...';
  globalState.apiKey = '';
  setKeyTestStatus('checking');

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      const details = await readApiError(res);
      throw new Error(details || `Gemini API merespons dengan status ${res.status}.`);
    }
    globalState.apiKey = key;
    setKeyTestStatus('success', 'Koneksi berhasil');
    showToast('API key valid dan berhasil terhubung ke Gemini.', 'success');
    try {
      localStorage.setItem('gemini_api_key', key);
    } catch (err) {
      showToast('Koneksi berhasil, tetapi API key tidak dapat disimpan di browser ini.', 'error');
    }
  } catch (err) {
    setKeyTestStatus('error', 'Koneksi gagal');
    showToast(`Gagal menguji API key: ${err.message}`, 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = originalContent;
  }
}

async function readApiError(response) {
  try {
    const body = await response.json();
    return body.error?.message || '';
  } catch {
    return '';
  }
}

async function copySQL() {
  try {
    await navigator.clipboard.writeText(document.getElementById('sql-output').innerText);
    showToast('SQL berhasil disalin ke clipboard.', 'success');
  } catch (err) {
    showToast('Gagal menyalin SQL. Periksa izin clipboard browser Anda.', 'error');
  }
}

function loadDemoData(mockData) {
  globalState.columns = [...mockData.columns];
  globalState.rawData = mockData.data.map(row => [...row]);
  globalState.fds = JSON.parse(JSON.stringify(mockData.fds));
  globalState.primaryKeys = [...(mockData.primaryKeys || [])];
  globalState.suggestedTables3NF = mockData.suggestedTables3NF ? JSON.parse(JSON.stringify(mockData.suggestedTables3NF)) : [];
  globalState.isSimulatedData = false;
  renderRawDataTableAndFDs();
  switchStep(4);
  scrollToCard('card-step-3-4');
  showToast('Data demo berhasil dimuat. Periksa data dan aturan bisnis sebelum melanjutkan.', 'success');
}

function handleFileUpload(file) {
  if (!file) return;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Format tidak didukung. Pilih berkas JPG, PNG, WEBP, atau PDF.', 'error');
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    showToast('Ukuran file terlalu besar (maks. 15 MB). Kompres atau pilih file lain.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    globalState.fileB64 = e.target.result.split(',')[1];
    globalState.fileMimeType = file.type;
    globalState.fileName = file.name;
    globalState.fileSize = file.size;
    updateEstimateNote();

    const previewContainer = document.getElementById('preview-container');
    const imgPreview = document.getElementById('image-preview');
    const fileIcon = document.getElementById('file-icon');
    const fileNameElem = document.getElementById('file-name');
    const fileSizeElem = document.getElementById('file-size');

    fileNameElem.textContent = file.name;
    fileSizeElem.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    if (file.type === 'application/pdf') {
      imgPreview.classList.add('hidden');
      fileIcon.className = 'fa-solid fa-file-pdf';
      fileIcon.style.color = '#dc2626';
    } else {
      imgPreview.src = e.target.result;
      imgPreview.classList.remove('hidden');
      fileIcon.className = 'fa-solid fa-file-image';
      fileIcon.style.color = '#2563eb';
    }

    previewContainer.classList.remove('hidden');
    showToast(`${file.name} siap dianalisis.`, 'success');
  };
  reader.onerror = () => showToast('Gagal membaca file. Coba pilih berkas lain.', 'error');
  reader.readAsDataURL(file);
}

async function analyzeDocumentWithGemini() {
  // 1. Validasi API Key
  const activeKey = globalState.apiKey || localStorage.getItem('gemini_api_key');
  if (!activeKey) {
    showToast('Masukkan dan simpan Gemini API Key Anda terlebih dahulu pada Langkah 1.', 'error');
    document.getElementById('card-step-1').scrollIntoView({ behavior: 'smooth' });
    const inputKey = document.getElementById('api-key-input');
    if (inputKey) inputKey.focus();
    return;
  }
  globalState.apiKey = activeKey;

  // 2. Validasi File
  if (!globalState.fileB64) {
    showToast('Pilih berkas dokumen (gambar/PDF) terlebih dahulu.', 'error');
    return;
  }

  const btn = document.getElementById('btn-analyze');
  const originalBtnHtml = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analisis &amp; Ekstrak Data dengan AI';
  btn.innerHTML = '<span class="status-spinner" aria-hidden="true"></span> Sedang Menganalisis...';
  btn.disabled = true;

  const promptText = `
    Anda adalah analis perancangan basis data relasional senior. Analisis dokumen yang dilampirkan (bisa berupa nota transaksi, slip gaji, formulir, atau dokumen spesifikasi perancangan sistem/DFD/Kamus Data/soal tugas akademik seperti pengolahan nilai mahasiswa).

    TUGAS ANALISIS & NORMALISASI RELASIONAL LENGKAP:
    1. Ekstrak himpunan atribut/kolom universal (UNF/1NF) yang lengkap, rapi, dan bersih (gunakan nama konsisten huruf kecil atau snake_case).
    2. Deteksi apakah dokumen memuat baris data aktual atau hanya skema. Berikan tanda "isSimulatedData": true jika baris data merupakan simulasi sintetis, atau false jika riil.
    3. Buatkan 3 sampai 4 baris sampel data realistis yang selaras antar atribut (panjang array tiap baris HARUS sama persis dengan jumlah kolom).
    4. Tentukan Primary Keys (PK) candidate untuk tabel universal / 1NF (bisa gabungan/composite, contoh: ["nim", "kode_mk", "semester", "tahun"] atau ["NoNota", "KodeBarang"]).
    5. Tentukan Functional Dependencies (FD) yang logis dan lengkap (misalnya: nim -> nama_mhs, jurusan; kode_mk -> nama_mk, sks; nip -> nama_dosen; [nim, kode_mk, semester, tahun] -> indeks, nip).
    6. "suggestedTables3NF": Rancang dekomposisi tabel final (3NF) yang optimal, bersih, dan semantik:
       - Berikan nama tabel yang bermakna dan jelas (misal: "tabel_mahasiswa", "tabel_mata_kuliah", "tabel_dosen", "tabel_nilai_mahasiswa", BUKAN nama kaku seperti tabel_ref_xxx).
       - Untuk setiap tabel, tentukan:
         * "name": nama tabel semantik
         * "description": fungsi tabel
         * "columns": daftar kolom
         * "primaryKeys": kolom yang menjadi Primary Key tabel ini
         * "foreignKeys": kolom yang menjadi Foreign Key di tabel ini (misal: kolom "nip" di tabel nilai mahasiswa adalah FK yang merujuk tabel_dosen, BUKAN primary key tabel nilai!).
         * "references": relasi foreign key, contoh: [{"column": "nip", "refTable": "tabel_dosen", "refColumn": "nip"}]
    7. PENTING - HINDARI KOLOM TUMPANG TINDIH: Jangan menghasilkan kolom redundan yang merujuk pada data yang sama (misalnya: jika ada nip dosen wali dan nip dosen pengampu yang identik, satukan menjadi atribut tunggal 'nip_dosen' atau 'nip' agar tidak tumpang tindih).

    Keluarkan HANYA JSON murni tanpa pembungkus markdown dengan format:
    {
      "columns": ["kolom1", "kolom2"],
      "isSimulatedData": true,
      "data": [["val1", "val2"]],
      "primaryKeys": ["kolom1"],
      "fds": [{"lhs": ["kolom1"], "rhs": ["kolom2"]}],
      "suggestedTables3NF": [
        {
          "name": "tabel_nama",
          "description": "Fungsi tabel",
          "columns": ["kolom1", "kolom2"],
          "primaryKeys": ["kolom1"],
          "foreignKeys": [],
          "references": []
        }
      ]
    }
  `;

  // Controller batas waktu agar tidak menggantung tanpa batas
  const controller = new AbortController();
  analyzeController = controller;
  let timedOut = false;
  const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, ANALYZE_TIMEOUT_MS);

  const estimate = estimateAnalysisSeconds(globalState.fileSize, globalState.fileMimeType);
  startLoadingUI(estimate);

  try {
    const textRes = await callGemini(
      [
        { text: promptText },
        { inline_data: { mime_type: globalState.fileMimeType, data: globalState.fileB64 } }
      ],
      controller.signal
    );

    const parsed = parseJsonFromText(textRes);

    if (!Array.isArray(parsed.columns) || !Array.isArray(parsed.data) || parsed.columns.length === 0) {
      throw new Error('AI tidak berhasil menyusun struktur tabel dari dokumen tersebut.');
    }

    const columns = parsed.columns.map(c => String(c).trim()).filter(Boolean);
    // Normalisasi baris agar panjangnya selalu sama dengan jumlah kolom
    const data = parsed.data
      .filter(Array.isArray)
      .map(row => columns.map((_, i) => (row[i] === undefined || row[i] === null ? '' : row[i])));

    globalState.columns = columns;
    globalState.rawData = data;
    globalState.fds = sanitizeFDs(parsed.fds);
    globalState.primaryKeys = Array.isArray(parsed.primaryKeys) ? parsed.primaryKeys.filter(k => columns.includes(k)) : [];
    globalState.suggestedTables3NF = Array.isArray(parsed.suggestedTables3NF) ? parsed.suggestedTables3NF : [];
    globalState.isSimulatedData = Boolean(parsed.isSimulatedData);

    renderRawDataTableAndFDs();
    switchStep(4);
    scrollToCard('card-step-3-4');

    if (globalState.isSimulatedData) {
      showToast('Analisis selesai. Data contoh simulasi telah dibuat otomatis dari Kamus Data dokumen.', 'info');
    } else {
      showToast('Data dokumen berhasil diekstrak secara otomatis.', 'success');
    }

  } catch (err) {
    if (err.name === 'AbortError') {
      if (timedOut) {
        showToast(`Waktu pemrosesan habis (${ANALYZE_TIMEOUT_MS / 1000} detik). Coba dokumen yang lebih kecil atau periksa koneksi internet.`, 'error');
      } else {
        showToast('Analisis dibatalkan.', 'info');
      }
    } else if (err instanceof SyntaxError) {
      showToast('Respons AI tidak dalam format JSON yang valid. Silakan coba analisis ulang.', 'error');
    } else {
      showToast(`Gagal menganalisis dokumen: ${err.message}`, 'error');
    }
  } finally {
    clearTimeout(timeoutId);
    analyzeController = null;
    stopLoadingUI();
    btn.innerHTML = originalBtnHtml;
    btn.disabled = false;
  }
}

/* =========================================================
   GEMINI API HELPERS
   ========================================================= */
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
// Urutan model yang dicoba (diprioritaskan versi terbaru Gemini 3.8 Flash sesuai instruksi API Google)
const PREFERRED_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];
const ANALYZE_TIMEOUT_MS = 90000;
let resolvedModel = null; // { key, name }
let analyzeController = null;

async function getCandidateModels(key, signal) {
  // Jika sudah ada model yang terbukti berhasil sebelumnya untuk key ini
  if (resolvedModel && resolvedModel.key === key) {
    return [resolvedModel.name, ...PREFERRED_MODELS.filter(m => m !== resolvedModel.name)];
  }

  try {
    const res = await fetch(`${GEMINI_BASE_URL}/models?pageSize=1000&key=${encodeURIComponent(key)}`, { signal });
    if (res.ok) {
      const body = await res.json();
      const available = (body.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      const filteredPreferred = PREFERRED_MODELS.filter(p => available.includes(p));
      const otherFlash = available.filter(n =>
        /flash/i.test(n) &&
        !filteredPreferred.includes(n) &&
        !/(image|tts|live|audio|embed|exp|preview|thinking)/i.test(n)
      );

      const candidateList = [...new Set([...filteredPreferred, ...otherFlash, ...PREFERRED_MODELS])];
      if (candidateList.length > 0) return candidateList;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }
  return [...PREFERRED_MODELS];
}

async function callGemini(parts, signal) {
  const key = globalState.apiKey;
  const candidates = await getCandidateModels(key, signal);

  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    try {
      const response = await fetch(
        `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errDetails = await readApiError(response);

        // Deteksi jika API Google merekomendasikan model lain secara eksplisit
        // Contoh: "Please update your code to use models/gemini-3.8-flash..."
        const recommendedMatch = errDetails.match(/models\/([a-zA-Z0-9_.-]+)/i);
        if (recommendedMatch && recommendedMatch[1] && !candidates.includes(recommendedMatch[1])) {
          candidates.splice(i + 1, 0, recommendedMatch[1]);
        }

        const isModelAvailabilityError =
          response.status === 404 ||
          errDetails.toLowerCase().includes('no longer available') ||
          errDetails.toLowerCase().includes('not found') ||
          errDetails.toLowerCase().includes('deprecated') ||
          errDetails.toLowerCase().includes('update your code to use');

        if (isModelAvailabilityError && i < candidates.length - 1) {
          // Lanjutkan ke kandidat model berikutnya tanpa langsung melempar error
          lastError = new Error(errDetails || `Model ${model} tidak tersedia.`);
          continue;
        }

        const hints = {
          400: 'Permintaan ditolak. Pastikan API key valid dan dokumen tidak rusak.',
          403: 'API key tidak memiliki izin. Periksa key Anda di Google AI Studio.',
          429: 'Kuota / batas permintaan API habis. Tunggu sebentar lalu coba lagi.',
          503: 'Server Gemini sedang sibuk. Coba lagi beberapa saat lagi.'
        };
        throw new Error(errDetails || hints[response.status] || `Server API Google merespons status ${response.status}`);
      }

      const result = await response.json();
      // Simpan model yang sukses agar tidak perlu mencari ulang
      resolvedModel = { key, name: model };
      return extractGeminiText(result);

    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
      // Jika error terkait ketersediaan model dan masih ada kandidat lain, coba berikutnya
      if (i < candidates.length - 1 && /not found|available|deprecated|update your code/i.test(err.message)) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Tidak ada model Gemini yang dapat digunakan untuk akun ini.');
}

function parseJsonFromText(text) {
  let clean = String(text).replace(/```(?:json)?/gi, '').trim();
  const starts = [clean.indexOf('{'), clean.indexOf('[')].filter(i => i !== -1);
  if (starts.length) {
    const start = Math.min(...starts);
    const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    if (end > start) clean = clean.substring(start, end + 1);
  }
  return JSON.parse(clean);
}

function sanitizeFDs(fds) {
  if (!Array.isArray(fds)) return [];
  const toArr = v => (Array.isArray(v) ? v : String(v || '').split(',')).map(s => String(s).trim()).filter(Boolean);
  return fds
    .map(fd => ({ lhs: toArr(fd && fd.lhs), rhs: toArr(fd && fd.rhs) }))
    .filter(fd => fd.lhs.length && fd.rhs.length);
}

/* =========================================================
   ESTIMASI & ANIMASI LOADING
   ========================================================= */
function estimateAnalysisSeconds(sizeBytes = 0, mime = '') {
  const sizeKB = sizeBytes / 1024;
  let seconds = 8 + (sizeKB / 100) * 1.5;      // dasar + waktu unggah/proses per 100 KB
  if (mime === 'application/pdf') seconds += 6; // PDF umumnya berisi lebih banyak halaman/teks
  return Math.round(Math.min(Math.max(seconds, 8), 60));
}

function formatSeconds(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec < 60) return `${sec} detik`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} menit ${s} detik` : `${m} menit`;
}

function updateEstimateNote() {
  const note = document.getElementById('estimate-text');
  if (!note || !globalState.fileB64) return;
  const est = estimateAnalysisSeconds(globalState.fileSize, globalState.fileMimeType);
  const low = Math.max(5, Math.round(est * 0.7));
  const high = Math.round(est * 1.4);
  note.textContent = `sekitar ${low}–${high} detik (bergantung ukuran file & koneksi)`;
}

let loadingTimer = null;

function startLoadingUI(estimateSec) {
  const panel = document.getElementById('analyze-loading');
  const stage = document.getElementById('loading-stage');
  const bar = document.getElementById('loading-progress');
  const elapsedEl = document.getElementById('loading-elapsed');
  const remainingEl = document.getElementById('loading-remaining');
  const cancelBtn = document.getElementById('btn-cancel-analyze');

  panel.classList.remove('hidden');
  cancelBtn.classList.remove('hidden');
  bar.style.width = '0%';
  const startedAt = Date.now();

  const tick = () => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const ratio = elapsed / estimateSec;
    // Progres mendekati 95% secara asimtotik, tidak pernah "selesai" sebelum respons datang
    const pct = ratio < 1 ? ratio * 85 : 85 + (1 - Math.exp(-(ratio - 1))) * 10;
    bar.style.width = `${Math.min(pct, 95).toFixed(1)}%`;
    elapsedEl.textContent = formatSeconds(elapsed);

    if (ratio < 1) {
      remainingEl.textContent = `± ${formatSeconds(estimateSec - elapsed)}`;
    } else {
      remainingEl.textContent = 'sebentar lagi...';
    }

    if (ratio < 0.15) stage.textContent = 'Mengirim dokumen ke Gemini...';
    else if (ratio < 0.5) stage.textContent = 'AI sedang membaca & mengenali isi dokumen...';
    else if (ratio < 0.85) stage.textContent = 'Menyusun kolom, data & Functional Dependencies...';
    else if (ratio < 1.3) stage.textContent = 'Hampir selesai, memfinalisasi hasil...';
    else stage.textContent = 'Memakan waktu lebih lama dari perkiraan, mohon tunggu...';
  };

  tick();
  clearInterval(loadingTimer);
  loadingTimer = setInterval(tick, 500);
}

function stopLoadingUI() {
  clearInterval(loadingTimer);
  loadingTimer = null;
  const bar = document.getElementById('loading-progress');
  if (bar) bar.style.width = '100%';
  document.getElementById('btn-cancel-analyze').classList.add('hidden');
  setTimeout(() => document.getElementById('analyze-loading').classList.add('hidden'), 300);
}

function cancelAnalysis() {
  if (analyzeController) analyzeController.abort();
}

function scrollToCard(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHTML(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function parseNarrativeToFDs() {
  const narrative = document.getElementById('fd-narrative').value.trim();
  if (!narrative) return showToast('Masukkan narasi aturan bisnis terlebih dahulu.', 'error');
  globalState.apiKey = globalState.apiKey || localStorage.getItem('gemini_api_key') || '';
  if (!globalState.apiKey) return showToast('Gemini API Key diperlukan untuk menerjemahkan narasi.', 'error');

  const btn = document.getElementById('btn-parse-narrative');
  btn.innerHTML = '<span class="status-spinner" aria-hidden="true"></span> Menerjemahkan...';
  btn.disabled = true;

  const promptText = `
    Diberikan daftar kolom tabel: ${JSON.stringify(globalState.columns)}
    Dan narasi aturan bisnis berikut: "${narrative}"

    Ekstrak ketergantungan fungsional (Functional Dependencies / FD) dari narasi tersebut ke dalam format JSON terstruktur.
    Pastikan nama atribut persis seperti nama kolom yang ada.
    Respon HANYA dalam format JSON array tanpa klausa markdown:
    [
      {"lhs": ["AtributX"], "rhs": ["AtributY", "AtributZ"]}
    ]
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const text = await callGemini([{ text: promptText }], controller.signal);
    let extracted = parseJsonFromText(text);
    if (!Array.isArray(extracted) && Array.isArray(extracted?.fds)) extracted = extracted.fds;
    if (!Array.isArray(extracted)) throw new Error('Respons AI bukan daftar ketergantungan fungsional yang valid.');

    const extractedFDs = sanitizeFDs(extracted);
    extractedFDs.forEach(newFd => globalState.fds.push(newFd));
    renderFDList();
    document.getElementById('fd-narrative').value = '';
    showToast('Aturan bisnis berhasil ditambahkan ke daftar FD.', 'success');
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Waktu habis, coba lagi.' : err.message;
    showToast(`Gagal menerjemahkan narasi: ${msg}`, 'error');
  } finally {
    clearTimeout(timeoutId);
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Terjemahkan Narasi ke FD';
    btn.disabled = false;
  }
}

function extractGeminiText(result) {
  const blockReason = result?.promptFeedback?.blockReason;
  if (blockReason) throw new Error(`Dokumen diblokir oleh filter keamanan Gemini (${blockReason}).`);
  const text = result?.candidates?.[0]?.content?.parts
    ?.filter(part => !part.thought)
    .map(part => part.text || '')
    .join('')
    .trim();
  if (!text) {
    const finish = result?.candidates?.[0]?.finishReason;
    throw new Error(finish ? `Gemini berhenti tanpa hasil (alasan: ${finish}).` : 'Gemini tidak mengembalikan teks. Periksa kuota dan izin API key.');
  }
  return text;
}

function renderRawDataTableAndFDs() {
  document.getElementById('card-step-3-4').classList.remove('hidden');

  // Menampilkan / menyembunyikan notifikasi data simulasi
  const notice = document.getElementById('simulation-notice');
  if (globalState.isSimulatedData) {
    notice.classList.remove('hidden');
  } else {
    notice.classList.add('hidden');
  }

  const table = document.getElementById('raw-data-table');
  
  // Render THEAD dengan header editable dan tombol hapus kolom
  table.querySelector('thead').innerHTML = `
    <tr>
      ${globalState.columns.map((c, i) => `
        <th style="position: relative;">
          <div class="col-header-wrap">
            <span contenteditable="true" class="editable-col-header" data-col-index="${i}" title="Klik untuk mengubah nama kolom">${escapeHTML(c)}</span>
            <i class="fa-solid fa-pen" style="font-size:0.6rem; color:rgba(255,255,255,0.6); pointer-events:none;" aria-hidden="true"></i>
            <button type="button" class="btn-delete-col" data-delete-col-index="${i}" title="Hapus kolom '${escapeHTML(c)}'" aria-label="Hapus kolom ${escapeHTML(c)}">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </th>
      `).join('')}
    </tr>
  `;

  // Render TBODY dengan baris data editable
  table.querySelector('tbody').innerHTML = globalState.rawData.map((row, rIdx) => 
    `<tr>${row.map((cell, cIdx) => `<td contenteditable="true" data-row="${rIdx}" data-col="${cIdx}">${escapeHTML(cell)}</td>`).join('')}</tr>`
  ).join('');

  // Event listener saat tombol hapus kolom diklik
  table.querySelectorAll('.btn-delete-col').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const colIndex = parseInt(btn.getAttribute('data-delete-col-index'), 10);
      deleteColumn(colIndex);
    });
  });

  // Event listener saat nama kolom diedit langsung di tabel
  table.querySelectorAll('.editable-col-header').forEach(headerEl => {
    headerEl.addEventListener('blur', (e) => {
      const colIndex = parseInt(e.target.getAttribute('data-col-index'), 10);
      const newName = e.target.innerText.trim();
      const oldName = globalState.columns[colIndex];

      if (newName && newName !== oldName) {
        renameColumn(oldName, newName, colIndex);
      } else if (!newName) {
        e.target.innerText = oldName;
      }
    });

    headerEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    });
  });

  // Event listener saat nilai sel data diedit
  table.querySelectorAll('tbody td').forEach(td => {
    td.addEventListener('blur', (e) => {
      const r = parseInt(e.target.getAttribute('data-row'), 10);
      const c = parseInt(e.target.getAttribute('data-col'), 10);
      if (globalState.rawData[r]) {
        globalState.rawData[r][c] = e.target.innerText.trim();
      }
    });
  });

  renderFDList();
}

function deleteColumn(colIndex) {
  if (colIndex < 0 || colIndex >= globalState.columns.length) return;
  if (globalState.columns.length <= 1) {
    showToast('Tabel harus memiliki minimal 1 kolom.', 'error');
    return;
  }

  const deletedCol = globalState.columns[colIndex];
  if (!confirm(`Hapus kolom "${deletedCol}" dari tabel? Tindakan ini akan menghapus kolom dan data di dalamnya.`)) {
    return;
  }

  // 1. Hapus dari globalState.columns
  globalState.columns.splice(colIndex, 1);

  // 2. Hapus sel pada colIndex dari setiap baris di rawData
  globalState.rawData.forEach(row => {
    if (Array.isArray(row) && row.length > colIndex) {
      row.splice(colIndex, 1);
    }
  });

  // 3. Bersihkan dari primaryKeys jika ada
  globalState.primaryKeys = globalState.primaryKeys.filter(k => k !== deletedCol);

  // 4. Bersihkan dari FDs
  globalState.fds = globalState.fds
    .map(fd => ({
      lhs: fd.lhs.filter(k => k !== deletedCol),
      rhs: fd.rhs.filter(k => k !== deletedCol)
    }))
    .filter(fd => fd.lhs.length > 0 && fd.rhs.length > 0);

  // 5. Bersihkan dari suggestedTables3NF jika ada
  if (Array.isArray(globalState.suggestedTables3NF)) {
    globalState.suggestedTables3NF.forEach(t => {
      if (Array.isArray(t.columns)) t.columns = t.columns.filter(c => c !== deletedCol);
      if (Array.isArray(t.primaryKeys)) t.primaryKeys = t.primaryKeys.filter(k => k !== deletedCol);
      if (Array.isArray(t.foreignKeys)) t.foreignKeys = t.foreignKeys.filter(k => k !== deletedCol);
      if (Array.isArray(t.references)) t.references = t.references.filter(r => r.column !== deletedCol);
    });
    globalState.suggestedTables3NF = globalState.suggestedTables3NF.filter(t => t.columns && t.columns.length > 0);
  }

  // 6. Re-render tampilan tabel mentah dan daftar FD
  renderRawDataTableAndFDs();

  // 7. Jika 1NF sedang terbuka, update juga tabel 1NF
  const card1NF = document.getElementById('card-step-5-6');
  if (card1NF && !card1NF.classList.contains('hidden')) {
    render1NFTable();
  }

  showToast(`Kolom "${deletedCol}" berhasil dihapus dari tabel.`, 'success');
}

function renameColumn(oldName, newName, colIndex) {
  globalState.columns[colIndex] = newName;

  // Perbarui jika nama kolom ada di Primary Key
  globalState.primaryKeys = globalState.primaryKeys.map(k => k === oldName ? newName : k);

  // Perbarui jika nama kolom ada di Functional Dependencies
  globalState.fds.forEach(fd => {
    fd.lhs = fd.lhs.map(k => k === oldName ? newName : k);
    fd.rhs = fd.rhs.map(k => k === oldName ? newName : k);
  });

  renderFDList();
  showToast(`Kolom "${oldName}" diperbarui menjadi "${newName}".`, 'info');
}

function renderFDList() {
  const container = document.getElementById('fd-list-container');
  if (globalState.fds.length === 0) {
    container.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Belum ada Functional Dependencies aktif.</span>`;
    return;
  }

  container.innerHTML = globalState.fds.map((fd, idx) => `
    <div class="fd-item">
      <span class="badge badge-pk">${escapeHTML(fd.lhs.join(', '))} → ${escapeHTML(fd.rhs.join(', '))}</span>
      <button onclick="removeFD(${idx})" class="btn-outline" style="padding: 2px 8px; font-size:0.75rem;"><i class="fa-solid fa-trash"></i> Hapus</button>
    </div>
  `).join('');
}

function addFDManual() {
  const lhs = document.getElementById('fd-lhs').value.split(',').map(s => s.trim()).filter(Boolean);
  const rhs = document.getElementById('fd-rhs').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!lhs.length || !rhs.length) {
    showToast('Isi atribut penentu (X) dan atribut yang ditentukan (Y).', 'error');
    return;
  }
  globalState.fds.push({ lhs, rhs });
  renderFDList();
  document.getElementById('fd-lhs').value = '';
  document.getElementById('fd-rhs').value = '';
  showToast('Ketergantungan fungsional berhasil ditambahkan.', 'success');
}

function removeFD(idx) {
  globalState.fds.splice(idx, 1);
  renderFDList();
}

function processUNFAnd1NF() {
  const card = document.getElementById('card-step-5-6');
  if (!card) return showToast('Langkah normalisasi tidak dapat dibuka.', 'error');
  if (!globalState.columns.length || !globalState.rawData.length) {
    showToast('Belum ada data untuk dinormalisasi. Unggah dokumen terlebih dahulu.', 'error');
    return;
  }
  
  card.classList.remove('hidden');

  if (globalState.fds.length > 0 && globalState.primaryKeys.length === 0) {
    globalState.primaryKeys = [...globalState.fds[0].lhs];
  }

  document.getElementById('unf-display').innerHTML = `
    <div style="background:#fafafa; padding:12px; border-radius:8px; border:1px solid var(--card-border);">
      <p style="font-size:0.875rem;"><strong>Daftar Atribut Universal (UNF):</strong> ${globalState.columns.join(', ')}</p>
    </div>
  `;

  render1NFTable();
  switchStep(6);
  scrollToCard('card-step-5-6');
  showToast('Bentuk 1NF siap ditinjau. Konfirmasi Primary Key sebelum melanjutkan.', 'success');
}

function render1NFTable() {
  const containerBtns = document.getElementById('pk-selector-buttons');
  containerBtns.innerHTML = globalState.columns.map((col, i) => {
    const isPK = globalState.primaryKeys.includes(col);
    return `<button type="button" data-pk-index="${i}" class="${isPK ? 'btn-dark' : 'btn-outline'}" style="font-size:0.8rem;">
      ${isPK ? '<i class="fa-solid fa-key"></i> PK: ' : ''}${escapeHTML(col)}
    </button>`;
  }).join('');
  containerBtns.querySelectorAll('button[data-pk-index]').forEach(b => {
    b.addEventListener('click', () => togglePK(globalState.columns[Number(b.dataset.pkIndex)]));
  });

  const table = document.getElementById('table-1nf');
  table.querySelector('thead').innerHTML = `<tr>${globalState.columns.map(c => `
    <th>${globalState.primaryKeys.includes(c) ? `<span class="badge badge-pk">PK</span> ` : ''}${escapeHTML(c)}</th>
  `).join('')}</tr>`;

  table.querySelector('tbody').innerHTML = globalState.rawData.map(row => 
    `<tr>${row.map(cell => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`
  ).join('');
}

function togglePK(colName) {
  if (globalState.primaryKeys.includes(colName)) {
    globalState.primaryKeys = globalState.primaryKeys.filter(k => k !== colName);
  } else {
    globalState.primaryKeys.push(colName);
  }
  render1NFTable();
}

function createHTMLTableElement(tableName, columns, primaryKeys = [], foreignKeys = [], rawDataRows = [], description = '', references = []) {
  const colIndices = columns.map(c => globalState.columns.indexOf(c)).filter(idx => idx !== -1);
  const uniqueRows = [];
  const seenKeys = new Set();

  rawDataRows.forEach(row => {
    const subRow = colIndices.map(i => row[i]);
    const keyStr = subRow.join('|||');
    if (!seenKeys.has(keyStr) && subRow.some(val => val !== undefined && val !== null && String(val).trim() !== '')) {
      seenKeys.add(keyStr);
      uniqueRows.push(subRow);
    }
  });

  const fkList = Array.isArray(foreignKeys) ? foreignKeys : [];
  const rawPkList = Array.isArray(primaryKeys) ? primaryKeys : [];

  // ATURAN: Jika suatu kolom berstatus FK, maka status PK yang di tabel sebelumnya TIDAK PERLU DIPERLIHATKAN.
  // Kolom tersebut murni berstatus FK, sehingga daftar PK di tabel ini hanya memuat kolom yang murni PK lokal.
  const purePkList = rawPkList.filter(k => !fkList.includes(k));

  // Peta referensi asal untuk setiap kolom FK
  const refMap = {};
  if (Array.isArray(references)) {
    references.forEach(r => {
      if (r && r.column) {
        refMap[r.column] = r.refTable || r.targetTable || '';
      }
    });
  }

  let refInfoHtml = '';
  if (Array.isArray(references) && references.length > 0) {
    refInfoHtml = `
      <div class="table-rel-info">
        <i class="fa-solid fa-link"></i> <strong>Kunci Tamu (Foreign Key):</strong>
        ${references.map(r => `<code>${escapeHTML(r.column)}</code> berasal dari tabel <strong>${escapeHTML(r.refTable || r.targetTable || 'tabel master')}(${escapeHTML(r.refColumn || r.targetColumn || r.column)})</strong>`).join(' &bull; ')}
      </div>
    `;
  } else if (fkList.length > 0) {
    refInfoHtml = `
      <div class="table-rel-info">
        <i class="fa-solid fa-link"></i> <strong>Kunci Tamu (Foreign Key):</strong>
        ${fkList.map(k => `<code>${escapeHTML(k)}</code> berasal dari tabel master`).join(', ')}
      </div>
    `;
  }

  return `
    <div class="norm-table-card">
      <div class="norm-table-header">
        <strong><i class="fa-solid fa-table"></i> ${escapeHTML(tableName)}</strong>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${purePkList.length > 0 ? `<span class="badge badge-pk" title="Primary Key"><i class="fa-solid fa-key"></i> PK: ${escapeHTML(purePkList.join(', '))}</span>` : ''}
          ${fkList.length > 0 ? `<span class="badge badge-fk" title="Foreign Key"><i class="fa-solid fa-link"></i> FK: ${escapeHTML(fkList.join(', '))}</span>` : ''}
        </div>
      </div>
      ${description ? `<p class="norm-table-desc"><i class="fa-solid fa-circle-info"></i> ${escapeHTML(description)}</p>` : ''}
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              ${columns.map(col => {
                const isFK = fkList.includes(col);
                const isPK = !isFK && purePkList.includes(col);
                const originTable = refMap[col] || '';

                let badgeHtml = '';
                let originHtml = '';

                if (isFK) {
                  // Jika status kolom adalah FK, status PK sebelumnya tidak ditampilkan,
                  // melainkan hanya badge FK disertai klarifikasi tabel asal
                  badgeHtml = '<span class="badge badge-fk" title="Kunci Tamu (Foreign Key)"><i class="fa-solid fa-link"></i> FK</span> ';
                  if (originTable) {
                    originHtml = `<span class="fk-origin-tag"><i class="fa-solid fa-arrow-turn-up" style="transform:rotate(90deg);" aria-hidden="true"></i> asal: <strong>${escapeHTML(originTable)}</strong></span>`;
                  }
                } else if (isPK) {
                  badgeHtml = '<span class="badge badge-pk" title="Primary Key"><i class="fa-solid fa-key"></i> PK</span> ';
                }

                return `
                  <th>
                    <div class="th-col-content">
                      <div class="th-col-title">
                        ${badgeHtml}
                        <span>${escapeHTML(col)}</span>
                      </div>
                      ${originHtml}
                    </div>
                  </th>
                `;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${uniqueRows.length > 0 ? uniqueRows.map(row => `
              <tr>${row.map(cell => `<td>${cell !== undefined && cell !== null ? escapeHTML(cell) : '-'}</td>`).join('')}</tr>
            `).join('') : `<tr><td colspan="${columns.length}" style="text-align:center; color: var(--text-muted);">Tidak ada baris data</td></tr>`}
          </tbody>
        </table>
      </div>
      ${refInfoHtml}
    </div>
  `;
}

function process2NFAnd3NF() {
  if (globalState.primaryKeys.length === 0) {
    showToast('Pilih minimal satu Primary Key untuk 1NF sebelum menjalankan normalisasi.', 'error');
    return;
  }

  document.getElementById('card-step-7').classList.remove('hidden');

  const universeCols = [...globalState.columns];
  const userPKs = [...globalState.primaryKeys];

  // ==========================================
  // TAHAP 1: NORMALISASI 2NF (Hilangkan Partial Dependencies)
  // ==========================================
  let tables2NF = [];
  let remainingCols2NF = [...universeCols];
  let partialMasters = [];

  if (userPKs.length > 1) {
    globalState.fds.forEach((fd) => {
      const isSubset = fd.lhs.length > 0 && fd.lhs.length < userPKs.length && fd.lhs.every(k => userPKs.includes(k));
      const nonPkRhs = fd.rhs.filter(c => !userPKs.includes(c) && universeCols.includes(c));

      if (isSubset && nonPkRhs.length > 0) {
        const existing = partialMasters.find(m => arraysEqual(m.lhs, fd.lhs));
        if (existing) {
          existing.rhs = [...new Set([...existing.rhs, ...nonPkRhs])];
          existing.cols = [...new Set([...existing.lhs, ...existing.rhs])];
        } else {
          partialMasters.push({
            lhs: [...fd.lhs],
            rhs: [...nonPkRhs],
            cols: [...new Set([...fd.lhs, ...nonPkRhs])]
          });
        }
      }
    });

    partialMasters.forEach(pm => {
      const semName = findSemanticName(pm.lhs, pm.cols) || `Tabel_Master_${pm.lhs.join('_')}`;
      tables2NF.push({
        name: semName,
        description: `Dekomposisi 2NF: Menghilangkan ketergantungan parsial pada kunci [${pm.lhs.join(', ')}]`,
        pk: [...pm.lhs],
        fk: [],
        cols: [...pm.cols],
        references: []
      });
      // Kolom RHS dipisahkan dari tabel transaksi utama
      remainingCols2NF = remainingCols2NF.filter(c => !pm.rhs.includes(c) || pm.lhs.includes(c));
    });
  }

  // Tabel Transaksi Utama 2NF
  // Kolom-kolom LHS partial dependency di tabel transaksi berstatus Foreign Key
  const fks2NF = userPKs.filter(k => partialMasters.some(m => m.lhs.includes(k)));
  const transRefs2NF = [];
  partialMasters.forEach(pm => {
    const targetTable = findSemanticName(pm.lhs, pm.cols) || `Tabel_Master_${pm.lhs.join('_')}`;
    pm.lhs.forEach(col => {
      transRefs2NF.push({ column: col, refTable: targetTable, refColumn: col });
    });
  });

  const mainTrans2NFCols = [...new Set([...userPKs, ...remainingCols2NF])];
  const mainTrans2NFName = findTransactionTableName(universeCols) || "Tabel_Transaksi_Utama_2NF";

  // Di tabel transaksi 2NF, kolom yang menjadi FK dikeluarkan dari daftar PK lokal
  const mainTrans2NFPks = userPKs.filter(k => !fks2NF.includes(k));

  tables2NF.push({
    name: mainTrans2NFName,
    description: "Tabel transaksi utama 2NF yang memuat Foreign Key perujuk ke tabel master dan sisa atribut operasional",
    pk: mainTrans2NFPks.length > 0 ? mainTrans2NFPks : [...userPKs],
    fk: [...new Set(fks2NF)],
    cols: mainTrans2NFCols,
    references: transRefs2NF
  });

  // Terapkan penataan FK untuk 2NF agar konsisten
  resolveAndAssignForeignKeys(tables2NF);

  globalState.tables2NF = tables2NF;
  document.getElementById('tables-2nf-container').innerHTML = tables2NF.map(t => 
    createHTMLTableElement(t.name, t.cols, t.pk, t.fk, globalState.rawData, t.description, t.references)
  ).join('');

  // ==========================================
  // TAHAP 2: NORMALISASI 3NF (Hilangkan Transitive Dependencies & Tetapkan FK)
  // ==========================================
  let tables3NF = [];

  const canUseAi = isValidAiSuggestedTables(globalState.suggestedTables3NF, universeCols);
  if (canUseAi) {
    tables3NF = buildTablesFromAiSuggestions(globalState.suggestedTables3NF, universeCols);
  } else {
    tables3NF = computeDeterministic3NF(tables2NF, userPKs, globalState.fds, universeCols);
  }

  // Tetapkan status Foreign Key & pastikan PK yang dirujuk tabel lain menjadi FK di tabel tersebut
  resolveAndAssignForeignKeys(tables3NF);

  globalState.tables3NF = tables3NF;
  document.getElementById('tables-3nf-container').innerHTML = tables3NF.map(t => 
    createHTMLTableElement(t.name, t.cols, t.pk, t.fk, globalState.rawData, t.description, t.references)
  ).join('');

  switchStep(7);
  scrollToCard('card-step-7');
  showToast('Struktur 2NF dan 3NF berhasil dibentuk: kolom FK berstatus jelas dengan keterangan tabel asal.', 'success');
}

/* =========================================================
   HELPER ALGORITMA NORMALISASI & FOREIGN KEY ASSIGNMENT
   ========================================================= */
function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

function findSemanticName(pks, cols) {
  if (Array.isArray(globalState.suggestedTables3NF)) {
    const match = globalState.suggestedTables3NF.find(t => 
      arraysEqual(t.primaryKeys, pks) || (Array.isArray(t.columns) && pks.every(k => t.columns.includes(k)) && t.columns.length <= cols.length + 1)
    );
    if (match && match.name) return match.name;
  }
  // Deteksi berbasis konvensi nama kolom
  const pkStr = pks.join('_').toLowerCase();
  if (pkStr.includes('barang') || pkStr.includes('produk')) return 'Tabel_Barang';
  if (pkStr.includes('pelanggan') || pkStr.includes('customer')) return 'Tabel_Pelanggan';
  if (pkStr.includes('dosen') || pkStr.includes('nip')) return 'Tabel_Dosen';
  if (pkStr.includes('mhs') || pkStr.includes('nim') || pkStr.includes('mahasiswa')) return 'Tabel_Mahasiswa';
  if (pkStr.includes('mk') || pkStr.includes('matakuliah') || pkStr.includes('mata_kuliah')) return 'Tabel_Mata_Kuliah';
  if (pkStr.includes('karyawan') || pkStr.includes('pegawai')) return 'Tabel_Karyawan';
  return `Tabel_Master_${pks.join('_')}`;
}

function findTransactionTableName(cols) {
  if (Array.isArray(globalState.suggestedTables3NF)) {
    const match = globalState.suggestedTables3NF.find(t => 
      Array.isArray(t.primaryKeys) && t.primaryKeys.length > 1
    );
    if (match && match.name) return match.name;
  }
  const colStr = cols.join('_').toLowerCase();
  if (colStr.includes('nota')) return 'Tabel_Detail_Nota';
  if (colStr.includes('gaji')) return 'Tabel_Slip_Gaji';
  if (colStr.includes('nilai') || colStr.includes('indeks') || colStr.includes('smt')) return 'Tabel_Nilai_Mahasiswa';
  if (colStr.includes('krs')) return 'Tabel_KRS_Mahasiswa';
  return 'Tabel_Transaksi_Utama_3NF';
}

function isValidAiSuggestedTables(suggested, universeCols) {
  if (!Array.isArray(suggested) || suggested.length === 0) return false;
  const covered = new Set();
  for (const t of suggested) {
    if (!t.name || !Array.isArray(t.columns) || t.columns.length === 0) return false;
    t.columns.forEach(c => covered.add(c));
  }
  const matchCount = universeCols.filter(c => covered.has(c)).length;
  return matchCount >= Math.floor(universeCols.length * 0.7);
}

function buildTablesFromAiSuggestions(suggested, universeCols) {
  return suggested.map(t => {
    const cols = t.columns.filter(c => universeCols.includes(c));
    const pks = Array.isArray(t.primaryKeys) ? t.primaryKeys.filter(k => cols.includes(k)) : [];
    const fks = Array.isArray(t.foreignKeys) ? t.foreignKeys.filter(k => cols.includes(k)) : [];
    return {
      name: t.name,
      description: t.description || `Tabel hasil analisis normalisasi 3NF untuk entitas ${t.name}`,
      pk: pks.length > 0 ? pks : (cols.length > 0 ? [cols[0]] : []),
      fk: fks,
      cols: cols.length > 0 ? cols : [...t.columns],
      references: Array.isArray(t.references) ? t.references : []
    };
  });
}

function computeDeterministic3NF(tables2NF, userPKs, fds, universeCols) {
  let masterTables3NF = [];
  let mainTable = null;

  tables2NF.forEach(t => {
    const isMain = arraysEqual(t.pk, userPKs) || t.name.toLowerCase().includes('transaksi') || t.name.toLowerCase().includes('nilai');
    if (isMain && !mainTable) {
      mainTable = { ...t, cols: [...t.cols], pk: [...t.pk], fk: [...t.fk], references: [...(t.references || [])] };
    } else {
      masterTables3NF.push({ ...t, cols: [...t.cols], pk: [...t.pk], fk: [...t.fk], references: [...(t.references || [])] });
    }
  });

  if (!mainTable) {
    mainTable = {
      name: findTransactionTableName(universeCols),
      description: "Tabel transaksi utama 3NF",
      pk: [...userPKs],
      fk: [],
      cols: [...universeCols],
      references: []
    };
  }

  // Cari ketergantungan transitif di tabel utama: X -> Y di mana X bukan superkey dari mainTable
  fds.forEach(fd => {
    const hasLhs = fd.lhs.length > 0 && fd.lhs.every(k => mainTable.cols.includes(k));
    const isSuperKey = fd.lhs.every(k => userPKs.includes(k)) && fd.lhs.length >= userPKs.length;

    // Transitive: LHS ada di tabel, bukan superkey, dan ada atribut non-key di RHS
    if (hasLhs && !isSuperKey) {
      const nonPkRhs = fd.rhs.filter(c => !userPKs.includes(c) && mainTable.cols.includes(c) && !fd.lhs.includes(c));
      if (nonPkRhs.length > 0) {
        let existingMaster = masterTables3NF.find(m => arraysEqual(m.pk, fd.lhs));
        if (existingMaster) {
          existingMaster.cols = [...new Set([...existingMaster.cols, ...nonPkRhs])];
        } else {
          const masterName = findSemanticName(fd.lhs, [...fd.lhs, ...nonPkRhs]) || `Tabel_Ref_${fd.lhs.join('_')}`;
          masterTables3NF.push({
            name: masterName,
            description: `Tabel referensi master 3NF untuk atribut [${fd.lhs.join(', ')}]`,
            pk: [...fd.lhs],
            fk: [],
            cols: [...new Set([...fd.lhs, ...nonPkRhs])],
            references: []
          });
        }

        // Di tabel transaksi utama: hapus atribut non-key RHS, pertahankan LHS sebagai Foreign Key!
        mainTable.cols = mainTable.cols.filter(c => !nonPkRhs.includes(c));
        fd.lhs.forEach(k => {
          if (!mainTable.fk.includes(k)) mainTable.fk.push(k);
        });
      }
    }
  });

  mainTable.name = findTransactionTableName(universeCols);
  return [...masterTables3NF, mainTable];
}

/**
 * Aturan penetapan status kunci:
 * Kolom yang merupakan Foreign Key (FK) yang merujuk ke tabel master
 * status PK-nya TIDAK LAGI DIPERLIHATKAN pada tabel anak/transaksi.
 * Kolom tersebut murni menjadi Foreign Key (FK) lengkap dengan tabel asal referensinya.
 */
function resolveAndAssignForeignKeys(tables) {
  // 1. Identifikasi tabel master: tabel yang mendefinisikan kunci unik primer (biasanya single-PK)
  const masterTables = tables.filter(t => Array.isArray(t.pk) && t.pk.length === 1);

  tables.forEach(t => {
    if (!Array.isArray(t.fk)) t.fk = [];
    if (!Array.isArray(t.references)) t.references = [];

    const isSingleMaster = Array.isArray(t.pk) && t.pk.length === 1;

    t.cols.forEach(col => {
      // Cari apakah ada tabel master lain yang PK-nya adalah kolom ini
      const parentMaster = masterTables.find(m => m.name !== t.name && m.pk.length === 1 && m.pk[0] === col);

      if (parentMaster) {
        // Kolom ini merujuk ke tabel master -> berstatus Foreign Key!
        if (!t.fk.includes(col)) t.fk.push(col);

        const existingRef = t.references.find(r => r.column === col);
        if (existingRef) {
          existingRef.refTable = parentMaster.name;
          existingRef.refColumn = col;
        } else {
          t.references.push({ column: col, refTable: parentMaster.name, refColumn: col });
        }

        // ATURAN USER: Jika status kolom adalah FK, maka status PK tidak perlu diperlihatkan di tabel ini!
        // Hapus kolom tersebut dari daftar PK tabel ini agar statusnya murni FK.
        if (t.pk.includes(col) && !isSingleMaster) {
          t.pk = t.pk.filter(k => k !== col);
        }
      }
    });

    // Pastikan nilai unik
    t.pk = [...new Set(t.pk)];
    t.fk = [...new Set(t.fk)];
  });
}

function isLikelyCompositeIdentifier(col, pks) {
  // Hanya kunci identitas utama (misal nim + kode_mk + semester + tahun, atau no_nota + kode_barang) yang tetap PK
  const colLower = col.toLowerCase();
  // Kolom seperti nip dosen, kode pelanggan, kode supplier di tabel transaksi biasanya atribut perujuk (FK), bukan PK
  if (/(dosen|guru|pengampu|pelanggan|customer|supplier|kasir|admin|user)/i.test(colLower)) {
    return false;
  }
  return true;
}

function generateSQLExport() {
  document.getElementById('card-step-8').classList.remove('hidden');

  const summaryContainer = document.getElementById('all-stages-summary');
  summaryContainer.innerHTML = '';

  summaryContainer.innerHTML += `
    <div>
      <h3 style="color: var(--accent-dark); margin-bottom: 8px;">1. Unnormalized Form (UNF)</h3>
      <div style="background:#fafafa; padding:12px; border-radius:8px; border:1px solid var(--card-border);">
        <p style="font-size:0.875rem;"><strong>Atribut Terdeteksi:</strong> ${globalState.columns.join(', ')}</p>
      </div>
    </div>
    <div>
      <h3 style="color: var(--accent-dark); margin-bottom: 8px;">2. First Normal Form (1NF)</h3>
      ${createHTMLTableElement("Tabel_1NF_Atomik", globalState.columns, globalState.primaryKeys, [], globalState.rawData, "Data universal dalam bentuk tabel beranggotakan nilai atomik")}
    </div>
    <div>
      <h3 style="color: var(--accent-dark); margin-bottom: 8px;">3. Second Normal Form (2NF)</h3>
      ${globalState.tables2NF.map(t => createHTMLTableElement(t.name, t.cols, t.pk, t.fk, globalState.rawData, t.description, t.references)).join('')}
    </div>
    <div>
      <h3 style="color: var(--accent-dark); margin-bottom: 8px;">4. Third Normal Form (3NF - Final Relational Schema)</h3>
      ${globalState.tables3NF.map(t => createHTMLTableElement(t.name, t.cols, t.pk, t.fk, globalState.rawData, t.description, t.references)).join('')}
    </div>
  `;

  // Bangun SQL DDL dengan Foreign Key constraint yang tepat
  // Urutkan tabel: tabel master tanpa FK dibuat lebih dahulu sebelum tabel transaksi
  const sortedTables = [...globalState.tables3NF].sort((a, b) => (a.fk.length || 0) - (b.fk.length || 0));

  let sql = `-- ==========================================================\n`;
  sql += `-- Kueri DDL Hasil Normalisasi Relasional AI (1NF s.d 3NF)\n`;
  sql += `-- Dilengkapi Penegasan PRIMARY KEY & FOREIGN KEY Constraints\n`;
  sql += `-- ==========================================================\n\n`;

  sortedTables.forEach(t => {
    const cleanTableName = t.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    sql += `CREATE TABLE ${cleanTableName} (\n`;

    const colDefs = t.cols.map(c => {
      const isNum = /(harga|jumlah|gaji|tunjangan|potongan|total|sks|ipk|nilai|angka|kuantitas|qty)/i.test(c);
      const isDate = /(tanggal|tgl|date|periode)/i.test(c);
      let type = 'VARCHAR(255)';
      if (isNum) type = 'INT';
      else if (isDate) type = 'DATE';

      const isRequired = (t.pk && t.pk.includes(c)) || (t.fk && t.fk.includes(c));
      return `  ${c.toLowerCase()} ${type}${isRequired ? ' NOT NULL' : ''}`;
    });

    // Primary Key Constraint
    if (t.pk.length > 0) {
      colDefs.push(`  PRIMARY KEY (${t.pk.map(p => p.toLowerCase()).join(', ')})`);
    } else if (t.fk.length > 0) {
      // Jika seluruh kunci tabel adalah Foreign Key (tabel asosiatif/detail komposit), jadikan FK sebagai Composite PK di SQL
      colDefs.push(`  PRIMARY KEY (${t.fk.map(p => p.toLowerCase()).join(', ')})`);
    }

    // Foreign Key Constraints
    if (Array.isArray(t.references) && t.references.length > 0) {
      t.references.forEach((ref, idx) => {
        const refTableClean = (ref.refTable || '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const refColClean = (ref.refColumn || ref.column).toLowerCase();
        const fkColClean = ref.column.toLowerCase();
        colDefs.push(`  CONSTRAINT fk_${cleanTableName}_${fkColClean}_${idx + 1} FOREIGN KEY (${fkColClean}) REFERENCES ${refTableClean} (${refColClean}) ON UPDATE CASCADE ON DELETE RESTRICT`);
      });
    }

    sql += colDefs.join(',\n') + `\n);\n\n`;
  });

  document.getElementById('sql-output').innerText = sql;
  switchStep(8);
  scrollToCard('card-step-8');
  showToast('Ringkasan normalisasi dan SQL dengan status PK & FK siap diekspor.', 'success');
}

function downloadSQLFile() {
  const blob = new Blob([document.getElementById('sql-output').innerText], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'schema_normalisasi.sql';
  a.click();
}

function exportSchemaJSON() {
  const blob = new Blob([JSON.stringify({
    fds: globalState.fds,
    primaryKeys: globalState.primaryKeys,
    schema2NF: globalState.tables2NF,
    schema3NF: globalState.tables3NF
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'schema_normalisasi.json';
  a.click();
}

function switchStep(stepNum) {
  document.querySelectorAll('.step-item').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === stepNum);
  });
}