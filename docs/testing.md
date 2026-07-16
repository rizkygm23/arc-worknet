# Arc WorkNet — API Testing & Latency Guide (testing.md)

Dokumen ini menyediakan panduan lengkap untuk melakukan pengujian fungsionalitas dan kinerja (latensi) pada seluruh endpoint API Arc WorkNet. Dokumen ini juga menjelaskan cara mengidentifikasi endpoint mana yang memiliki latensi tinggi (lemot).

---

## 1. Alat Pengujian Kinerja Otomatis

Untuk mempermudah pengujian seluruh API secara cepat dan mengukur waktu responnya (latensi), sebuah script pengujian otomatis telah disediakan di `scripts/test-api-perf.mjs`.

### Cara Menjalankan Script Pengujian:
1. Pastikan Anda memiliki kredensial akun uji coba di berkas `.env` Anda (seperti `CYPRESS_TEST_CLIENT_PRIVATE_KEY` dan `CYPRESS_TEST_WORKER_PRIVATE_KEY`).
2. Jalankan aplikasi Next.js Anda secara lokal (`npm run dev` pada `http://localhost:3000`).
3. Jalankan script pengujian menggunakan Node.js:
   ```bash
   node scripts/test-api-perf.mjs
   ```

Script tersebut akan secara otomatis:
1. Melakukan autentikasi menggunakan private key client & worker yang ada di `.env` (SIWE Flow).
2. Mendapatkan session cookie (`arc_worknet_wallet_session`).
3. Menembak semua endpoint API (baik public, client-gated, maupun worker-gated).
4. Mengukur waktu respon masing-masing dalam satuan milidetik (ms).
5. Menampilkan tabel ringkasan kecepatan dan memberikan rekomendasi endpoint yang terdeteksi lambat (> 300ms).

---

## 2. Daftar Lengkap API Catalog & Cara Pengujian Manual (Curl)

Gunakan perintah `curl` berikut untuk menguji masing-masing endpoint secara manual. Ganti `<token>` dengan nilai session cookie `arc_worknet_wallet_session` yang didapatkan setelah login.

### 2.1 Autentikasi (SIWE) & Bootstrap

#### 1. GET /api/bootstrap
* **Deskripsi:** Mengambil data publik sistem (daftar pekerjaan terbuka, kategori, dll). Menggunakan cache ISR.
* **Autentikasi:** Tidak perlu.
* **Curl:**
  ```bash
  curl -i http://localhost:3000/api/bootstrap
  ```

#### 2. POST /api/wallet/nonce
* **Deskripsi:** Meminta nonce unik untuk verifikasi tanda tangan dompet.
* **Autentikasi:** Tidak perlu.
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -d '{"address": "0xYourWalletAddress", "chainId": 5042002}' \
    http://localhost:3000/api/wallet/nonce
  ```

#### 3. POST /api/wallet/verify
* **Deskripsi:** Memverifikasi pesan SIWE yang telah ditandatangani dan mengembalikan cookie sesi.
* **Autentikasi:** Tidak perlu.
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -d '{"address": "0xYourWalletAddress", "chainId": 5042002, "nonce": "<nonce>", "message": "<exact_message>", "signature": "<signature>", "timezone": "Asia/Jakarta"}' \
    http://localhost:3000/api/wallet/verify
  ```

#### 4. GET /api/bootstrap/private
* **Deskripsi:** Mengambil data spesifik pengguna terautentikasi (lamaran aktif, pekerjaan aktif).
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -H "Cookie: arc_worknet_wallet_session=<token>" \
    http://localhost:3000/api/bootstrap/private
  ```

#### 5. POST /api/wallet/logout
* **Deskripsi:** Menghapus cookie sesi pengguna.
* **Autentikasi:** Tidak perlu.
* **Curl:**
  ```bash
  curl -i -X POST http://localhost:3000/api/wallet/logout
  ```

---

### 2.2 Profil & AI Agent

#### 6. PATCH /api/profile
* **Deskripsi:** Memperbarui peran akun (e.g. `worker` atau `client`).
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X PATCH -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"role": "worker"}' \
    http://localhost:3000/api/profile
  ```

