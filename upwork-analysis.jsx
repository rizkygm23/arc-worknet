import { useState } from "react";

const tabs = ["Overview", "Client Flow", "Freelancer Flow", "Contract & Payment", "Fitur Teknis"];

const overviewData = {
  title: "Upwork Platform Architecture",
  description: "Platform freelance dua sisi (two-sided marketplace) yang menghubungkan Client dengan Freelancer melalui sistem Job Posting, Proposal, Contract, dan Payment.",
  actors: [
    { icon: "🏢", label: "Client", desc: "Perusahaan / individu yang membutuhkan jasa" },
    { icon: "💻", label: "Freelancer", desc: "Profesional yang menawarkan skill & layanan" },
    { icon: "⚙️", label: "Platform", desc: "Upwork sebagai marketplace & payment escrow" },
  ],
  coreModules: [
    { icon: "📋", name: "Job Management", subs: ["Post Job", "Job Listing", "Search & Filter"] },
    { icon: "📩", name: "Proposal System", subs: ["Submit Proposal", "Cover Letter", "Bid Amount"] },
    { icon: "📄", name: "Contract System", subs: ["Hourly Contract", "Fixed-Price Contract", "Milestone"] },
    { icon: "💰", name: "Payment & Escrow", subs: ["Escrow Fund", "Hourly Billing", "Withdrawal"] },
    { icon: "⭐", name: "Review & Rating", subs: ["Client Review", "Freelancer Review", "Score"] },
    { icon: "💬", name: "Communication", subs: ["Direct Message", "File Sharing", "Video Call"] },
    { icon: "🔒", name: "Trust & Safety", subs: ["Identity Verify", "Report System", "Dispute"] },
    { icon: "👤", name: "Profile System", subs: ["Portfolio", "Skill Badge", "Job Success Score"] },
  ]
};

const clientFlow = [
  {
    phase: "1. Registrasi & Setup",
    color: "#3b82f6",
    steps: [
      { action: "Daftar akun (email / Google / LinkedIn)", detail: "Input nama, email, password" },
      { action: "Verifikasi email", detail: "Konfirmasi link yang dikirim" },
      { action: "Pilih role: Client", detail: "Platform bertanya tujuan: hiring atau freelancing" },
      { action: "Setup Company Profile", detail: "Nama perusahaan, industri, ukuran tim, lokasi" },
      { action: "Payment Method", detail: "Tambah kartu kredit / PayPal sebagai syarat post job" },
    ]
  },
  {
    phase: "2. Post Job",
    color: "#8b5cf6",
    steps: [
      { action: "Tulis Job Title & Description", detail: "Deskripsi detail kebutuhan, scope pekerjaan" },
      { action: "Pilih kategori & skill yang dibutuhkan", detail: "Tag skill seperti React, Python, Graphic Design" },
      { action: "Tentukan tipe contract", detail: "Hourly Rate atau Fixed Price" },
      { action: "Set budget / rate range", detail: "Hourly: $10-$50/hr | Fixed: $500 misal" },
      { action: "Set experience level", detail: "Entry / Intermediate / Expert" },
      { action: "Job visibility: Public atau Invite Only", detail: "Invite only = langsung undang freelancer tertentu" },
      { action: "Publish job posting", detail: "Job tayang di marketplace" },
    ]
  },
  {
    phase: "3. Seleksi Freelancer",
    color: "#06b6d4",
    steps: [
      { action: "Terima notifikasi proposal masuk", detail: "Email + in-app notification" },
      { action: "Review proposal list", detail: "Sortir by: Best Match, Bid Amount, Rating" },
      { action: "Baca cover letter & lihat profil", detail: "Portfolio, JSS (Job Success Score), review sebelumnya" },
      { action: "Shortlist kandidat", detail: "Bookmark / arsip proposal yang menarik" },
      { action: "Interview via chat/video", detail: "Tanya clarifikasi, test task opsional" },
      { action: "Decline atau Offer Contract", detail: "Kirim tawaran kontrak formal ke kandidat terpilih" },
    ]
  },
  {
    phase: "4. Proses Kerja",
    color: "#10b981",
    steps: [
      { action: "Fund Escrow (Fixed Price)", detail: "Dana di-hold Upwork, bukan langsung ke freelancer" },
      { action: "Aktivasi kontrak", detail: "Freelancer mulai kerja setelah kontrak aktif" },
      { action: "Monitor progress", detail: "Hourly: lihat screenshot & activity di Work Diary" },
      { action: "Komunikasi via Messages", detail: "Share file, feedback, revisi" },
      { action: "Review milestone (Fixed)", detail: "Approve/request revision setiap milestone selesai" },
      { action: "Release payment", detail: "Approve work → dana direlease ke freelancer" },
    ]
  },
  {
    phase: "5. Penutupan",
    color: "#f59e0b",
    steps: [
      { action: "Close/end contract", detail: "Klik End Contract dari dashboard" },
      { action: "Beri review & rating ke freelancer", detail: "Bintang 1-5 + written feedback (public)" },
      { action: "Freelancer juga beri review ke client", detail: "Blind review system (sama-sama tidak lihat sebelum submit)" },
      { action: "Invoice & receipt", detail: "Otomatis tersedia di billing history" },
    ]
  },
];

