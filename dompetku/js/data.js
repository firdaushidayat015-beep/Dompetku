/* =========================================================
   DompetKu - data.js (Revisi 2026)
   Isi: data contoh (seed), penyimpanan localStorage, dan fungsi bantu.
   ========================================================= */

// KUNCI PENYIMPANAN DIUBAH KE V4 AGAR CACHE LAMA YANG ERROR DIHAPUS OTOMATIS
const STORAGE_KEY = "dompetku-state-v4"; 
const SALDO_AWAL = 10000000000;      // saldo sebelum transaksi Oktober dicatat (10 Miliar)
const TARGET_PEMASUKAN = 15000000; // target pemasukan bulanan (kartu Beranda)
const SISA_HARI_SIKLUS = 11;       // sesuai desain: "11 Hari Lagi"
const HARI_INI = new Date(2026, 9, 20); // tanggal demo ke Oktober 2026

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Warna per kategori (dipakai di donut & legenda). "alt" = warna versi halaman Laporan.
const KATEGORI_WARNA = {
  "Makanan & Minuman":       { color: "#004b34", alt: "#004b34" },
  "Tempat Tinggal & Utilitas": { color: "#2b6a53", alt: "#2b6a53" },
  "Belanja & Kebutuhan":     { color: "#4edea3", alt: "#4edea3" },
  "Transportasi":            { color: "#565e74", alt: "#565e74" },
  "Hiburan":                 { color: "#d6defa", alt: "#ba1a1a" },
  "Kendaraan Impian":        { color: "#c5c9e8", alt: "#565e74" },
  "Ibadah":                  { color: "#4edea3", alt: "#004b34" },
};
const WARNA_CADANGAN = ["#8a6d3b", "#7b5ea7", "#c2703d", "#2d8fa5", "#a0476b"];

// Warna titik rekening/dompet di tabel
const METODE_WARNA = { BCA: "#004b34", Mandiri: "#565e74", GoPay: "#4edea3", OVO: "#c5c9e8", QRIS: "#ba1a1a", Kartu: "#dae2fd" };
const METODE_FILTER = ["BCA", "Mandiri", "GoPay", "OVO", "QRIS"];
const DAFTAR_REKENING = ["BCA Prioritas", "BCA Virtual Account", "Mandiri Debit", "GoPay", "OVO Cash", "QRIS BCA", "Kartu Kredit Visa"];

// Ikon (Material Symbols) per kategori
const KATEGORI_IKON = {
  "Makanan & Minuman": "restaurant", "Tempat Tinggal & Utilitas": "bolt", "Belanja & Kebutuhan": "shopping_cart",
  "Transportasi": "local_gas_station", "Hiburan": "music_note", "Gaji & Karier": "payments", "Bonus / Hadiah": "redeem",
  "Kendaraan Impian": "directions_car", "Ibadah": "mosque"
};

// Data tahun berjalan (Jan - Sep) untuk tampilan "Tahun 2026" di Laporan
const DATA_TAHUNAN = {
  pemasukan: [13500000, 13800000, 14000000, 13900000, 14500000, 14200000, 14000000, 14100000, 13900000],
  pengeluaran: [6900000, 7200000, 6500000, 7100000, 7800000, 6600000, 7000000, 6900000, 7400000],
  kategori: { "Makanan & Minuman": 22190000, "Tempat Tinggal & Utilitas": 15850000, "Belanja & Kebutuhan": 11412000, "Transportasi": 7608000, "Hiburan": 6340000 },
};

// Transaksi contoh. type: "in" = pemasukan, "out" = pengeluaran
const tx = (id, date, title, note, category, method, type, amount) => ({ id, date, title, note, category, method, type, amount });
const SEED_TRANSAKSI = [
  tx(1, "2026-10-25T10:15", "Gaji Pokok - PT Teknologi Nusantara", "Payroll Oktober 2026", "Gaji & Karier", "BCA Prioritas", "in", 14000000),
  tx(2, "2026-10-25T08:00", "Langganan Spotify Premium", "Tagihan Bulanan Otomatis", "Hiburan", "Mandiri Debit", "out", 54500),
  tx(3, "2026-10-24T19:42", "Belanja Bulanan Grand Lucky", "Bahan Pangan SCBD", "Belanja & Kebutuhan", "GoPay", "out", 425000),
  tx(4, "2026-10-24T12:30", "Makan Siang Padang Sederhana", "Ayam Pop & Es Teh", "Makanan & Minuman", "QRIS BCA", "out", 35000),
  tx(5, "2026-10-24T12:35", "Cashback Promo Tokopedia", "Rewards Transaksi Elektronik", "Bonus / Hadiah", "OVO Cash", "in", 200000),
  tx(6, "2026-10-22T09:10", "Tagihan Listrik PLN Pascabayar", "ID Pel: 53210984920", "Tempat Tinggal & Utilitas", "BCA Virtual Account", "out", 212500),
  tx(7, "2026-10-22T07:45", "Bensin Shell V-Power", "SPBU Gatot Subroto", "Transportasi", "Kartu Kredit Visa", "out", 250000),
  tx(8, "2026-10-19T19:00", "Tiket Bioskop", "Nonton bareng teman", "Hiburan", "QRIS BCA", "out", 128000),
  tx(9, "2026-10-17T15:30", "Kopi Kenangan Senopati", "Es kopi susu", "Makanan & Minuman", "GoPay", "out", 65000),
  tx(10, "2026-10-14T10:00", "Tol & Parkir", "Perjalanan akhir pekan", "Transportasi", "QRIS BCA", "out", 250000),
  tx(11, "2026-10-12T20:15", "Pesan Antar Sushi", "Makan malam keluarga", "Makanan & Minuman", "GoPay", "out", 500000),
  tx(12, "2026-10-10T16:00", "Belanja Hypermart", "Kebutuhan rumah tangga", "Belanja & Kebutuhan", "Mandiri Debit", "out", 808000),
  tx(13, "2026-10-08T18:00", "Gojek Bulanan", "Paket langganan ojek", "Transportasi", "GoPay", "out", 322000),
  tx(14, "2026-10-06T21:00", "Game Steam", "Pembelian game", "Hiburan", "Kartu Kredit Visa", "out", 500000),
  tx(15, "2026-10-03T08:00", "Langganan Katering Harian", "Katering sebulan", "Makanan & Minuman", "Mandiri Debit", "out", 1800000),
  tx(16, "2026-10-01T09:00", "Sewa Kos Bulanan", "Pembayaran kos Oktober", "Tempat Tinggal & Utilitas", "BCA Prioritas", "out", 1500000),
];

