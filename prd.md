---
title: FreelanceHub — Product Requirements Document
version: 1.0.0
status: Draft — Internal Review
date: 28 Mei 2026
author: Product Team
platform: Web (Desktop & Mobile Responsive)
confidential: true
---

# FreelanceHub
## Product Requirements Document
*Platform Freelance Two-Sided Marketplace*

| **Versi** | 1.0.0 |
| --- | --- |
| **Status** | Draft — Internal Review |
| **Tanggal** | 28 Mei 2026 |
| **Penulis** | Product Team |
| **Platform** | Web (Desktop & Mobile Responsive) |

*Dokumen ini bersifat confidential dan untuk keperluan internal.*

# 1. Executive Summary

FreelanceHub adalah platform marketplace freelance dua sisi (two-sided marketplace) yang mempertemukan Client (perusahaan / individu yang membutuhkan jasa) dengan Freelancer (profesional yang menjual keahlian). Platform ini terinspirasi dari Upwork, dengan fokus pada pengalaman pengguna yang lebih baik dan model bisnis yang adaptif untuk pasar Asia Tenggara.

> **Visi Produk**
> Menjadi platform freelance terpercaya di Asia Tenggara yang menghubungkan talenta digital lokal dengan peluang kerja global, didukung oleh sistem pembayaran aman, kontrak transparan, dan mekanisme reputasi yang adil.

Dokumen PRD ini mendefinisikan seluruh kebutuhan fungsional, non-fungsional, alur pengguna, dan spesifikasi teknis yang diperlukan tim engineering, desainer, dan stakeholder untuk membangun platform ini dari nol.

# 2. Problem Statement

## 2.1 Masalah yang Diselesaikan

### Dari Sisi Client:

- Sulit menemukan freelancer yang terverifikasi dan terpercaya di satu tempat.

- Tidak ada jaminan pekerjaan selesai setelah pembayaran dilakukan (risiko penipuan).

- Proses koordinasi, revisi, dan pembayaran yang tersebar dan tidak terstruktur.

- Tidak ada riwayat kerja dan penilaian freelancer yang terstandarisasi.

### Dari Sisi Freelancer:

- Kesulitan mendapatkan klien pertama tanpa portofolio atau reputasi yang terbangun.

- Risiko tidak dibayar setelah menyelesaikan pekerjaan (ghosting client).

- Tidak ada mekanisme kontrak yang melindungi kedua pihak secara hukum / prosedural.

- Sulitnya mengelola banyak proyek sekaligus dalam satu platform.

## 2.2 Ukuran Pasar

| **Segmen** | **Data** | **Sumber** |
| --- | --- | --- |
| Freelancer global | >1.5 miliar pekerja independen | World Bank, 2024 |
| Pasar gig economy SEA | ~$2.7 triliun | Kearney Report 2024 |
| Pengguna internet Indonesia | >215 juta | APJII 2024 |
| Freelancer Indonesia aktif | ~65 juta orang | BPS 2023 |

# 3. User Personas

## 3.1 Persona Client

| **Atribut** | **Detail** |
| --- | --- |
| Nama (Representatif) | Reza — Marketing Manager, Startup B2B |
| Usia | 28–40 tahun |
| Kebutuhan | Hire freelancer untuk project design, dev, copywriting, atau data analysis |
| Pain Point | Tidak percaya dengan freelancer baru, takut proyek tidak selesai, proses payment ribet |
| Goals | Dapatkan hasil kerja berkualitas tepat waktu dengan budget yang jelas |
| Kebiasaan | Aktif di LinkedIn, terbiasa memakai tools SaaS, budget conscious |
| Frekuensi Pakai | 2–4 kali per bulan posting job, rata-rata 3 kontrak aktif |

## 3.2 Persona Freelancer

| **Atribut** | **Detail** |
| --- | --- |
| Nama (Representatif) | Dira — Full Stack Developer, fresh graduate + 1 tahun pengalaman |
| Usia | 20–35 tahun |
| Keahlian | React, Node.js, Python, atau desainer UI/UX, copywriter, data analyst |
| Pain Point | Susah dapat klien, takut tidak dibayar, tidak ada kontrak formal, harus manage di berbagai platform sekaligus |
| Goals | Dapat penghasilan tambahan / utama yang stabil, bangun reputasi profesional online |
| Kebiasaan | Aktif di media sosial, sudah familiar tools digital, perlu feedback cepat |
| Frekuensi Pakai | Apply 3–10 job per minggu, rata-rata 2–5 kontrak aktif |