#### 7. POST /api/agents/register
* **Deskripsi:** Mendaftarkan bot/AI agent baru di bawah profil pengguna saat ini.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"ownerProfileId": "<profile_uuid>", "name": "HelperBot", "slug": "helperbot", "description": "Agent pembantu", "capabilities": ["Node.js"], "agentWalletAddress": "0xAgentWalletAddress", "metadataUri": ""}' \
    http://localhost:3000/api/agents/register
  ```

---

### 2.3 Manajemen Pekerjaan (Jobs) & Dokumen Tugas

#### 8. POST /api/jobs
* **Deskripsi:** Membuat lowongan pekerjaan baru (status: `open`).
* **Autentikasi:** Perlu (Cookie, role client).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"clientProfileId": "<client_uuid>", "title": "Audit Smart Contract", "brief": "Analisa celah keamanan...", "acceptanceCriteria": "Laporan PDF bebas celah...", "budgetUsdcUnits": 100000000}' \
    http://localhost:3000/api/jobs
  ```

#### 9. POST /api/jobs/upload-task
* **Deskripsi:** Mengunggah berkas instruksi tugas (PDF/TXT/DOCX).
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Cookie: arc_worknet_wallet_session=<token>" \
    -F "file=@/path/to/task_document.pdf" \
    http://localhost:3000/api/jobs/upload-task
  ```

#### 10. GET /api/jobs/[id]/task-file
* **Deskripsi:** Mengunduh atau mengalihkan ke berkas instruksi tugas yang tersimpan.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -H "Cookie: arc_worknet_wallet_session=<token>" \
    http://localhost:3000/api/jobs/<job_uuid>/task-file
  ```

---

### 2.4 Pendaftaran Pekerjaan (Apply) & Hubungan Kerja

#### 11. POST /api/jobs/[id]/apply
* **Deskripsi:** Mengajukan proposal lamaran untuk suatu pekerjaan.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"applicantProfileId": "<worker_uuid>", "actorType": "human", "pitch": "Saya ahli dalam audit Smart Contract...", "proposedBudgetUsdcUnits": 100000000}' \
    http://localhost:3000/api/jobs/<job_uuid>/apply
  ```

#### 12. POST /api/jobs/[id]/accept-application
* **Deskripsi:** Menerima lamaran pekerja dan menugaskannya ke pekerjaan terkait.
* **Autentikasi:** Perlu (Cookie, role client).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"applicationId": "<application_uuid>"}' \
    http://localhost:3000/api/jobs/<job_uuid>/accept-application
  ```

---

### 2.5 Siklus Hidup On-chain (On-chain Lifecycle Sync)

Endpoint di bawah ini digunakan oleh frontend/agent untuk melakukan sinkronisasi status ke server WorkNet setelah berhasil berinteraksi dengan smart contract di blockchain Arc Testnet.

#### 13. POST /api/jobs/[id]/create-onchain
* **Deskripsi:** Memverifikasi transaksi pembuatan pekerjaan (`createJob`) di blockchain.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"txHash": "0xTransactionHash", "arcJobId": "123", "blockNumber": 456}' \
    http://localhost:3000/api/jobs/<job_uuid>/create-onchain
  ```

#### 14. POST /api/jobs/[id]/set-budget
* **Deskripsi:** Memverifikasi transaksi pengaturan budget pekerjaan di blockchain.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"txHash": "0xTransactionHash", "blockNumber": 456}' \
    http://localhost:3000/api/jobs/<job_uuid>/set-budget
  ```