const SEED_TARGET = [
  { id: 1, name: "Maclaren", category: "Kendaraan Impian", desc: "Supercar idaman masa depan.", target: 8000000000, saved: 1500000000, deadline: "2028-12-31", status: "active", main: true },
  { id: 2, name: "HJ 2027", category: "Ibadah", desc: "Persiapan dana ONH Plus Haji 2027.", target: 350000000, saved: 200000000, deadline: "2027-05-15", status: "active" },
  { id: 3, name: "Harley Davidson", category: "Kendaraan Impian", desc: "Moge impian untuk touring.", target: 600000000, saved: 50000000, deadline: "2028-06-30", status: "active" }
];

const SEED_STATE = {
  profile: { name: "Firdaus Hidayat S.,Tr.,Kom.", email: "firdaus.hidayat@email.com", id: "FH-2026-KOM" },
  settings: { currency: "IDR", budget: 10000000, hideBalance: false, notif: { harian: true, batas: true, mingguan: true } },
  categories: ["Makanan & Minuman", "Tempat Tinggal & Utilitas", "Belanja & Kebutuhan", "Transportasi", "Hiburan", "Gaji & Karier", "Bonus / Hadiah", "Kendaraan Impian", "Ibadah"],
  accounts: [
    { name: "Tahapan BCA", short: "BCA", mask: "•••• 4892", badge: "Utama" },
    { name: "Mandiri Tabungan", short: "MDR", mask: "•••• 9104", badge: "" },
    { name: "GoPay & OVO", short: "E-W", mask: "+2 E-Wallet Lainnya", badge: "Aktif" },
  ],
  transactions: SEED_TRANSAKSI,
  goals: SEED_TARGET,
  growthThisMonth: 155000000, // total setoran tabungan bulan ini (Disesuaikan)
};

/* ---------- Penyimpanan ---------- */
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { /* abaikan, pakai data contoh */ }
  return structuredClone(SEED_STATE);
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* mode privat: abaikan */ }
}
let state = loadState();

/* ---------- Fungsi bantu format ---------- */
const MATA_UANG = { IDR: { symbol: "Rp", rate: 1, label: "IDR (Rp)" }, USD: { symbol: "$", rate: 1 / 15600, label: "USD ($)" }, EUR: { symbol: "€", rate: 1 / 16900, label: "EUR (€)" } };

function rupiah(n) {
  const cur = MATA_UANG[state.settings.currency];
  const v = n * cur.rate;
  const text = Math.abs(v).toLocaleString("id-ID", { maximumFractionDigits: cur.rate === 1 ? 0 : 2 });
  return (v < 0 ? "-" : "") + cur.symbol + " " + text;
}

function ringkas(n) {
  if (state.settings.currency !== "IDR") return rupiah(n);
  return "Rp " + (n / 1e6).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Jt";
}

const persen = (a, b) => (b > 0 ? (a / b) * 100 : 0);
const persenText = (n, d = 1) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
const sum = (arr) => arr.reduce((t, x) => t + x, 0);

function tanggalPendek(iso) { const d = new Date(iso); return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; }
function jamText(iso) { const d = new Date(iso); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`; }
function bulanTahun(iso) { const d = new Date(iso); return `${BULAN[d.getMonth()]} ${d.getFullYear()}`; }

function kelompokMetode(nama) {
  if (nama.startsWith("QRIS")) return "QRIS";
  if (nama.includes("BCA")) return "BCA";
  if (nama.includes("Mandiri")) return "Mandiri";
  if (nama.includes("GoPay")) return "GoPay";
  if (nama.includes("OVO")) return "OVO";
  return "Kartu";
}

function warnaKategori(nama, alt = false) {
  const k = KATEGORI_WARNA[nama];
  if (k) return alt ? k.alt : k.color;
  const i = state.categories.indexOf(nama);
  return WARNA_CADANGAN[Math.abs(i) % WARNA_CADANGAN.length];
}

function ikonKategori(nama) { return KATEGORI_IKON[nama] || "sell"; }

function hitungRingkasan() {
  const masuk = state.transactions.filter((t) => t.type === "in");
  const keluar = state.transactions.filter((t) => t.type === "out");
  const totalMasuk = sum(masuk.map((t) => t.amount));
  const totalKeluar = sum(keluar.map((t) => t.amount));
  
  const perKategori = {};
  keluar.forEach((t) => { perKategori[t.category] = (perKategori[t.category] || 0) + t.amount; });
  const kategori = Object.entries(perKategori).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return { masuk, keluar, totalMasuk, totalKeluar, surplus: totalMasuk - totalKeluar, saldo: SALDO_AWAL + totalMasuk - totalKeluar, kategori };
}