const freelancerFlow = [
  {
    phase: "1. Registrasi & Profil",
    color: "#3b82f6",
    steps: [
      { action: "Daftar akun, pilih role: Freelancer", detail: "Email, Google, atau LinkedIn" },
      { action: "Setup profil lengkap", detail: "Foto, judul profesional (headline), bio, lokasi" },
      { action: "Tambah Skills", detail: "Pilih dari database skill Upwork + level (basic/intermediate/expert)" },
      { action: "Upload Portfolio", detail: "Link project, screenshot, deskripsi pekerjaan" },
      { action: "Set Hourly Rate", detail: "Rate yang ditampilkan di profil" },
      { action: "Identity Verification (opsional tapi boost profil)", detail: "Upload KTP/Paspor, foto selfie" },
      { action: "Skill Test / Certification badge", detail: "Ambil test Upwork atau link sertifikat eksternal" },
    ]
  },
  {
    phase: "2. Cari & Apply Job",
    color: "#8b5cf6",
    steps: [
      { action: "Browse Job Feed", detail: "Berdasarkan skill yang didaftarkan di profil" },
      { action: "Filter job", detail: "By: kategori, budget, contract type, client history, lokasi" },
      { action: "Lihat detail job posting", detail: "Deskripsi, skill dibutuhkan, activity client (verified, pengeluaran total)" },
      { action: "Cek Client Score", detail: "Hire rate, payment verified, total spent, rating dari freelancer lain" },
      { action: "Submit Proposal", detail: "Tulis cover letter, set bid rate, jawab screening questions (jika ada)" },
      { action: "Bayar Connects (kredit)", detail: "1 proposal = 2-6 Connects (tergantung budget job)" },
    ]
  },
  {
    phase: "3. Negosiasi & Contract",
    color: "#06b6d4",
    steps: [
      { action: "Tunggu respons client", detail: "Bisa di-interview dulu via chat/video" },
      { action: "Terima/Tolak tawaran kontrak", detail: "Review terms: rate, deadline, milestone" },
      { action: "Counter-offer (opsional)", detail: "Negosiasi rate atau scope" },
      { action: "Accept contract", detail: "Kontrak aktif, bisa mulai kerja" },
    ]
  },
  {
    phase: "4. Pengerjaan",
    color: "#10b981",
    steps: [
      { action: "Gunakan Upwork Desktop App (Hourly)", detail: "Auto screenshot tiap 10 menit, track activity level" },
      { action: "Log manual hours (jika diizinkan client)", detail: "Untuk Hourly contract" },
      { action: "Submit milestone deliverable (Fixed)", detail: "Upload hasil kerja + catatan" },
      { action: "Komunikasi via Messages", detail: "Update progress, tanya feedback, kirim file" },
      { action: "Request milestone release jika perlu", detail: "Client approve → dana masuk pending balance" },
    ]
  },
  {
    phase: "5. Payment & Withdrawal",
    color: "#f59e0b",
    steps: [
      { action: "Pending earnings menjadi Available", detail: "Hourly: 5 hari setelah billing cycle. Fixed: setelah client approve" },
      { action: "Pilih metode withdrawal", detail: "Direct to Bank, PayPal, Payoneer, Wire Transfer" },
      { action: "Upwork fee dipotong otomatis", detail: "20% (<$500), 10% ($500-$10k), 5% (>$10k) per client" },
      { action: "Review & rating ke client", detail: "Blind review system" },
    ]
  },
];