#### 15. POST /api/jobs/[id]/fund
* **Deskripsi:** Memverifikasi penguncian dana (funding) di escrow blockchain.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"txHash": "0xTransactionHash", "blockNumber": 456}' \
    http://localhost:3000/api/jobs/<job_uuid>/fund
  ```

---

### 2.6 Pengiriman Deliverable (Hasil Kerja)

#### 16. POST /api/jobs/[id]/deliverable-upload-url
* **Deskripsi:** Mendapatkan URL unggah (signed URL) untuk file deliverable secara aman.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"fileName": "deliverable.zip", "contentType": "application/zip"}' \
    http://localhost:3000/api/jobs/<job_uuid>/deliverable-upload-url
  ```

#### 17. GET /api/jobs/[id]/deliverable
* **Deskripsi:** Mengunduh berkas deliverable (terproteksi, hanya untuk client/evaluator).
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -H "Cookie: arc_worknet_wallet_session=<token>" \
    http://localhost:3000/api/jobs/<job_uuid>/deliverable?submissionId=<submission_uuid>
  ```

#### 18. POST /api/jobs/[id]/submit
* **Deskripsi:** Melakukan submit hasil tugas (menyinkronkan hash transaksi submit on-chain dan metadata file).
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"submitterProfileId": "<worker_uuid>", "notes": "Selesai", "deliverableUrl": "https://...", "deliverablePayload": {}, "deliverableHashBytes32": "0xHash", "submitTxHash": "0xTxHash", "blockNumber": 123}' \
    http://localhost:3000/api/jobs/<job_uuid>/submit
  ```

---

### 2.7 Review & Penyelesaian Pekerjaan

#### 19. POST /api/jobs/[id]/complete
* **Deskripsi:** Menyetujui pekerjaan, merilis dana escrow on-chain, dan menyelesaikan pekerjaan.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"reviewerProfileId": "<client_uuid>", "submissionId": "<sub_uuid>", "rating": 5, "reviewText": "Sangat baik!", "reasonHashBytes32": "0xHash", "completeTxHash": "0xTxHash", "reviewTxHash": "0xTxHash", "reviewTxMethod": "complete", "decision": "approve"}' \
    http://localhost:3000/api/jobs/<job_uuid>/complete
  ```

#### 20. POST /api/jobs/[id]/reject
* **Deskripsi:** Menolak hasil pekerjaan atau meminta revisi.
* **Autentikasi:** Perlu (Cookie).
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"reviewerProfileId": "<client_uuid>", "submissionId": "<sub_uuid>", "reasonText": "Perlu perbaikan struktur code", "reasonHashBytes32": "0xHash", "rejectTxHash": "0xTxHash"}' \
    http://localhost:3000/api/jobs/<job_uuid>/reject
  ```

---

### 2.8 Chat, Bookmark & Undangan Khusus

#### 21. GET /api/jobs/[id]/messages
* **Deskripsi:** Mengambil semua chat perihal pekerjaan tertentu.
* **Curl:** `curl -i -H "Cookie: arc_worknet_wallet_session=<token>" http://localhost:3000/api/jobs/<job_uuid>/messages`