## 3.3 Persona Admin Platform

| **Atribut** | **Detail** |
| --- | --- |
| Role | Platform Administrator / Trust & Safety Team |
| Tanggung Jawab | Moderasi konten, verifikasi pengguna, resolusi dispute, monitoring fraud |
| Kebutuhan | Dashboard admin, akses log aktivitas, tools mediasi, bulk action pengguna |

# 4. Goals & ** Success Metrics**

## 4.1 Business Goals

- Mencapai 10.000 pengguna aktif (5.000 client + 5.000 freelancer) dalam 12 bulan pertama.

- GMV (Gross Merchandise Value) sebesar Rp 5 miliar dalam tahun pertama.

- Mencapai profitabilitas operasional dalam 24 bulan.

- Dispute rate di bawah 2% dari total kontrak.

## 4.2 Product KPIs

| **Metrik** | **Target (12 bulan)** | **Cara Ukur** |
| --- | --- | --- |
| User Acquisition (Client) | 5,000 registered clients | Total akun client aktif |
| User Acquisition (Freelancer) | 5,000 registered freelancers | Total akun freelancer aktif |
| Job Posting Rate | 1,000 job/bulan | Job berhasil dipublikasikan |
| Proposal-to-Contract Rate | >20% | Proposal diterima / total proposal |
| Contract Completion Rate | >85% | Kontrak selesai / total kontrak |
| Dispute Rate | <2% | Dispute / total kontrak |
| NPS Score | >40 | Quarterly user survey |
| Time to First Hire | <72 jam | Waktu sejak job posting sampai kontrak aktif |
| Platform Take Rate | 5–20% (sliding) | Revenue dari service fee / GMV |

# 5. Fitur & ** Functional Requirements**

*ℹ️  Prioritas: P0 = MVP wajib ada | P1 = Penting, sprint ke-2 | P2 = Nice to have*

## 5.1 Autentikasi & ** Manajemen Akun**

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| AU-01 | Registrasi Email | Daftar dengan email + password, validasi format email, password min 8 char + kombinasi | P0 |
| AU-02 | OAuth Login | Login via Google, GitHub, LinkedIn | P0 |
| AU-03 | Pemilihan Role | Setelah registrasi, user memilih peran: Client atau Freelancer | P0 |
| AU-04 | Verifikasi Email | Kirim link verifikasi ke email, akun aktif setelah diklik | P0 |
| AU-05 | Forgot Password | Reset password via email, token expires dalam 1 jam | P0 |
| AU-06 | Two-Factor Authentication | OTP via SMS atau TOTP (Google Authenticator) | P1 |
| AU-07 | Identity Verification (KYC) | Upload foto KTP/SIM + selfie, di-review admin atau auto-verify via 3rd party API | P1 |
| AU-08 | Multi-role Account | Satu user bisa punya role Client dan Freelancer sekaligus, switch via toggle | P2 |

## 5.2 Sistem Profil

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| PR-01 | Freelancer Profile | Foto, headline, bio, lokasi, bahasa, hourly rate, availability status | P0 |
| PR-02 | Skill & Expertise | Pilih skill dari database + level (Basic/Intermediate/Expert), max 15 skill | P0 |
| PR-03 | Portfolio | Upload project: judul, deskripsi, gambar/link, tag skill yang dipakai | P0 |
| PR-04 | Work History | Menampilkan riwayat kontrak selesai (yang tidak disembunyikan client) | P0 |
| PR-05 | Client Profile | Nama perusahaan, logo, industri, lokasi, payment verified badge | P0 |
| PR-06 | Job Success Score (JSS) | Skor 0–100% otomatis dihitung dari review, penyelesaian kontrak, dispute | P1 |
| PR-07 | Badge System | Rising Talent, Top Rated (JSS≥90%), Top Rated Plus, Expert Vetted | P1 |
| PR-08 | Skill Assessment | Test online untuk memvalidasi skill, badge tampil di profil | P2 |
| PR-09 | Profile Completeness Indicator | Progress bar yang mendorong user melengkapi profil (boost visibility) | P1 |