const contractPayment = [
  {
    title: "Hourly Contract",
    icon: "⏱️",
    color: "#3b82f6",
    flow: [
      "Client set max weekly hours",
      "Freelancer gunakan Upwork Time Tracker",
      "Screenshot otomatis tiap 10 menit sebagai bukti kerja",
      "Setiap Senin: billing cycle dihitung (jam minggu lalu)",
      "Dana otomatis ditarik dari payment method client",
      "5 hari security period → dana available ke freelancer",
      "Client bisa dispute jam jika tidak sesuai (dalam 5 hari)"
    ]
  },
  {
    title: "Fixed-Price Contract",
    icon: "📌",
    color: "#8b5cf6",
    flow: [
      "Client & freelancer sepakati total harga + milestone",
      "Client fund escrow sebelum freelancer mulai",
      "Freelancer kerjakan milestone pertama",
      "Freelancer submit hasil kerja via platform",
      "Client review: Approve (dana release) atau Request Revision",
      "Jika client tidak merespons dalam 14 hari → otomatis release",
      "Lanjut ke milestone berikutnya sampai selesai"
    ]
  },
  {
    title: "Escrow System",
    icon: "🔐",
    color: "#10b981",
    flow: [
      "Upwork menyimpan dana client (bukan langsung ke freelancer)",
      "Dana aman terkunci sampai pekerjaan di-approve",
      "Lindungi freelancer: dana sudah ada sebelum mulai kerja",
      "Lindungi client: dana tidak keluar sebelum kerja selesai",
      "Dispute: Upwork mediasi jika ada konflik",
      "Refund ke client jika freelancer tidak deliver"
    ]
  },
  {
    title: "Dispute Resolution",
    icon: "⚖️",
    color: "#ef4444",
    flow: [
      "Salah satu pihak ajukan dispute",
      "Platform beri waktu 5 hari untuk negosiasi sendiri",
      "Jika tidak selesai → Upwork mediator masuk",
      "Review evidence: pesan, file, screenshot, kontrak",
      "Upwork keluarkan keputusan final",
      "Dana di-release atau di-refund sesuai keputusan"
    ]
  }
];

const technicalFeatures = [
  {
    category: "Auth & User Management",
    color: "#3b82f6",
    features: [
      { name: "OAuth Login", desc: "Google, LinkedIn, Apple" },
      { name: "2FA", desc: "SMS / Authenticator app" },
      { name: "Role-based Access", desc: "Client, Freelancer, Agency, Admin" },
      { name: "KYC / Identity Verification", desc: "Upload dokumen ID, liveness check" },
      { name: "Session Management", desc: "Multi-device login, token refresh" },
    ]
  },
  {
    category: "Job & Proposal System",
    color: "#8b5cf6",
    features: [
      { name: "Job CRUD", desc: "Post, edit, pause, close, repost job" },
      { name: "Smart Job Matching", desc: "Algoritma rekomendasi by skill & history" },
      { name: "Proposal Submission", desc: "Cover letter, bid amount, attachments, Q&A" },
      { name: "Connects System", desc: "Token ekonomi untuk apply job" },
      { name: "Saved Searches", desc: "Alert untuk job baru sesuai filter" },
      { name: "Job Boosting", desc: "Bayar lebih untuk featured listing" },
    ]
  },
  {
    category: "Contract & Work Management",
    color: "#06b6d4",
    features: [
      { name: "Contract Builder", desc: "Define terms, milestones, rate, deadline" },
      { name: "Work Diary", desc: "Screenshot log tiap 10 mnt (Hourly)" },
      { name: "Activity Tracker", desc: "Keyboard & mouse activity level" },
      { name: "Milestone Management", desc: "Create, fund, submit, approve milestone" },
      { name: "File Sharing", desc: "Upload deliverable langsung di kontrak" },
      { name: "Contract Archive", desc: "History semua kontrak (aktif/selesai)" },
    ]
  },
  {
    category: "Payment & Financial",
    color: "#10b981",
    features: [
      { name: "Escrow Engine", desc: "Hold & release dana per milestone" },
      { name: "Billing Cycle", desc: "Weekly automated billing (Hourly)" },
      { name: "Service Fee Calculation", desc: "Sliding scale 5-20% per client lifetime" },
      { name: "Multi-currency", desc: "Support berbagai mata uang, konversi otomatis" },
      { name: "Tax Form Generation", desc: "1099 untuk US freelancer" },
      { name: "Withdrawal Methods", desc: "Bank, PayPal, Payoneer, Wire, Instant Pay" },
      { name: "Bonus Payment", desc: "Client bisa beri tip/bonus di luar kontrak" },
    ]
  },
  {
    category: "Messaging & Communication",
    color: "#f59e0b",
    features: [
      { name: "Real-time Chat", desc: "WebSocket based messaging" },
      { name: "File & Image Sharing", desc: "Attachment di dalam chat" },
      { name: "Video Call Integration", desc: "Built-in video meeting" },
      { name: "Notification System", desc: "In-app, email, push (mobile)" },
      { name: "Message Archive", desc: "Semua pesan tersimpan per kontrak" },
    ]
  },
  {
    category: "Trust, Review & Safety",
    color: "#ef4444",
    features: [
      { name: "Job Success Score (JSS)", desc: "Metric utama reputasi freelancer (0-100%)" },
      { name: "Blind Review System", desc: "Kedua pihak submit review sebelum melihat review pihak lain" },
      { name: "Rising Talent Badge", desc: "Untuk freelancer baru tapi performanya baik" },
      { name: "Top Rated / Plus Badge", desc: "JSS ≥90% + kriteria lain" },
      { name: "Report & Block", desc: "Flag konten/pengguna yang melanggar TOS" },
      { name: "Spam Detection", desc: "Filter proposal & pesan otomatis" },
    ]
  }
];