#### 22. POST /api/jobs/[id]/messages
* **Deskripsi:** Mengirim pesan chat baru ke dalam thread pekerjaan.
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"body": "Halo, saya sudah mulai mengerjakan."}' \
    http://localhost:3000/api/jobs/<job_uuid>/messages
  ```

#### 23. GET /api/jobs/[id]/invitations & POST /api/jobs/[id]/invitations
* **Deskripsi:** Mengambil atau membuat undangan khusus ke worker.
* **Curl (Get):** `curl -i -H "Cookie: arc_worknet_wallet_session=<token>" http://localhost:3000/api/jobs/<job_uuid>/invitations`
* **Curl (Post):**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"toWorkerProfileId": "<worker_uuid>", "message": "Silahkan join proyek ini"}' \
    http://localhost:3000/api/jobs/<job_uuid>/invitations
  ```

#### 24. GET /api/saved-jobs & POST /api/saved-jobs
* **Deskripsi:** Manajemen bookmark lowongan.
* **Curl (Get):** `curl -i -H "Cookie: arc_worknet_wallet_session=<token>" http://localhost:3000/api/saved-jobs`
* **Curl (Post):**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"jobId": "<job_uuid>"}' \
    http://localhost:3000/api/saved-jobs
  ```

#### 25. PATCH /api/invitations/[id]
* **Deskripsi:** Menolak atau menyetujui undangan pekerjaan.
* **Curl:**
  ```bash
  curl -i -X PATCH -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"status": "accepted"}' \
    http://localhost:3000/api/invitations/<invitation_uuid>
  ```

---

### 2.9 Admin, Webhook & Indeksasi

#### 26. POST /api/indexer/backfill
* **Deskripsi:** Memaksa pemindaian ulang blockchain (indexer backfill). Memerlukan rahasia admin.
* **Headers:** `x-arc-worknet-secret: <ADMIN_API_SECRET>`
* **Curl:**
  ```bash
  curl -i -X POST -H "x-arc-worknet-secret: <ADMIN_API_SECRET>" \
    http://localhost:3000/api/indexer/backfill
  ```

#### 27. POST /api/webhooks/circle/events
* **Deskripsi:** Menerima event webhook dari Circle API. Dilindungi oleh signature rahasia.
* **Headers:** `x-arc-worknet-secret: <CIRCLE_WEBHOOK_SECRET>` (atau Circle Signature header).

#### 28. POST /api/applications/[id]/overlay
* **Deskripsi:** Menyimpan metadata tambahan untuk penarikan/penolakan lamaran.
* **Curl:**
  ```bash
  curl -i -X POST -H "Content-Type: application/json" \
    -H "Cookie: arc_worknet_wallet_session=<token>" \
    -d '{"status": "rejected", "reason": "Sertifikasi kurang lengkap"}' \
    http://localhost:3000/api/applications/<app_uuid>/overlay
  ```

---

## 3. Cara Menganalisis Latensi (Mencari Bagian yang Lemot)

Jika Anda melihat salah satu endpoint di atas memiliki respon waktu di atas **300ms** (atau bahkan **800ms**), berikut adalah komponen-komponen utama yang biasanya memicu perlambatan (bottleneck):

1. **Verifikasi Transaksi Blockchain (EVM RPC):**
   * Endpoint seperti `/api/jobs/[id]/create-onchain`, `/api/jobs/[id]/fund`, `/api/jobs/[id]/submit` memanggil RPC Node blockchain Arc Testnet (`https://rpc.testnet.arc.network`) untuk memverifikasi transaksi (`verifyArcTransaction`).
   * **Mengapa Lambat:** Respon node RPC blockchain publik rentan mengalami delay atau overload. Jika RPC lambat merespon, API route WorkNet juga akan ikut lambat (menunggu hasil verifikasi RPC).

2. **Database Cold Start & Connection Pool (Supabase):**
   * API Route serverless (Vercel/Next.js runtime) akan mematikan instance jika tidak ada trafik (cold start). Ketika trafik baru masuk, serverless harus menginisiasi koneksi baru ke database Supabase Postgres.
   * **Mengapa Lambat:** Inisiasi SSL handshake dan koneksi DB memakan waktu 200-500ms. Solusinya adalah menggunakan Connection Pooling atau database caching.

3. **Invalidation Cache (`invalidateBootstrapCache`):**
   * Setiap kali data diubah (misal: buat pekerjaan baru, submit laporan, chat baru), API memanggil fungsi `invalidateBootstrapCache()`.
   * **Mengapa Lambat:** Jika mekanisme cache pembacaan statis di-revalidate secara synchronous, performa tulis akan sedikit turun.

4. **Rate Limiting Check:**
   * Panggilan ke Redis/Supabase untuk mengecek rate limit dompet pengguna (`walletRateLimit`) menambahkan latensi 20-50ms untuk setiap request.
