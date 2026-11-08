# **Relational Data Normalizer AI** 

> **Aplikasi Otomatisasi Normalisasi Basis Data Relasional (UNF, 1NF, 2NF, 3NF) Berbasis Web yang Diperkuat Google Gemini Multimodal AI.**

## **Ringkasan Proyek**

**Relational Data Normalizer AI** adalah alat bantu berbasis web yang memudahkan mahasiswa, dosen, serta analis basis data dalam mentransformasikan data mentah, dokumen transaksi nyata (seperti nota belanja atau slip gaji), maupun dokumen spesifikasi perancangan sistem akademik (DFD dan Kamus Data berformat PDF/gambar) ke dalam skema tabel terdisposisi bentuk normal pertama (1NF), kedua (2NF), hingga ketiga (3NF) lengkap dengan kueri DDL SQL.

Proyek ini berjalan **100% di sisi klien (*Client-Side Architecture*)** menggunakan HTML5, Modern CSS, dan Pure Vanilla JavaScript tanpa ketergantungan server perantara (*backend-less*).

## **Fitur Utama**

* **Analisis Multimodal Cerdas:** Mampu mengekstrak struktur tabel dan kamus data dari berkas gambar (`JPG`, `PNG`, `WEBP`) maupun dokumen studi kasus perkuliahan (`PDF`).

* **Sintesis Data Simulasi Otomatis:** Jika dokumen yang diunggah hanya berupa kamus data/DFD tanpa rekaman data fisik, AI secara otomatis menghasilkan sampel *dummy tuples* yang konsisten agar visualisasi dekomposisi dapat disimulasikan.

* **Deteksi Ketergantungan Fungsional (FD):** Menguraikan aturan bisnis dan relasi determinan langsung dari konteks dokumen, disertai opsi penambahan narasi bebas atau input FD manual secara opsional.

* **Tabel Interaktif & Full-Editable:** Nama kolom *header* maupun isi baris data mentah dapat disunting langsung di peramban.

* **Tahapan Normalisasi Terstruktur:**

  * **UNF (Unnormalized Form):** Menampilkan himpunan atribut global.

  * **1NF (First Normal Form):** Penghilangan grup berulang, atomikasi sel, dan pemilihan interaktif *Primary Key*.

  * **2NF (Second Normal Form):** Eliminasi ketergantungan fungsional parsial (*Partial Dependency*).

  * **3NF (Third Normal Form):** Eliminasi ketergantungan fungsional transitif (*Transitive Dependency*).

* **Ekspor Skema:** Menyediakan generasi skema DDL SQL otomatis (`CREATE TABLE`), unduh berkas `.sql`, serta ekspor format `.json`.

* **Desain Modern & Responsif:** Antarmuka bergaya *Bento Box*, palet warna ramah mata, serta visualisasi status data.

## **Privasi & Keamanan Kunci API (Bring Your Own Key)**

Aplikasi ini mengadopsi model **BYOK (Bring Your Own Key)** dengan pertimbangan keamanan dan keberlanjutan:

1. **Keberlanjutan Proyek Bebas Biaya (Open Source):** Karena proyek ini di-*deploy* langsung di GitHub Pages tanpa biaya langganan server komersial, penyediaan satu API key tunggal oleh pengembang akan berisiko terkena batasan kuota (*rate limit*) atau pembengkakan tagihan pemakaian yang merugikan.

2. **Kerahasiaan Data & Kunci API:**

   * Kunci API Anda disimpan di `localStorage` peramban lokal perangkat Anda sendiri.

   * Tidak ada server pihak ketiga atau *database cloud* penyimpanan rahasia yang menerima API key Anda.

   * Seluruh panggilan API ditransmisikan langsung dari browser Anda menuju endpoint resmi Google Cloud HTTPS (`generativelanguage.googleapis.com`).

## **Alur Penggunaan**

1. **Langkah 1 (Pengaturan API Key):** Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/app/apikey), masukkan ke form, lalu klik **Simpan & Uji Koneksi**.

2. **Langkah 2 (Unggah Dokumen):** Tarik atau pilih berkas foto nota, slip gaji, atau soal/DFD berformat PDF (atau gunakan salah satu tombol Data Demo untuk mencoba langsung).

3. **Langkah 3 & 4 (Verifikasi & Aturan Bisnis):** Periksa kolom atribut hasil ekstraksi, sesuaikan nama kolom jika perlu, dan konfirmasi daftar *Functional Dependencies* (FD).

4. **Langkah 5 & 6 (Formulasi UNF & 1NF):** Pilih satu atau beberapa kolom untuk dijadikan *Primary Key* (PK).

5. **Langkah 7 (Normalisasi 2NF & 3NF):** Jalankan dekomposisi otomatis untuk memisahkan tabel ketergantungan parsial dan transitif.

6. **Langkah 8 (Ekspor SQL):** Salin atau unduh skema basis data siap eksekusi dalam format SQL DDL.

## **Arsitektur Teknologi**

* **Frontend Core:** HTML5, CSS3, JavaScript (ES6+ Vanilla)

* **Styling:** Custom CSS, Google Fonts (*Plus Jakarta Sans*, *JetBrains Mono*), Font Awesome 6

* **Model Kecerdasan Buatan:** Google Gemini API (`gemini-3.8-flash`)

* **Hosting & CI/CD:** GitHub Pages & GitHub Actions

## **Menjalankan di Lokal (Local Development)**

Jika Anda ingin menjalankan repositori ini di komputer lokal:

```
# 1. Kloning repositori ini
git clone https://github.com/Fahrizaa/Relational-Data-Normalizer.git

# 2. Masuk ke direktori proyek
cd Relational-Data-Normalizer

# 3. Buka index.html di peramban favorit Anda
# Anda dapat menggunakan ekstensi VS Code "Live Server" atau membuka berkas secara langsung:
xdg-open index.html   # Untuk Linux
open index.html       # Untuk macOS
start index.html      # Untuk Windows

```

## **Kontribusi**

Kontribusi selalu terbuka lebar! Jika Anda memiliki saran perbaikan, pelaporan bug, atau penambahan algoritma normalisasi (misal: BCNF atau 4NF):

1. *Fork* repositori ini.

2. Buat branch fitur baru (`git checkout -b fitur/FiturKerenAnda`).

3. Lakukan commit perubahan (`git commit -m 'Menambahkan fitur keren'`).

4. Lakukan push ke branch (`git push origin fitur/FiturKerenAnda`).

5. Buka sebuah *Pull Request*.