## 5.3 Job Posting & ** Discovery**

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| JP-01 | Buat Job Posting | Judul, deskripsi, kategori, skill dibutuhkan, tipe kontrak (Hourly/Fixed), budget, experience level | P0 |
| JP-02 | Job Visibility Setting | Publik (semua bisa apply) atau Private (Invite-only) | P0 |
| JP-03 | Screening Questions | Client bisa tambahkan pertanyaan tambahan yang harus dijawab saat apply | P1 |
| JP-04 | Job Status Management | Status: Draft, Open, Paused, Closed, Filled — semua bisa diubah client | P0 |
| JP-05 | Job Search & Filter | Cari job by keyword, kategori, budget range, tipe kontrak, experience level, lokasi | P0 |
| JP-06 | Smart Job Recommendation | Freelancer melihat job yang relevan berdasarkan skill di profil + history | P1 |
| JP-07 | Saved Job / Alert | Freelancer simpan job, setup notifikasi untuk keyword tertentu | P1 |
| JP-08 | Job Repost | Client bisa repost job lama tanpa isi form dari awal | P1 |
| JP-09 | Featured Job Listing | Client bayar lebih untuk job tampil di posisi teratas hasil pencarian | P2 |

## 5.4 Sistem Proposal

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| PP-01 | Submit Proposal | Cover letter (max 1000 char), bid amount (hourly/fixed), estimasi durasi, attachment opsional | P0 |
| PP-02 | Jawab Screening Questions | Jika ada screening questions dari client, wajib dijawab saat submit proposal | P0 |
| PP-03 | Connects System | Token untuk apply job: 1 job = 2–6 Connects (sesuai budget job). Freelancer beli Connects. | P1 |
| PP-04 | Proposal Management (Freelancer) | Lihat status proposal: Pending, Viewed, Shortlisted, Declined, Accepted | P0 |
| PP-05 | Proposal Review (Client) | Sortir proposal by Best Match / Bid / Rating. Shortlist, archive, decline proposal. | P0 |
| PP-06 | Invite Freelancer | Client undang langsung freelancer tertentu dari hasil search atau dari suggested list | P1 |
| PP-07 | Counter Offer | Client bisa kirim tawaran berbeda dari bid freelancer (rate / scope berbeda) | P1 |
| PP-08 | Proposal Boost | Freelancer bayar Connects ekstra untuk tampil di urutan teratas proposal list | P2 |

## 5.5 Sistem Kontrak

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| CT-01 | Hourly Contract | Client set max weekly hours, rate/jam, start date. Penagihan otomatis setiap minggu. | P0 |
| CT-02 | Fixed-Price Contract | Total harga disepakati, dibagi ke milestones. Setiap milestone punya deadline dan jumlah dana. | P0 |
| CT-03 | Milestone Management | Buat, edit, fund, submit, approve/reject, request revision per milestone. | P0 |
| CT-04 | Contract Terms | Define scope, deadline, deliverable, terms khusus. Bisa ada template standar. | P0 |
| CT-05 | Contract Invitation & Acceptance | Freelancer terima / tolak / counter-offer kontrak yang dikirim client. | P0 |
| CT-06 | Active Contract Dashboard | Tampilkan semua kontrak aktif, status milestone, sisa dana, waktu tersisa. | P0 |
| CT-07 | Pause & Resume Contract | Baik client maupun freelancer bisa pause kontrak dengan persetujuan kedua pihak. | P1 |
| CT-08 | End Contract | Siapapun bisa ajukan end contract, pihak lain notif + konfirmasi. Dana yang belum di-release direfund ke client. | P0 |
| CT-09 | Contract Archive & History | Semua kontrak (aktif/selesai) tersimpan, bisa diunduh sebagai PDF. | P1 |
| CT-10 | Bonus / Tip | Client bisa kirim bonus payment di luar kontrak kapan saja. | P1 |

