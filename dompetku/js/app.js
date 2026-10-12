/* =========================================================
   DompetKu - app.js
   Isi: 1) helper DOM & modal  2) navigasi  3) render tiap halaman
        4) form (transaksi, target, pengaturan)  5) event listener & start
   Bergantung pada data.js (state, rupiah, hitungRingkasan, dll).
   ========================================================= */

/* ---------- 1) HELPER DOM, TOAST, MODAL ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const setText = (id, text) => { document.getElementById(id).textContent = text; };
const setHTML = (id, html) => { document.getElementById(id).innerHTML = html; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// Modal tunggal
let modalHandler = null;
function openModal({ title, body, submit = "Simpan", onSubmit, onOpen, hideSubmit = false }) {
  setText("modalTitle", title);
  setHTML("modalBody", body);
  setText("modalSubmit", submit);
  $("#modalSubmit").hidden = hideSubmit;
  modalHandler = onSubmit;
  $("#modal").hidden = false;
  if (onOpen) onOpen($("#modalForm"));
  const first = $("#modalBody input:not([type=radio]), #modalBody select");
  if (first) first.focus();
}

function closeModal() {
  $("#modal").hidden = true; 
  modalHandler = null;
  const form = $("#modalForm"); 
  form.oninput = null; 
  form.onkeydown = null;
}

// Validasi form
function clearErrors(form) { 
  $$(".field", form).forEach((f) => { f.classList.remove("invalid"); $(".error", f).textContent = ""; }); 
}

function showError(form, name, msg) {
  const field = $(`[name="${name}"]`, form).closest(".field");
  if (field) {
    field.classList.add("invalid");
    $(".error", field).textContent = msg;
  }
}

function field(label, name, inputHTML) {
  return `<div class="field"><label for="f-${name}">${label}</label>${inputHTML}<small class="error"></small></div>`;
}

const moneyInput = (name, value = "") => `<input id="f-${name}" name="${name}" inputmode="numeric" autocomplete="off" placeholder="contoh: 150.000" value="${value}" data-money>`;

// FUNGSI SUPER AMAN: Menghapus semua karakter selain angka (kebal terhadap perbedaan spasi/koma/titik di berbagai browser)
function parseMoney(text) {
  if (!text) return NaN;
  const clean = String(text).replace(/\D/g, ""); 
  if (!clean) return NaN;
  return Number(clean);
}

/* ---------- 2) NAVIGASI ---------- */
const PAGES = ["beranda", "transaksi", "tabungan", "laporan", "pengaturan"];
function route() {
  const page = PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : "beranda";
  $$(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
  $$(".menu a").forEach((a) => a.classList.toggle("active", a.dataset.page === page));
  window.scrollTo(0, 0);
}

/* ---------- 3) RENDER HALAMAN ---------- */
function renderAll() {
  renderTopbar(); renderDashboard(); renderTransactions(); renderGoals(); renderReport(); renderSettings();
}

function renderTopbar() {
  setText("topName", state.profile.name);
  setText("heroName", state.profile.name.split(" ")[0]);
}

function donutHTML(items, total, centerValue, centerBottom, alt) {
  let offset = 0;
  const arcs = items.map((it) => {
    const len = persen(it.value, total);
    const svg = `<circle cx="21" cy="21" r="15.915" stroke="${warnaKategori(it.name, alt)}" stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${-offset}"/>`;
    offset += len;
    return svg;
  }).join("");
  return `<svg viewBox="0 0 42 42" role="img" aria-label="Diagram pengeluaran per kategori"><circle cx="21" cy="21" r="15.915" stroke="#eceef0"/>${arcs}</svg>
    <div class="donut-center"><span>TOTAL REALISASI</span><b>${centerValue}</b><small>${centerBottom}</small></div>`;
}

// ----- BERANDA -----
function renderDashboard() {
  const r = hitungRingkasan();
  const sep = { masuk: DATA_TAHUNAN.pemasukan[8], keluar: DATA_TAHUNAN.pengeluaran[8] };
  const growth = persen(r.totalMasuk - sep.masuk, sep.masuk);

  setText("dashBalance", state.settings.hideBalance ? "Rp ••••••••" : rupiah(r.saldo));
  setText("balBadge", r.saldo > 0 ? "Aman" : "Perlu dicek");
  setText("dashIncome", rupiah(r.totalMasuk));
  setText("incTargetLabel", rupiah(TARGET_PEMASUKAN));
  setText("incPct", persenText(persen(r.totalMasuk, TARGET_PEMASUKAN)));
  $("#incBar").style.width = Math.min(100, persen(r.totalMasuk, TARGET_PEMASUKAN)) + "%";
  $("#page-beranda .badge.green").textContent = `↗ ${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%`;

  const pakai = persen(r.totalKeluar, r.totalMasuk);
  setText("dashExpense", rupiah(r.totalKeluar));
  setText("expBadge", `${pakai.toFixed(0)}% Limit`);
  setText("dashLimit", `Batas aman: ${rupiah(r.totalMasuk)}`);
  setText("expPct", persenText(pakai));
  $("#expBar").style.width = Math.min(100, pakai) + "%";

  setText("dashLeft", rupiah(r.surplus));
  setText("leftBadge", `${(100 - pakai).toFixed(0)}% Tersisa`);
  setText("dashDaily", `Daya belanja harian: ~${rupiah(Math.max(0, r.surplus) / SISA_HARI_SIKLUS)}/hari`);

  const top = r.kategori.slice(0, 5);
  setText("allocSub", `Distribusi ${top.length} pos utama pengeluaran bulan Oktober 2026`);
  setHTML("dashDonut", donutHTML(r.kategori, r.totalKeluar, ringkas(r.totalKeluar), "Terkendali", false));
  setHTML("dashLegend", top.map((k) => `
    <li style="--c:${warnaKategori(k.name)}">
      <div><span class="sw"></span><span>${esc(k.name)}</span><span>${rupiah(k.value)}</span><span class="pct">${persen(k.value, r.totalKeluar).toFixed(0)}%</span></div>
      <div class="bar"><i style="width:${persen(k.value, r.totalKeluar)}%"></i></div>
    </li>`).join("") || `<li class="muted">Belum ada pengeluaran.</li>`);

  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  setHTML("recentList", recent.map((t) => `
    <li>
      <div class="tx-ico ${t.type}"><span class="icon">${ikonKategori(t.category)}</span></div>
      <div class="info"><b>${esc(t.title)}</b><span class="muted">${tanggalPendek(t.date)} • ${esc(t.category)}</span></div>
      <div class="amt ${t.type === "in" ? "green-text" : ""}">${t.type === "in" ? "+" : "-"}${rupiah(t.amount)}<small>${esc(t.method.toUpperCase())}</small></div>
    </li>`).join("") || `<li class="muted">Belum ada transaksi.</li>`);

  const g = state.goals.find((x) => x.main && x.status === "active") || state.goals.find((x) => x.status === "active");
  if (!g) { setHTML("mainGoal", `<h2>Target Impian Utama</h2><p class="muted">Belum ada target aktif. Buat target di halaman Target Tabungan.</p>`); return; }
  const p = persen(g.saved, g.target);
  setHTML("mainGoal", `
    <div class="goal-main"><div class="mini-icon mint lg"><span class="icon">laptop_mac</span></div>
      <div><small>TARGET IMPIAN UTAMA</small><h3>${esc(g.name)}</h3></div><span class="badge mint">${p.toFixed(0)}% Tercapai</span></div>
    <div class="goal-box">
      <div class="row"><span><b style="font-size:20px">${rupiah(g.saved)}</b> terkumpul</span><span>Sasaran: <b>${rupiah(g.target)}</b></span></div>
      <div class="bar"><i style="width:${Math.min(100, p)}%"></i></div>
      <div class="row muted"><span>Sisa <b>${rupiah(Math.max(0, g.target - g.saved))}</b> lagi menuju pelunasan</span><span>Estimasi: <b>${labelTenggat(g.deadline, true)}</b></span></div>
    </div>`);
}

// ----- TRANSAKSI -----
const view = { type: "all", method: "Semua", q: "", cat: "Semua", page: 1 };
const PER_PAGE = 7;

function filteredTransactions() {
  const q = view.q.trim().toLowerCase();
  return [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .filter((t) => view.type === "all" || t.type === view.type)
    .filter((t) => view.method === "Semua" || kelompokMetode(t.method) === view.method)
    .filter((t) => view.cat === "Semua" || t.category === view.cat)
    .filter((t) => !q || [t.title, t.note, t.category, t.method].join(" ").toLowerCase().includes(q));
}

function renderTransactions() {
  const r = hitungRingkasan();
  const sep = DATA_TAHUNAN.pengeluaran[8];
  const turun = persen(r.totalKeluar - sep, sep);
  setText("txIncome", rupiah(r.totalMasuk));
  setText("txIncCount", `${r.masuk.length} masuk`);
  setText("txExpense", rupiah(r.totalKeluar));
  setText("txExpCount", `${turun <= 0 ? "▼" : "▲"} ${Math.abs(turun).toFixed(1).replace(".", ",")}% dari bulan lalu • ${r.keluar.length} transaksi`);
  setText("txSurplus", (r.surplus >= 0 ? "+" : "") + rupiah(r.surplus));
  setText("txHealth", r.surplus >= 0 ? "Keuangan Sehat" : "Pengeluaran melebihi pemasukan");
  setText("cntAll", r.masuk.length + r.keluar.length); setText("cntOut", r.keluar.length); setText("cntIn", r.masuk.length);

  setHTML("methodChips", ["Semua", ...METODE_FILTER].map((m) => `<button class="chip ${view.method === m ? "active" : ""}" data-method="${m}">${m}</button>`).join(""));
  const sel = $("#catFilter");
  sel.innerHTML = `<option value="Semua">Semua Kategori</option>` + state.categories.map((c) => `<option ${view.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("");
  $$("#typeTabs button").forEach((b) => b.classList.toggle("active", b.dataset.type === view.type));

  const rows = filteredTransactions();
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  view.page = Math.min(view.page, pages);
  const start = (view.page - 1) * PER_PAGE;
  const slice = rows.slice(start, start + PER_PAGE);

  setHTML("txBody", slice.map((t) => `
    <tr>
      <td><div class="d"><b>${tanggalPendek(t.date)}</b><small>${jamText(t.date)}</small></div></td>
      <td><div class="desc"><div class="tx-ico ${t.type}"><span class="icon">${ikonKategori(t.category)}</span></div><div><b>${esc(t.title)}</b><small>${esc(t.note)}</small></div></div></td>
      <td><span class="tag">${esc(t.category)}</span></td>
      <td><span class="acc" style="--c:${METODE_WARNA[kelompokMetode(t.method)]}"><i></i>${esc(t.method)}</span></td>
      <td>${t.type === "in" ? `<span class="kind in"><span class="icon">arrow_downward</span>Masuk</span>` : `<span class="kind"><span class="icon">arrow_upward</span>Keluar</span>`}</td>
      <td class="nom ${t.type}">${t.type === "in" ? "+" : "-"} ${rupiah(t.amount)}</td>
      <td><button class="icon-btn del" data-del="${t.id}" aria-label="Hapus transaksi"><span class="icon">delete</span></button></td>
    </tr>`).join("") || `<tr><td colspan="7" class="empty">Tidak ada transaksi yang cocok. Coba ubah filter atau kata kunci.</td></tr>`);

  setHTML("pageInfo", rows.length ? `Menampilkan <b>${start + 1} - ${start + slice.length}</b> dari <b>${rows.length}</b> transaksi` : "Menampilkan 0 transaksi");
  let pager = `<button data-page-go="${view.page - 1}" ${view.page === 1 ? "disabled" : ""} aria-label="Sebelumnya"><span class="icon">chevron_left</span></button>`;
  for (let i = 1; i <= pages; i++) pager += `<button class="${i === view.page ? "active" : ""}" data-page-go="${i}">${i}</button>`;
  pager += `<button data-page-go="${view.page + 1}" ${view.page === pages ? "disabled" : ""} aria-label="Berikutnya"><span class="icon">chevron_right</span></button>`;
  setHTML("pager", pager);
}

// ----- TARGET TABUNGAN -----
let goalTab = "active";
const labelTenggat = (iso, estimasi = false) => { const d = new Date(iso); return `${estimasi ? "" : ""}${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`; };
const targetRingkas = (n) => (state.settings.currency === "IDR" ? `Rp ${(n / 1e6).toLocaleString("id-ID")} Jt` : rupiah(n));

function renderGoals() {
  const aktif = state.goals.filter((g) => g.status === "active");
  const totalSaved = sum(aktif.map((g) => g.saved)), totalTarget = sum(aktif.map((g) => g.target));
  const nearest = [...aktif].filter((g) => g.saved < g.target).sort((a, b) => a.deadline.localeCompare(b.deadline))[0];

  setText("shSaved", rupiah(totalSaved));
  setText("shTarget", "/ " + rupiah(totalTarget));
  setText("shPct", `${persenText(persen(totalSaved, totalTarget))} dari Sasaran Global`);
  $("#shBar").style.width = Math.min(100, persen(totalSaved, totalTarget)) + "\%";   setText("shLack", rupiah(Math.max(0, totalTarget - totalSaved)));   setText("shGrowth", "+" + rupiah(state.growthThisMonth));   setText("shNearest", nearest ? labelTenggat(nearest.deadline) : "-");   setText("gcActive", aktif.length);   setText("gcDone", state.goals.filter((g) => g.status === "done").length);   setText("gcArch", state.goals.filter((g) => g.status === "archived").length);   $$("#goalTabs button").forEach((b) => b.classList.toggle("active", b.dataset.status === goalTab));

  const list = state.goals.filter((g) => g.status === goalTab);
  setHTML("goalList", list.map((g) => {
    const p = persen(g.saved, g.target);
    return `
    <article class="card goal-card" style="--c:${p < 40 ? "#565e74" : "#00432f"}">
      <span class="cat">${esc(g.category)}</span><h3>${esc(g.name)}</h3><p class="muted">${esc(g.desc)}</p>
      <div class="goal-box">
        <div class="row"><span class="muted">Terkumpul</span><span class="pct">${persenText(p)}</span></div>
        <div class="nums">${rupiah(g.saved)} <span>/ ${targetRingkas(g.target)}</span></div>
        <div class="bar"><i style="width:${Math.min(100, p)}%"></i></div>
        <div class="foot"><span>Sisa: <b>${rupiah(Math.max(0, g.target - g.saved))}</b></span><b>${labelTenggat(g.deadline)}</b></div>
      </div>
      <button class="btn-gray wide" data-goal="${g.id}">Lihat Rincian</button>
    </article>`;
  }).join("") || `<div class="empty">Belum ada target di bagian ini.</div>`);
}

// ----- LAPORAN -----
let reportRange = "month";
const NAMA_METODE = { BCA: ["BCA", "Debit & Virtual Account"], Mandiri: ["MDR", "Livin' Mandiri"], GoPay: ["GPY", "GoPay Wallet"], OVO: ["OVO", "OVO Cash"], QRIS: ["QR", "Pembayaran QRIS"], Kartu: ["KK", "Kartu Kredit"] };

function renderReport() {
  const r = hitungRingkasan();
  const year = reportRange === "year";
  const budget = state.settings.budget;
  const bulanLalu = DATA_TAHUNAN.pengeluaran[8];

  const income = year ? sum(DATA_TAHUNAN.pemasukan) + r.totalMasuk : r.totalMasuk;
  const expense = year ? sum(DATA_TAHUNAN.pengeluaran) + r.totalKeluar : r.totalKeluar;
  const kuota = year ? budget * 10 : budget;
  let kategori = r.kategori;
  if (year) {
    const merged = { ...DATA_TAHUNAN.kategori };
    r.kategori.forEach((k) => { merged[k.name] = (merged[k.name] || 0) + k.value; });
    kategori = Object.entries(merged).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }

  setText("rpIncome", rupiah(income));
  const growth = persen(r.totalMasuk - DATA_TAHUNAN.pemasukan[8], DATA_TAHUNAN.pemasukan[8]);
  setText("rpIncBadge", year ? "Jan - Okt 2026" : `↗ ${growth >= 0 ? "+" : ""}${growth.toFixed(1).replace(".", ",")}%`);
  setText("rpExpense", rupiah(expense));
  const hemat = year ? kuota - expense : bulanLalu - expense;
  setText("rpSave", `${hemat >= 0 ? "Hemat" : "Boros"} ${rupiah(Math.abs(hemat))}`);
  $("#rpSave").className = "big " + (hemat >= 0 ? "green-text" : "red-text");

  setText("rpPeriod", `Struktur dan proporsi alokasi dana periode ${year ? "Januari - Oktober 2026" : "Oktober 2026"}`);
  setText("rpSectors", `${kategori.length} Sektor`);
  setHTML("rpDonut", donutHTML(kategori, expense - (year ? 0 : 0), ringkas(expense), `${Math.round(persen(expense, kuota))}% Kuota`, true).replace("TOTAL REALISASI", "TOTAL BEBAN"));
  setHTML("rpLegend", kategori.map((k) => `
    <li><i class="sw" style="--c:${warnaKategori(k.name, true)}"></i><span>${esc(k.name)}</span>
    <span class="val">${rupiah(k.value)}<small>${persen(k.value, expense).toFixed(0)}%</small></span></li>`).join("") || `<li class="muted">Belum ada data.</li>`);
  setText("rpQuota", `${rupiah(expense)} / ${rupiah(kuota)} (${persenText(persen(expense, kuota))} Kuota)`);
  setHTML("rpStack", kategori.map((k) => `<i style="--c:${warnaKategori(k.name, true)};width:${persen(k.value, kuota)}%"></i>`).join(""));

  const pembanding = year ? sum(DATA_TAHUNAN.pengeluaran) / 9 : bulanLalu;
  const selisih = persen(r.totalKeluar - pembanding, pembanding);
  const turun = r.totalKeluar <= pembanding;
  setText("trendBadge", `${turun ? "↓ Penurunan" : "↑ Kenaikan"} ${Math.abs(selisih).toFixed(1).replace(".", ",")}%`);
  $("#trendBadge").className = "badge " + (turun ? "mint" : "gray");
  setHTML("trendBox", `
    <div><span class="muted">${year ? "Rata-rata Jan - Sep" : "September 2026"}</span><strong>${rupiah(pembanding)}</strong>
      <div class="bar"><i style="width:${Math.min(100, persen(pembanding, budget))}%;background:#565e74"></i></div><span class="muted">Pagu terpakai ${persenText(persen(pembanding, budget))}</span></div>
    <div class="now"><span class="muted"><i class="dot" style="background:var(--green-800)"></i><b>Oktober 2026</b> <span class="badge green">Bulan Berjalan</span></span><strong class="green-text">${rupiah(r.totalKeluar)}</strong>
      <div class="bar"><i style="width:${Math.min(100, persen(r.totalKeluar, budget))}%"></i></div>
      <span class="${turun ? "green-text" : "red-text"}"><b>${turun ? "Lebih hemat" : "Lebih boros"} ${rupiah(Math.abs(r.totalKeluar - pembanding))}</b></span></div>`);

  const grup = {};
  r.keluar.forEach((t) => { const k = kelompokMetode(t.method); grup[k] = grup[k] || { total: 0, n: 0 }; grup[k].total += t.amount; grup[k].n++; });
  setHTML("methodList", Object.entries(grup).sort((a, b) => b[1].total - a[1].total).slice(0, 4).map(([k, v]) => `
    <li><div class="logo">${NAMA_METODE[k][0]}</div>
      <div class="info"><b>${NAMA_METODE[k][1]}</b><small>${Math.round(persen(v.total, r.totalKeluar))}% dari total pengeluaran</small></div>
      <div class="amt">${rupiah(v.total)}<small>${v.n} Transaksi</small></div></li>`).join("") || `<li class="muted">Belum ada pengeluaran.</li>`);
  $$("#rangeTabs button").forEach((b) => b.classList.toggle("active", b.dataset.range === reportRange));
}

// ----- PENGATURAN -----
function renderSettings() {
  const p = state.profile, s = state.settings;
  setText("pfName", p.name); setText("pfEmail", p.email); setText("pfId", "ID: " + p.id);
  setText("avatarInitial", p.name.trim().charAt(0).toUpperCase());
  setHTML("accountList", state.accounts.map((a) => `
    <li><div class="logo">${esc(a.short)}</div><div class="info"><b>${esc(a.name)}</b><small>${esc(a.mask)}</small></div>
    ${a.badge ? `<span class="badge ${a.badge === "Utama" ? "mint" : "gray"}">${a.badge}</span>` : `<span class="icon" style="color:var(--green-800)">check_circle</span>`}</li>`).join(""));
  setText("curLabel", MATA_UANG[s.currency].label);
  setText("budgetLabel", rupiah(s.budget) + " /bln");
  setText("catCount", state.categories.length + " Aktif");
  const nama = state.categories.slice(0, 5).join(", ");
  setText("catSummary", state.categories.length > 5 ? `${nama}, dan ${state.categories.length - 5} lainnya.` : nama + ".");
  $("#optHide").checked = s.hideBalance;   $$("[data-notif]").forEach((c) => { c.checked = s.notif[c.dataset.notif]; });
}

/* ---------- 4) FORM ---------- */

// --- Catat transaksi ---
function openTransactionForm() {
  const hariIni = "2026-10-26";
  openModal({
    title: "Catat Transaksi", submit: "Simpan",
    body: `
      <div class="seg"><label><input type="radio" name="type" value="out" checked><span>Pengeluaran</span></label><label><input type="radio" name="type" value="in"><span>Pemasukan</span></label></div>
      ${field("Nominal (Rp)", "amount", moneyInput("amount"))}
      ${field("Judul transaksi", "title", `<input id="f-title" name="title" maxlength="60" placeholder="contoh: Makan siang warteg">`)}
      ${field("Catatan (opsional)", "note", `<input id="f-note" name="note" maxlength="80" placeholder="contoh: Nasi, tempe, es teh">`)}
      <div class="field-row">
        ${field("Kategori", "category", `<select id="f-category" name="category">${state.categories.map((c) => `<option>${esc(c)}</option>`).join("")}</select>`)}
        ${field("Metode pembayaran", "method", `<select id="f-method" name="method">${DAFTAR_REKENING.map((m) => `<option>${m}</option>`).join("")}</select>`)}
      </div>
      ${field("Tanggal", "date", `<input id="f-date" type="date" name="date" value="${hariIni}">`)}`,
    onSubmit(form) {
      clearErrors(form);
      const fd = new FormData(form);
      const amount = parseMoney(fd.get("amount"));
      const title = (fd.get("title") || "").trim();
      const date = fd.get("date");
      let ok = true;
      if (!fd.get("amount") || !fd.get("amount").trim()) { showError(form, "amount", "Nominal wajib diisi."); ok = false; }
      else if (Number.isNaN(amount)) { showError(form, "amount", "Gunakan angka saja, contoh: 150.000"); ok = false; }
      else if (amount <= 0) { showError(form, "amount", "Nominal harus lebih dari 0."); ok = false; }
      if (!title) { showError(form, "title", "Judul transaksi wajib diisi."); ok = false; }
      if (!date) { showError(form, "date", "Tanggal wajib diisi."); ok = false; }
      if (!ok) return false;

      const now = new Date();
      const jam = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      state.transactions.unshift({
        id: Date.now(), date: `${date}T${jam}`, title, note: (fd.get("note") || "").trim() || "-",
        category: fd.get("category"), method: fd.get("method"), type: fd.get("type"), amount,
      });
      saveState();
      view.page = 1; view.type = "all"; view.method = "Semua"; view.cat = "Semua"; view.q = "";
      $("#txSearch").value = ""; $("#globalSearch").value = "";
      renderAll();
      toast("Transaksi tersimpan.");
    },
  });
}

// --- Target tabungan: buat baru ---
function openGoalForm() {
  openModal({
    title: "Buat Target Baru", submit: "Simpan target",
    body: `
      ${field("Nama target", "name", `<input id="f-name" name="name" maxlength="40" placeholder="contoh: Dana Liburan Bali">`)}
      ${field("Kategori", "category", `<input id="f-category" name="category" maxlength="30" value="Tabungan Impian">`)}
      <div class="field-row">
        ${field("Jumlah target (Rp)", "target", moneyInput("target"))}
        ${field("Sudah terkumpul (opsional)", "initial", moneyInput("initial"))}
      </div>
      ${field("Estimasi tercapai (bulan)", "deadline", `<input id="f-deadline" type="month" name="deadline" min="2026-11">`)}
      <div class="hint" id="goalHint">Isi jumlah target dan estimasi bulan untuk melihat saran tabungan per bulan.</div>`,
    onOpen(form) {
      const update = () => {
        const fd = new FormData(form);
        const targetVal = fd.get("target") || "";
        const initialVal = fd.get("initial") || "";
        const target = parseMoney(targetVal), initial = initialVal.trim() ? parseMoney(initialVal) : 0;
        const [y, m] = (fd.get("deadline") || "").split("-").map(Number);
        const hint = $("#goalHint");
        if (!Number.isNaN(target) && y && !Number.isNaN(initial)) {
          const bulan = (y - HARI_INI.getFullYear()) * 12 + (m - 1 - HARI_INI.getMonth());
          if (bulan >= 1) { hint.textContent = `Saran: sisihkan ${rupiah(Math.ceil(Math.max(0, target - initial) / bulan))} per bulan selama ${bulan} bulan.`; return; }
        }
        hint.textContent = "Isi jumlah target dan estimasi bulan untuk melihat saran tabungan per bulan.";
      };
      form.oninput = update;
    },
    onSubmit(form) {
      clearErrors(form);
      const fd = new FormData(form);
      const name = (fd.get("name") || "").trim();
      const targetVal = fd.get("target") || "";
      const initialVal = fd.get("initial") || "";
      const deadline = fd.get("deadline");
      const category = (fd.get("category") || "").trim();

      const target = parseMoney(targetVal);
      const initial = initialVal.trim() ? parseMoney(initialVal) : 0;
      let ok = true;

      if (!name) { showError(form, "name", "Nama target wajib diisi."); ok = false; }
      if (!targetVal.trim()) { showError(form, "target", "Jumlah target wajib diisi."); ok = false; }
      else if (Number.isNaN(target) || target <= 0) { showError(form, "target", "Isi dengan angka lebih dari 0."); ok = false; }
      
      if (Number.isNaN(initial)) { showError(form, "initial", "Gunakan angka saja, contoh: 500.000"); ok = false; }
      else if (!Number.isNaN(target) && initial >= target) { showError(form, "initial", "Harus lebih kecil dari jumlah target."); ok = false; }
      
      if (!deadline) { showError(form, "deadline", "Pilih estimasi bulan tercapai."); ok = false; }
      else if (deadline < "2026-11") { showError(form, "deadline", "Pilih bulan setelah Oktober 2026."); ok = false; }
      
      if (!ok) return false;

      state.goals.push({ id: Date.now(), name, category: category || "Tabungan Impian", desc: "Target tabungan baru yang kamu buat sendiri.", target, saved: initial, deadline: deadline + "-28", status: "active" });
      saveState(); goalTab = "active"; renderAll();
      toast("Target baru dibuat.");
    },
  });
}

// --- Target tabungan: rincian + tambah setoran ---
function openGoalDetail(id) {
  const g = state.goals.find((x) => x.id === id);
  if (!g) return;
  const p = persen(g.saved, g.target);
  const aktif = g.status === "active";
  openModal({
    title: g.name, submit: "Tambah setoran", hideSubmit: !aktif,
    body: `
      <p class="muted" style="margin-bottom:14px">${esc(g.category)} • Estimasi ${labelTenggat(g.deadline)}</p>
      <div class="goal-box" style="margin-bottom:16px"><div class="row"><b style="font-size:20px">${rupiah(g.saved)}</b><span class="badge mint">${persenText(p)}</span></div>
        <div class="bar"><i style="width:${Math.min(100, p)}%"></i></div><span class="muted">Sasaran ${rupiah(g.target)} • sisa ${rupiah(Math.max(0, g.target - g.saved))}</span></div>
      ${aktif ? field("Tambah setoran (Rp)", "amount", moneyInput("amount")) : ""}
      <div class="head-actions" style="flex-wrap:wrap">
        ${aktif && !g.main ? `<button type="button" class="btn-gray" id="gMain"><span class="icon">flag</span>Jadikan target utama</button>` : ""}
        <button type="button" class="btn-gray" id="gArchive"><span class="icon">${g.status === "archived" ? "unarchive" : "archive"}</span>${g.status === "archived" ? "Aktifkan lagi" : "Arsipkan"}</button>
        <button type="button" class="btn-gray" id="gDelete"><span class="icon">delete</span>Hapus</button>
      </div>`,
    onOpen(form) {
      const act = (fn, msg) => () => { fn(); saveState(); closeModal(); renderAll(); toast(msg); };
      const btnArchive = $("#gArchive", form);
      if (btnArchive) btnArchive.onclick = act(() => { g.status = g.status === "archived" ? (g.saved >= g.target ? "done" : "active") : "archived"; }, "Status target diperbarui.");
      const btnDelete = $("#gDelete", form);
      if (btnDelete) btnDelete.onclick = () => { if (confirm(`Hapus target "${g.name}"?`)) act(() => { state.goals = state.goals.filter((x) => x.id !== id); }, "Target dihapus.")(); };
      const btnMain = $("#gMain", form);
      if (btnMain) btnMain.onclick = act(() => { state.goals.forEach((x) => (x.main = x.id === id)); }, "Dijadikan target utama.");
    },
    onSubmit(form) {
      clearErrors(form);
      const fd = new FormData(form);
      const amountVal = fd.get("amount");
      if (amountVal == null) return false; 
      
      const amount = parseMoney(amountVal);
      if (!amountVal || !amountVal.toString().trim()) { showError(form, "amount", "Isi nominal setoran."); return false; }
      if (Number.isNaN(amount) || amount <= 0) { showError(form, "amount", "Gunakan angka valid lebih dari 0."); return false; }
      
      // Amankan perhitungan dengan Number() mutlak
      const currentSaved = Number(g.saved) || 0;
      const targetAmount = Number(g.target) || 0;
      const masuk = Math.min(amount, targetAmount - currentSaved);
      
      g.saved = currentSaved + masuk; 
      state.growthThisMonth = (Number(state.growthThisMonth) || 0) + masuk;
      
      const selesai = g.saved >= targetAmount;
      if (selesai) g.status = "done";
      
      saveState(); 
      renderAll();
      toast(selesai ? "Selamat, target tercapai!" : "Setoran berhasil ditambahkan.");
    },
  });
}

// --- Pengaturan ---
function openCurrencyForm() {
  openModal({
    title: "Mata Uang & Format Angka", submit: "Simpan",
    body: field("Mata uang tampilan", "currency", `<select id="f-currency" name="currency">${Object.entries(MATA_UANG).map(([k, v]) => `<option value="${k}" ${state.settings.currency === k ? "selected" : ""}>${v.label}</option>`).join("")}</select>`) + `<p class="muted">Nilai tukar bersifat simulasi (1 USD = Rp 15.600, 1 EUR = Rp 16.900).</p>`,
    onSubmit(form) { 
      const fd = new FormData(form);
      state.settings.currency = fd.get("currency"); saveState(); renderAll(); toast("Mata uang diperbarui."); 
    },
  });
}
function openBudgetForm() {
  openModal({
    title: "Batas Anggaran Bulanan", submit: "Simpan",
    body: field("Batas pengeluaran per bulan (Rp)", "budget", moneyInput("budget", state.settings.budget.toLocaleString("id-ID"))),
    onSubmit(form) {
      clearErrors(form);
      const fd = new FormData(form);
      const v = parseMoney(fd.get("budget"));
      if (Number.isNaN(v) || v <= 0) { showError(form, "budget", "Isi dengan angka lebih dari 0."); return false; }
      state.settings.budget = v; saveState(); renderAll(); toast("Batas anggaran diperbarui.");
    },
  });
}
function openCategoryForm() {
  openModal({
    title: "Kelola Kategori", submit: "Selesai",
    body: `<div class="cat-list" id="catList"></div>${field("Kategori baru", "newcat", `<input id="f-newcat" name="newcat" maxlength="30" placeholder="contoh: Kesehatan">`)}<button type="button" class="btn-gray" id="catAdd"><span class="icon">add</span>Tambah kategori</button>`,
    onOpen(form) {
      const draw = () => {
        setHTML("catList", state.categories.map((c, i) => `<span>${esc(c)}<button type="button" data-rm="${i}" aria-label="Hapus ${esc(c)}"><span class="icon">close</span></button></span>`).join(""));
      };
      draw();
      const btnAdd = $("#catAdd", form);
      if (btnAdd) btnAdd.onclick = () => {
        clearErrors(form);
        const fd = new FormData(form);
        const nama = (fd.get("newcat") || "").trim();
        if (!nama) return showError(form, "newcat", "Nama kategori wajib diisi.");
        if (state.categories.some((c) => c.toLowerCase() === nama.toLowerCase())) return showError(form, "newcat", "Kategori itu sudah ada.");
        state.categories.push(nama); form.querySelector('[name="newcat"]').value = ""; saveState(); draw();
      };
      const list = $("#catList", form);
      if (list) list.onclick = (e) => {
        const btn = e.target.closest("[data-rm]"); if (!btn) return;
        const nama = state.categories[btn.dataset.rm];
        if (state.transactions.some((t) => t.category === nama)) return showError(form, "newcat", `"${nama}" masih dipakai transaksi, jadi belum bisa dihapus.`);
        state.categories.splice(btn.dataset.rm, 1); saveState(); draw();
      };
      form.onkeydown = (e) => { if (e.key === "Enter" && e.target.name === "newcat") { e.preventDefault(); if(btnAdd) btnAdd.click(); } };
    },
    onSubmit() { renderAll(); },
  });
}
function openProfileForm() {
  openModal({
    title: "Edit Profil", submit: "Simpan",
    body: field("Nama lengkap", "name", `<input id="f-name" name="name" maxlength="40" value="${esc(state.profile.name)}">`) + field("Email", "email", `<input id="f-email" name="email" type="email" value="${esc(state.profile.email)}">`),
    onSubmit(form) {
      clearErrors(form);
      const fd = new FormData(form);
      const name = (fd.get("name") || "").trim();
      const email = (fd.get("email") || "").trim();
      let ok = true;
      if (!name) { showError(form, "name", "Nama wajib diisi."); ok = false; }
      if (!/^\S+@\S+\.\S+$/.test(email)) { showError(form, "email", "Format email belum benar."); ok = false; }
      if (!ok) return false;
      state.profile.name = name; state.profile.email = email; saveState(); renderAll(); toast("Profil diperbarui.");
    },
  });
}
function openAccountForm() {
  openModal({
    title: "Tambah Rekening", submit: "Tambah",
    body: field("Nama rekening / dompet", "name", `<input id="f-name" name="name" maxlength="30" placeholder="contoh: Jago Syariah">`) + field("4 digit terakhir", "digits", `<input id="f-digits" name="digits" inputmode="numeric" maxlength="4" placeholder="1234">`),
    onSubmit(form) {
      clearErrors(form);
      const fd = new FormData(form);
      const name = (fd.get("name") || "").trim();
      const digits = (fd.get("digits") || "").trim();
      let ok = true;
      if (!name) { showError(form, "name", "Nama rekening wajib diisi."); ok = false; }
      if (!/^\d{4}$/.test(digits)) { showError(form, "digits", "Isi tepat 4 angka."); ok = false; }
      if (!ok) return false;
      state.accounts.push({ name, short: name.slice(0, 3).toUpperCase(), mask: "•••• " + digits, badge: "" });
      saveState(); renderAll(); toast("Rekening ditambahkan.");
    },
  });
}

/* ---------- 5) EVENT LISTENER & START ---------- */
function setSearch(q) {
  view.q = q; view.page = 1;
  $("#txSearch").value = q; $("#globalSearch").value = q;
  renderTransactions();
}

document.addEventListener("click", (e) => {
  const t = e.target;
  const go = t.closest("[data-go]"); if (go) { location.hash = go.dataset.go; return; }
  const method = t.closest("[data-method]"); if (method) { view.method = method.dataset.method; view.page = 1; renderTransactions(); return; }
  const pg = t.closest("[data-page-go]"); if (pg && !pg.disabled) { view.page = Number(pg.dataset.pageGo); renderTransactions(); return; }
  const del = t.closest("[data-del]");
  if (del && confirm("Hapus transaksi ini?")) { state.transactions = state.transactions.filter((x) => x.id !== Number(del.dataset.del)); saveState(); renderAll(); toast("Transaksi dihapus."); return; }
  const goal = t.closest("[data-goal]"); if (goal) { openGoalDetail(Number(goal.dataset.goal)); return; }
  if (t.id === "modal") closeModal(); // klik area gelap menutup modal
});

$("#typeTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { view.type = b.dataset.type; view.page = 1; renderTransactions(); } });
$("#goalTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { goalTab = b.dataset.status; renderGoals(); } });
$("#rangeTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { reportRange = b.dataset.range; renderReport(); } });
$("#catFilter").addEventListener("change", (e) => { view.cat = e.target.value; view.page = 1; renderTransactions(); });
$("#txSearch").addEventListener("input", (e) => setSearch(e.target.value));
$("#globalSearch").addEventListener("input", (e) => { if (location.hash !== "#transaksi") location.hash = "transaksi"; setSearch(e.target.value); });

// Pemformatan otomatis input yang AMAN terhadap perbedaan browser
$("#modalBody").addEventListener("input", (e) => {
  if (!e.target.matches("[data-money]")) return;
  const clean = e.target.value.replace(/\D/g, ""); // Ambil hanya angkanya saja
  if (clean) {
    e.target.value = Number(clean).toLocaleString("id-ID");
  } else {
    e.target.value = "";
  }
});

$("#modalForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (modalHandler && modalHandler($("#modalForm")) !== false) closeModal();
});

$("#modalClose").addEventListener("click", closeModal);
$("#modalCancel").addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden) closeModal(); });

$("#btnAddTx").addEventListener("click", openTransactionForm);
$("#btnAddGoal").addEventListener("click", openGoalForm);
$("#btnCurrency").addEventListener("click", openCurrencyForm);
$("#btnBudget").addEventListener("click", openBudgetForm);
$("#btnCategories").addEventListener("click", openCategoryForm);
$("#btnEditProfile").addEventListener("click", openProfileForm);
$("#btnAddAccount").addEventListener("click", openAccountForm);
$("#btnAutoDebit").addEventListener("click", () => toast("Pengaturan auto-debit masih simulasi tampilan."));
$("#btnCopyId").addEventListener("click", () => {
  const done = () => toast("ID pengguna disalin.");
  if (navigator.clipboard) navigator.clipboard.writeText(state.profile.id).then(done, () => toast("Gagal menyalin ID."));
  else toast("Browser tidak mendukung salin otomatis.");
});

$("#optHide").addEventListener("change", (e) => { state.settings.hideBalance = e.target.checked; saveState(); renderDashboard(); toast(e.target.checked ? "Saldo disembunyikan di Beranda." : "Saldo ditampilkan."); }); $$("[data-notif]").forEach((c) => c.addEventListener("change", () => { state.settings.notif[c.dataset.notif] = c.checked; saveState(); toast(c.checked ? "Pengingat diaktifkan." : "Pengingat dimatikan."); }));
$("#btnReset").addEventListener("click", () => {
  if (!confirm("Kembalikan semua data ke contoh awal? Perubahanmu akan hilang.")) return;
  state = structuredClone(SEED_STATE); saveState(); renderAll(); toast("Data contoh dikembalikan.");
});

window.addEventListener("hashchange", route);
renderAll();
// --- FITUR DARK MODE ---
const btnTheme = document.getElementById("btnTheme");
const themeIcon = document.getElementById("themeIcon");

// Cek tema yang tersimpan saat halaman dimuat
if (state.settings.theme === "dark") {
  document.body.classList.add("dark-theme");
  if (themeIcon) themeIcon.textContent = "light_mode";
}

// Fungsi ganti tema saat tombol diklik
if (btnTheme) {
  btnTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    if (themeIcon) themeIcon.textContent = isDark ? "light_mode" : "dark_mode";
    
    // Simpan pilihan ke state agar tidak hilang saat di-refresh
    state.settings.theme = isDark ? "dark" : "light";
    saveState();
  });
}
route();
