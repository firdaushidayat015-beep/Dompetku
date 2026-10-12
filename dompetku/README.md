# DompetKu - Aplikasi Manajemen Keuangan Personal

Tugas UTS Pemrograman Web - D4 Manajemen Informatika, Fakultas Vokasi UNESA.
Dibuat oleh **Kelompok 5 2025D **.
Anggota **Firdaus Hidayat (25091397149) Fakhrizatus Juva Leizikha (25091397142) Andy Yusuf Maulana (25091397150)**.
Dibuat dengan **HTML, CSS, dan JavaScript murni** (tanpa framework).

- **Alamat web:** `[[https://firdaushidayat015-beep.github.io/Dompetku/dompetku/]'
- **Dokumen SRS:** `docs/Dokumentasi_Perancangan_Sistem_DompetKu.pdf` dan `docs/SRS.md`

## Cara melihat halaman

1. **Lewat GitHub Pages:** cukup klik tautan Alamat web di atas (direkomendasikan).
2. **Lokal:** download repo, buka `index.html` di browser. Tidak perlu install apa pun maupun menggunakan Live Server (butuh internet untuk font dan ikon Google).

## Struktur folder

```text
index.html        -> kerangka 5 halaman + modal form + tombol dark mode
css/style.css     -> seluruh tampilan, animasi, dan tema warna (termasuk Dark Mode)
js/data.js        -> data konstan 2026, state, localStorage, fungsi format uang
js/app.js         -> logika: render, navigasi, form dengan validasi parsing angka yang aman
img/              -> logo hero, avatar pengguna, dan favicon
docs/             -> berkas SRS dan dokumentasi perancangan sistem PDF
```

## Fitur (sesuai SRS)

| Halaman | Fitur yang berjalan |
|---|---|
| Beranda | Ringkasan saldo awal (10 Miliar), pemasukan, pengeluaran, sisa anggaran, donut alokasi, 4 transaksi terbaru, target utama. Semua angka dihitung dari data transaksi. |
| Transaksi | Catat transaksi (modal), tabel riwayat, filter jenis, metode, kategori, pencarian, paginasi, hapus transaksi. |
| Target Tabungan | Buat target (ada saran tabungan per bulan), tambah setoran, rincian, arsipkan/hapus, jadikan target utama (Maclaren, HJ 2027, Harley), tab Berjalan/Selesai/Arsip. |
| Laporan | Donut kategori, tren bulan ke bulan, metode pembayaran, toggle Bulan Ini / Tahun 2026. |
| Pengaturan | Ganti tema (Dark Mode/Light Mode), edit profil, mata uang, batas anggaran, kelola kategori, tambah rekening, sembunyikan saldo, toggle notifikasi, reset data. |

Data tersimpan penuh di `localStorage` peramban (browser), jadi tidak hilang saat halaman di-refresh.

## Penjelasan Struktur HTML (20 poin)

- Satu halaman `index.html` berisi lima `<section class="page">` (beranda, transaksi, tabungan, laporan, pengaturan). Hanya satu yang tampil sesuai `#hash` di URL.
- Elemen semantik: `<aside>` (sidebar), `<nav>` (menu), `<header>` (topbar), `<main>`, `<section>`, `<article>` (kartu), `<table>` dengan `<thead>`/`<tbody>`, `<form>`, `<label>`.
- Header halaman memuat judul dan deskripsi singkat; menu navigasi punya 5 pilihan.
- Di dalam header (topbar) ditambahkan tombol khusus untuk fitur penggantian tema (Dark Mode).
- Modal form memakai atribut ARIA (`role="dialog"`, `aria-modal`, `aria-label`) dan toast memakai `aria-live`.

## Penjelasan Desain CSS (30 poin)

- **Variabel CSS** (`:root`) menyimpan palet hijau dari desain Figma: `--green-800`, `--mint`, `--red`, `--bg`, dst. Memiliki kelas `body.dark-theme` untuk mode gelap.
- **Grid** untuk kartu statistik (`grid-4`, `grid-3`, `grid-2`) dan layout utama; **Flexbox** untuk sidebar, topbar, baris kartu, dan legenda.
- Donut chart dibuat dari SVG `<circle>` dengan `stroke-dasharray`, tanpa library.
- Toggle switch dibuat murni CSS (`input:checked + i`).
- Warna indikator: hijau untuk pemasukan, merah untuk pengeluaran.
- **Responsif:** breakpoint 1100px dan 860px (sidebar jadi menu horizontal, grid jadi satu kolom). `prefers-reduced-motion` dihormati.

## Penjelasan JavaScript (20 poin)

| Konsep | Contoh di kode |
|---|---|
| Event Handling | Klik tombol "Catat Transaksi", tombol "Dark Mode", tab, paginasi, toggle (`addEventListener`, event delegation di `document`). |
| DOM Manipulation | `renderTransactions()` membuat ulang baris tabel; `renderGoals()` membuat kartu target baru tanpa reload. |
| Style & Animation | Progress bar bergerak lewat `transition: width`, modal `@keyframes pop`, toast fade. |
| Form Validation | `showError()` menampilkan teks merah bila nominal/judul kosong, format salah. Memiliki `parseMoney()` Regex super aman yang kebal perbedaan format browser. |
| AJAX | Sengaja **tidak dipakai**; aplikasi murni menggunakan data internal dan `localStorage` agar tidak terjadi *error fetching CORS* saat di-hosting di GitHub Pages. |

## Catatan

- Tanggal demo dipatok ke **Oktober 2026** agar sama dengan desain laporan di sistem.
- Nilai tukar mata uang bersifat simulasi.
- Angka acuan target prioritas disesuaikan ke target masa depan pengguna (Maclaren, HJ 2027, dan Harley Davidson). Di aplikasi ini semuanya dihitung otomatis secara dinamis dari satu sumber data (`data.js`) supaya konsisten dan berjalan luring (*offline*).