## 5.6 Sistem Pembayaran & ** Escrow**

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| PM-01 | Escrow Engine | Dana client di-hold di platform sebelum pekerjaan dimulai (Fixed Price). Release otomatis saat approve. | P0 |
| PM-02 | Automated Hourly Billing | Setiap Senin, sistem tarik dana dari payment method client berdasarkan Work Diary minggu lalu. | P0 |
| PM-03 | Payment Method (Client) | Kredit/debit card (Stripe/Midtrans), transfer bank, QRIS, PayPal. | P0 |
| PM-04 | Withdrawal (Freelancer) | Transfer bank lokal, PayPal, Payoneer, transfer instan (fee lebih tinggi). | P0 |
| PM-05 | Service Fee (Sliding Scale) | 20% (< $500), 10% ($500–$10k), 5% (> $10k) per hubungan client-freelancer. | P0 |
| PM-06 | Security Hold Period | Hourly: 5 hari hold sebelum dana available. Fixed: langsung available setelah approve. | P0 |
| PM-07 | Pending & Available Balance | Dashboard earnings freelancer: Pending (dalam hold) vs Available (bisa withdraw). | P0 |
| PM-08 | Tax Document | Generate laporan pendapatan tahunan untuk keperluan pajak. | P2 |
| PM-09 | Invoice Otomatis | Setiap transaksi menghasilkan invoice PDF yang bisa diunduh. | P1 |
| PM-10 | Multi-currency Support | Support IDR, USD, SGD dengan konversi otomatis menggunakan kurs harian. | P1 |

## 5.7 Work Tracking (Hourly)

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| WT-01 | Desktop Time Tracker App | Aplikasi desktop (Win/Mac) yang merekam waktu kerja freelancer secara aktif. | P0 |
| WT-02 | Auto Screenshot | Screenshot layar tiap 10 menit (acak dalam window waktu), disimpan dan bisa dilihat client. | P1 |
| WT-03 | Activity Level Tracking | Rekam level aktivitas keyboard & mouse per interval. Tampil sebagai bar/skor. | P1 |
| WT-04 | Work Diary Dashboard | Client bisa review screenshot dan aktivitas harian/mingguan freelancer per kontrak. | P1 |
| WT-05 | Manual Time Log | Freelancer bisa tambah jam manual jika diizinkan client (tidak ada screenshot). | P1 |
| WT-06 | Dispute Hours | Client bisa dispute jam tertentu dalam 5 hari setelah billing. Dana di-hold sampai resolved. | P0 |

## 5.8 Messaging & ** Komunikasi**

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| MS-01 | Real-time Chat | Pesan teks real-time antar client dan freelancer (WebSocket). Tersedia di dalam kontrak dan di luar (pre-contract). | P0 |
| MS-02 | File & Attachment | Upload dan share file (gambar, PDF, ZIP, dll.) langsung di chat. Max 25MB per file. | P0 |
| MS-03 | Read Receipt | Indikator pesan sudah dibaca. | P1 |
| MS-04 | Video Call | Fitur panggilan video bawaan (WebRTC atau embed Zoom/Google Meet via link generator). | P2 |
| MS-05 | Notifikasi | In-app, email, push notification (mobile) untuk setiap aktivitas penting: pesan baru, proposal, milestone, dll. | P0 |
| MS-06 | Message Archive | Semua percakapan tersimpan dan bisa dicari via search. Tidak bisa dihapus. | P0 |
| MS-07 | Spam Filter | Deteksi dan filter pesan promosi atau phishing otomatis. | P1 |

## 5.9 Review & ** Rating**

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| RV-01 | Post-Contract Review (Client) | Setelah kontrak selesai, client beri rating bintang 1–5 + written feedback ke freelancer. | P0 |
| RV-02 | Post-Contract Review (Freelancer) | Freelancer beri rating ke client setelah kontrak selesai. | P0 |
| RV-03 | Blind Review System | Kedua pihak submit review dahulu sebelum review masing-masing tampil. Cegah bias. | P0 |
| RV-04 | Review Response | Freelancer bisa membalas review publik yang diterima (satu kali per review). | P1 |
| RV-05 | Private Feedback | Selain public review, ada feedback private ke platform (untuk data kualitas). | P1 |
| RV-06 | Job Success Score (JSS) | Skor agregat dari semua review, penyelesaian, dan dispute. Update setiap 2 minggu. | P1 |
| RV-07 | Review Moderation | Admin bisa flag / hapus review yang mengandung konten melanggar kebijakan. | P1 |