export default function UpworkAnalysis() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      background: "#0a0e1a",
      minHeight: "100vh",
      color: "#e2e8f0",
      padding: "0"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        borderBottom: "1px solid #1e3a5f",
        padding: "28px 32px 20px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 22, letterSpacing: "-1px", color: "#7dd3fc", fontWeight: 700 }}>◈</span>
          <span style={{ fontSize: 13, color: "#64748b", letterSpacing: "3px", textTransform: "uppercase" }}>Platform Analysis</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
          Upwork Clone Blueprint
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
          Freelance Marketplace · Two-Sided Platform · Client ↔ Freelancer Flow
        </p>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 20, flexWrap: "wrap" }}>
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: "6px 16px",
                borderRadius: 4,
                border: activeTab === i ? "1px solid #3b82f6" : "1px solid #1e3a5f",
                background: activeTab === i ? "#1d4ed8" : "transparent",
                color: activeTab === i ? "#fff" : "#64748b",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "inherit",
                letterSpacing: "0.5px",
                transition: "all 0.15s"
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1000, margin: "0 auto" }}>

        {/* TAB 0: OVERVIEW */}
        {activeTab === 0 && (
          <div>
            <div style={{
              background: "#0f172a",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              padding: 24,
              marginBottom: 24
            }}>
              <div style={{ fontSize: 11, color: "#3b82f6", letterSpacing: "3px", marginBottom: 8 }}>PLATFORM OVERVIEW</div>
              <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.7, fontSize: 14 }}>{overviewData.description}</p>
            </div>

            {/* Actors */}
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "3px", marginBottom: 12 }}>AKTOR UTAMA</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
              {overviewData.actors.map((a, i) => (
                <div key={i} style={{
                  background: "#0f172a",
                  border: "1px solid #1e3a5f",
                  borderRadius: 8,
                  padding: 20,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", marginBottom: 4 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{a.desc}</div>
                </div>
              ))}
            </div>

            {/* Core Modules */}
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "3px", marginBottom: 12 }}>MODUL INTI PLATFORM</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {overviewData.coreModules.map((m, i) => (
                <div key={i} style={{
                  background: "#0f172a",
                  border: "1px solid #1e3a5f",
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start"
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 13, marginBottom: 6 }}>{m.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {m.subs.map((s, j) => (
                        <span key={j} style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          background: "#1e293b",
                          borderRadius: 3,
                          color: "#94a3b8",
                          border: "1px solid #334155"
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: CLIENT FLOW */}
        {activeTab === 1 && (
          <div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "3px", marginBottom: 20 }}>CLIENT JOURNEY — END TO END</div>
            {clientFlow.map((phase, pi) => (
              <div key={pi} style={{ marginBottom: 20 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12
                }}>
                  <div style={{
                    width: 3,
                    height: 32,
                    background: phase.color,
                    borderRadius: 2
                  }}/>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{phase.phase}</div>
                </div>
                <div style={{
                  borderLeft: `1px solid ${phase.color}30`,
                  marginLeft: 6,
                  paddingLeft: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}>
                  {phase.steps.map((s, si) => (
                    <div key={si} style={{
                      background: "#0f172a",
                      border: "1px solid #1e3a5f",
                      borderRadius: 6,
                      padding: "12px 16px",
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start"
                    }}>
                      <span style={{
                        fontSize: 10,
                        color: phase.color,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 2,
                        letterSpacing: "1px"
                      }}>{String(si + 1).padStart(2, "0")}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{s.action}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: FREELANCER FLOW */}
        {activeTab === 2 && (
          <div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "3px", marginBottom: 20 }}>FREELANCER JOURNEY — END TO END</div>
            {freelancerFlow.map((phase, pi) => (
              <div key={pi} style={{ marginBottom: 20 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12
                }}>
                  <div style={{
                    width: 3,
                    height: 32,
                    background: phase.color,
                    borderRadius: 2
                  }}/>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{phase.phase}</div>
                </div>
                <div style={{
                  borderLeft: `1px solid ${phase.color}30`,
                  marginLeft: 6,
                  paddingLeft: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}>
                  {phase.steps.map((s, si) => (
                    <div key={si} style={{
                      background: "#0f172a",
                      border: "1px solid #1e3a5f",
                      borderRadius: 6,
                      padding: "12px 16px",
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start"
                    }}>
                      <span style={{
                        fontSize: 10,
                        color: phase.color,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 2,
                        letterSpacing: "1px"
                      }}>{String(si + 1).padStart(2, "0")}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{s.action}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CONTRACT & PAYMENT */}
        {activeTab === 3 && (
          <div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "3px", marginBottom: 20 }}>CONTRACT & PAYMENT SYSTEM</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {contractPayment.map((block, bi) => (
                <div key={bi} style={{
                  background: "#0f172a",
                  border: `1px solid ${block.color}40`,
                  borderTop: `3px solid ${block.color}`,
                  borderRadius: 8,
                  padding: 20
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>{block.icon}</span>
                    <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>{block.title}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {block.flow.map((step, si) => (
                      <div key={si} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: `${block.color}20`,
                          border: `1px solid ${block.color}60`,
                          color: block.color,
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1
                        }}>{si + 1}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Fee Structure */}
            <div style={{
              marginTop: 20,
              background: "#0f172a",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              padding: 20
            }}>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "3px", marginBottom: 14 }}>SERVICE FEE STRUCTURE (FREELANCER)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { range: "< $500", fee: "20%", desc: "Untuk klien baru / awal kontrak", color: "#ef4444" },
                  { range: "$500 – $10,000", fee: "10%", desc: "Setelah billing kumulatif $500", color: "#f59e0b" },
                  { range: "> $10,000", fee: "5%", desc: "Untuk klien long-term / loyal", color: "#10b981" },
                ].map((tier, i) => (
                  <div key={i} style={{
                    background: "#1e293b",
                    borderRadius: 6,
                    padding: 16,
                    textAlign: "center",
                    border: `1px solid ${tier.color}30`
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: tier.color }}>{tier.fee}</div>
                    <div style={{ fontSize: 11, color: "#f1f5f9", fontWeight: 600, marginTop: 4 }}>{tier.range}</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{tier.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
                * Fee dihitung per client, bukan kumulatif semua klien. Makin lama kerjasama dengan satu klien, makin kecil fee-nya.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TECHNICAL FEATURES */}
        {activeTab === 4 && (
          <div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "3px", marginBottom: 20 }}>FITUR TEKNIS — UNTUK IMPLEMENTASI CLONE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {technicalFeatures.map((cat, ci) => (
                <div key={ci} style={{
                  background: "#0f172a",
                  border: "1px solid #1e3a5f",
                  borderRadius: 8,
                  overflow: "hidden"
                }}>
                  <div style={{
                    background: `${cat.color}15`,
                    borderBottom: `1px solid ${cat.color}30`,
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, letterSpacing: "2px" }}>{cat.category.toUpperCase()}</span>
                  </div>
                  <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {cat.features.map((f, fi) => (
                      <div key={fi} style={{
                        display: "flex",
                        gap: 10,
                        padding: "10px 12px",
                        background: "#1e293b",
                        borderRadius: 6,
                        alignItems: "flex-start"
                      }}>
                        <div style={{ width: 3, height: "100%", minHeight: 14, background: cat.color, borderRadius: 2, flexShrink: 0, marginTop: 3 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