## 5.10 Dispute Resolution

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| DR-01 | Raise Dispute | Client atau freelancer bisa ajukan dispute terkait kontrak / pembayaran. | P0 |
| DR-02 | Dispute Negotiation Period | 5 hari window untuk kedua pihak selesaikan sendiri via platform chat. | P0 |
| DR-03 | Admin Mediation | Jika tidak selesai, admin platform masuk sebagai mediator. Review evidence dan keluarkan keputusan. | P0 |
| DR-04 | Evidence Submission | Upload dokumen, screenshot, file sebagai bukti dalam proses dispute. | P0 |
| DR-05 | Dispute Resolution Outcome | Admin release atau refund dana berdasarkan bukti. Keputusan final dan mengikat. | P0 |

## 5.11 Trust & ** Safety**

| **ID** | **Fitur** | **Deskripsi** | **Prioritas** |
| --- | --- | --- | --- |
| TS-01 | Report User / Content | Tombol report di profil, job posting, pesan, dan review. Masuk ke queue moderasi admin. | P0 |
| TS-02 | Account Suspension | Admin bisa suspend (sementara) atau ban (permanen) akun yang melanggar TOS. | P0 |
| TS-03 | Fraud Detection | Sistem rule-based (dan ML di fase lanjut) untuk detect aktivitas mencurigakan. | P1 |
| TS-04 | Payment Verification Badge | Client yang sudah tambah payment method valid dapat badge 'Payment Verified'. | P0 |
| TS-05 | ID Verification Badge | User yang selesai KYC dapat badge terverifikasi di profil. | P1 |
| TS-06 | Block User | User bisa blokir user lain agar tidak bisa menghubungi atau melamar jobnya. | P1 |

# 6. User Flow — Client & ** Freelancer**

## 6.1 Flow Utama: Client Hire Freelancer (Fixed Price)

| **Step** | **Aktor** | **Aksi** | **State Sistem** |
| --- | --- | --- | --- |
| 1 | Client | Post job (judul, deskripsi, skill, fixed price budget) | Job status: OPEN |
| 2 | Freelancer | Temukan job via search/feed, baca detail, submit proposal + cover letter + bid | Proposal status: PENDING |
| 3 | Client | Terima notifikasi proposal masuk, review, shortlist kandidat | Proposal status: SHORTLISTED |
| 4 | Client | Chat/interview freelancer terpilih, kirim offer kontrak | Contract status: OFFERED |
| 5 | Freelancer | Terima notifikasi kontrak, review terms, accept kontrak | Contract status: ACTIVE |
| 6 | Client | Fund escrow untuk milestone pertama | Escrow: FUNDED |
| 7 | Freelancer | Kerjakan milestone, submit deliverable + catatan | Milestone: SUBMITTED |
| 8 | Client | Review hasil, approve (atau request revision) | Milestone: APPROVED / REVISION |
| 9 | System | Dana direlease ke freelancer earnings (pending 5 hari) | Payment: RELEASED |
| 10 | Client + Freelancer | Submit review masing-masing (blind) | Contract: CLOSED |
| 11 | System | Review publik setelah keduanya submit, JSS diupdate | Review: PUBLIC |

## 6.2 Flow Utama: Freelancer Hourly Contract

| **Step** | **Aktor** | **Aksi** | **State Sistem** |
| --- | --- | --- | --- |
| 1 | Client | Post job hourly, tentukan max weekly hours dan rate range | Job status: OPEN |
| 2 | Freelancer | Apply dengan cover letter + proposed hourly rate | Proposal status: PENDING |
| 3 | Client | Offer kontrak, set weekly hour limit dan agreed rate | Contract status: OFFERED |
| 4 | Freelancer | Accept kontrak | Contract status: ACTIVE |
| 5 | Freelancer | Gunakan desktop tracker saat bekerja (screenshot auto tiap 10 menit) | Work Diary: LOGGING |
| 6 | System | Setiap Senin: hitung jam minggu lalu, generate invoice, tarik dari payment method client | Billing: PROCESSING |
| 7 | Client | Terima invoice, bisa review Work Diary dalam 5 hari | Security: HOLD PERIOD |
| 8 | System | Setelah 5 hari: dana pindah ke available balance freelancer | Payment: AVAILABLE |
| 9 | Client/Freelancer | End contract kapan saja (berikan notifikasi 24 jam ke pihak lain) | Contract: ENDED |
| 10 | System | Trigger review dari kedua pihak | Review: PENDING |

# 7. Non-Functional Requirements

## 7.1 Performa

| **Metrik** | **Target** |
| --- | --- |
| Page Load Time (LCP) | < 2.5 detik (Core Web Vitals: Good) |
| API Response Time (P95) | < 300ms untuk endpoint utama |
| API Response Time (P99) | < 1 detik untuk semua endpoint |
| Uptime SLA | >= 99.9% (maksimal downtime ~8.7 jam/tahun) |
| Concurrent Users | Support 5,000 concurrent users pada launch |
| Real-time Messaging Latency | < 200ms untuk pengiriman pesan |
| File Upload Speed | Upload 10MB < 5 detik pada koneksi 10 Mbps |

## 7.2 Keamanan

- Data in transit dienkripsi menggunakan TLS 1.3.

- Data at rest dienkripsi menggunakan AES-256.

- Password di-hash dengan bcrypt (cost factor 12) atau Argon2.

- Rate limiting pada semua endpoint publik (max 100 req/menit per IP).

- OWASP Top 10 dijadikan referensi wajib dalam security review.

- PCI-DSS compliance untuk pemrosesan pembayaran (via certified payment gateway).

- CSRF protection aktif pada semua form.

- SQL Injection & XSS protection wajib di semua input.

- JWT token expiry: access token 15 menit, refresh token 7 hari.

## 7.3 Skalabilitas

- Arsitektur stateless untuk mudah horizontal scaling.

- Database read replica untuk query berat (reporting, search).

- CDN untuk aset statis (gambar, portfolio, lampiran).

- Message queue (Redis/RabbitMQ) untuk proses async: billing, email, notifikasi.

- Caching layer untuk job search dan profil (Redis, TTL 5 menit).

## 7.4 Ketersediaan & ** Pemulihan**

- Auto-failover untuk database (primary-replica setup).

- Backup database harian, point-in-time recovery tersedia.

- Deployment zero-downtime (blue-green atau rolling deployment).

- Health check endpoint untuk setiap service.

## 7.5 Aksesibilitas & ** UX**

- WCAG 2.1 Level AA compliance untuk aksesibilitas.

- Fully responsive: mobile-first design, tested di viewport 320px – 1920px.

- Support browser: Chrome, Firefox, Safari, Edge (2 versi terakhir).

- Mendukung bahasa Indonesia dan Inggris (i18n dari awal).

# 8. Tech Stack Recommendation

| **Layer** | **Teknologi** | **Alasan** |
| --- | --- | --- |
| Frontend | Next.js 14 (React) | SSR/SSG untuk SEO, App Router, ecosystem kuat |
| Styling | Tailwind CSS + shadcn/ui | Kecepatan development, konsistensi desain |
| State Management | Zustand + React Query | Lightweight, server state handling yang baik |
| Backend API | Node.js + Express / NestJS | JavaScript full-stack, ecosystem luas, NestJS untuk struktur besar |
| Real-time | Socket.io (WebSocket) | Messaging real-time, mudah diintegrasikan |
| Database (Primary) | PostgreSQL | Relasional, ACID, kuat untuk transaksi finansial |
| Database (Cache) | Redis | Session, cache, rate limiting, job queue |
| File Storage | AWS S3 / Cloudflare R2 | Skalabel, murah, CDN terintegrasi |
| Payment Gateway | Midtrans (IDR) + Stripe (USD) | Support lokal + internasional |
| Email Service | Resend / AWS SES | Transactional email, deliverability baik |
| Auth | NextAuth.js / custom JWT | OAuth, session management |
| Search | Elasticsearch / Typesense | Full-text search cepat untuk job & freelancer |
| Desktop Tracker | Electron.js | Cross-platform, screenshot, activity tracking |
| Deployment | AWS / GCP + Docker + Kubernetes | Skalabel, managed services tersedia |
| CI/CD | GitHub Actions | Automation testing, deploy pipeline |
| Monitoring | Sentry (error) + Grafana + Prometheus | Observability lengkap |

# 9. Model Monetisasi

## 9.1 Service Fee (Revenue Utama)

Dipotong dari sisi freelancer berdasarkan total billing kumulatif per hubungan client-freelancer:

| **Threshold Billing** | **Service Fee** | **Contoh** |
| --- | --- | --- |
| 0 – $500 (per client baru) | 20% | Freelancer earn $100 → platform ambil $20 |
| $500 – $10,000 | 10% | Freelancer earn $1,000 → platform ambil $100 |
| > $10,000 | 5% | Freelancer earn $5,000 → platform ambil $250 |

## 9.2 Revenue Tambahan

| **Sumber Revenue** | **Model** | **Estimasi Harga** |
| --- | --- | --- |
| Connects (Token Apply) | Freelancer beli paket Connects untuk apply job | Rp 5.000 per 10 Connects |
| Featured Job Listing | Client bayar agar job tampil di posisi teratas | Rp 150.000 per 30 hari |
| Proposal Boost | Freelancer bayar Connects ekstra agar proposal tampil teratas | 5 Connects ekstra per boost |
| Instant Withdrawal | Freelancer withdraw lebih cepat dengan fee tambahan | 1.5% dari jumlah withdraw |
| Membership Plus (Freelancer) | Akses badge, lebih banyak Connects per bulan, analytics | Rp 99.000/bulan |
| Membership Pro (Client) | Post unlimited jobs, akses talent pool premium, priority support | Rp 299.000/bulan |

# 10. MVP Scope & ** Roadmap**

## 10.1 MVP (Phase 1) — Target: 3 Bulan

> **Fokus MVP**
> Validasi core loop: Client post job → Freelancer apply → Contract → Payment → Review. Semua fitur P0 wajib ada di MVP.

- Registrasi & login (email + Google OAuth)

- Profil Client dan Freelancer (basic)

- Post Job dan Browse Job (filter dasar)

- Submit Proposal dan Review Proposal

- Fixed-Price Contract dengan Escrow dasar

- Milestone: create, fund, submit, approve

- Payment: Midtrans (kartu kredit), withdrawal ke bank lokal

- Real-time Messaging (per kontrak)

- Review & Rating (blind review system)

- Notifikasi email

- Admin dashboard dasar (user management, dispute basic)

## 10.2 Phase 2 — Target: 3–6 Bulan Post-Launch

- Hourly Contract + Time Tracker (desktop app)

- Work Diary & screenshot review

- Connects System

- Hourly billing automation (weekly)

- JSS (Job Success Score) calculation

- Badge system (Rising Talent, Top Rated)

- Identity Verification (KYC)

- Expanded payment methods (PayPal, QRIS)

- Dispute Resolution system (full mediasi)

- Skill Assessment

- Mobile-responsive PWA

## 10.3 Phase 3 — Target: 6–12 Bulan Post-Launch

- Mobile App (iOS & Android, React Native)

- Multi-currency & global payment (Stripe + Payoneer)

- Agency Accounts (1 akun untuk tim freelancer)

- Smart matching algorithm (ML-based)

- Featured listing & Proposal Boost

- Membership tier (Freelancer Plus, Client Pro)

- Video call built-in

- Advanced analytics dashboard (client & freelancer)

- API public untuk integrasi third-party

- Tax document generation

## 10.4 Estimasi Timeline MVP

| **Sprint** | **Durasi** | **Deliverable Utama** |
| --- | --- | --- |
| Sprint 1–2 | Minggu 1–4 | Setup infra, auth system, profil dasar, database schema |
| Sprint 3–4 | Minggu 5–8 | Job posting, job search/filter, proposal system |
| Sprint 5–6 | Minggu 9–12 | Fixed contract, escrow, milestone, payment integration |
| Sprint 7–8 | Minggu 13–16 | Messaging (WebSocket), notifikasi, review system |
| Sprint 9–10 | Minggu 17–20 | Admin panel, dispute dasar, bug fixing, QA testing |
| Sprint 11–12 | Minggu 21–24 | Performance optimization, security audit, UAT, soft launch |

# 11. Risks & ** Mitigations**

| **Risiko** | **Dampak** | **Probabilitas** | **Mitigasi** |
| --- | --- | --- | --- |
| Cold start problem (tidak ada user di awal) | Tinggi | Tinggi | Seed dengan komunitas freelancer lokal, partnership dengan institusi pendidikan (kampus IT), launching dengan incentive (gratis Connects) |
| Fraud & penipuan antar pengguna | Tinggi | Sedang | KYC, escrow mandatory, fraud detection rule, limit withdrawal awal |
| Keterlambatan integrasi payment gateway | Tinggi | Sedang | Mulai integrasi di Sprint 1, gunakan sandbox extensive, siapkan fallback (manual transfer) |
| Churn pengguna ke kompetitor (Upwork, Freelancer.id) | Sedang | Tinggi | Fokus niche (pasar lokal, bahasa Indonesia), fee lebih kompetitif, support responsif |
| Regulasi transaksi digital (BI, OJK) | Tinggi | Sedang | Konsultasi legal sejak awal, partner dengan payment gateway berlisensi, tidak pegang dana user langsung |
| Skalabilitas teknis saat viral | Sedang | Rendah | Auto-scaling dari awal, load test sebelum launch |
| Desktop tracker tidak diadopsi freelancer | Sedang | Sedang | Manual time log sebagai fallback, UX semudah mungkin, edukasi pengguna |

# 12. Open Questions

- Apakah kita perlu lisensi PSP (Payment Service Provider) dari OJK, atau cukup memakai payment gateway berlisensi (Midtrans/Xendit)?

- Apakah MVP akan mendukung bahasa Indonesia saja, atau bilingual Indonesia + Inggris dari awal?

- Berapa target market awal: nasional (Indonesia) atau langsung SEA?

- Apakah ada fitur agency (1 akun untuk tim freelancer) di Phase 1, atau difokuskan ke individual dulu?

- Model escrow: dana disimpan di rekening platform, atau menggunakan virtual account per kontrak via bank partner?

- Apakah desktop tracker (Electron) menjadi P0 untuk Hourly Contract, atau MVP cukup dengan manual time log dulu?

- Bagaimana strategi user acquisition awal (growth hacking, partnership, paid ads)?

# 13. Appendix

## 13.1 Glosarium

| **Term** | **Definisi** |
| --- | --- |
| GMV | Gross Merchandise Value — total nilai transaksi yang diproses platform |
| JSS | Job Success Score — skor reputasi freelancer (0–100%) |
| Escrow | Mekanisme pihak ketiga (platform) menyimpan dana sampai pekerjaan disetujui |
| Connects | Token (kredit) yang dipakai freelancer untuk mengajukan proposal |
| KYC | Know Your Customer — proses verifikasi identitas pengguna |
| Milestone | Tahapan kerja dalam Fixed-Price contract yang masing-masing punya nilai dan deadline |
| Work Diary | Log aktivitas kerja freelancer (jam, screenshot) yang bisa dilihat client |
| Blind Review | Sistem review di mana kedua pihak submit sebelum melihat review pihak lain |
| TWA | Two-sided marketplace — platform yang melayani dua kelompok pengguna yang saling membutuhkan |
| SLA | Service Level Agreement — komitmen performa platform yang terukur |
| LCP | Largest Contentful Paint — metrik performa loading halaman web |

## 13.2 Referensi

- Upwork Platform Documentation & Help Center

- Freelancer.com Product Blog

- OWASP Top 10 Security Risks (2023)

- PCI-DSS Compliance Guide

- Google Core Web Vitals Documentation

- WCAG 2.1 Accessibility Guidelines

- OJK Peraturan Terkait PJAP (Penyelenggara Jasa Pembayaran)

- Bank Indonesia Peraturan Sistem Pembayaran

*— End of Document —*