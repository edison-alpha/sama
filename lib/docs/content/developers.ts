import { code, h2, h3, note, ol, p, table, tip, ul, warn, t, type DocPage } from "../types";

export const architecture: DocPage = {
  slug: "developers/architecture",
  title: t("Architecture", "Arsitektur"),
  description: t("How the web app, API, shared packages, settlement contract and verifier fit together.", "Bagaimana aplikasi web, API, paket bersama, kontrak settlement, dan verifier saling terhubung."),
  blocks: [
    h2("overview", "Overview", "Gambaran umum"),
    code("text", `
 Browser ──── sama-frontend (Next.js 16, React 19)
   │             │  fetch, cookie session
   │             ▼
   │          sama-backend (Elysia on Bun) ── Postgres / PGlite
   │             │  @sama/* packages: assets · oracle · portfolio · matcher
   │             │                     settlement · verifier · residual · pancakeswap · market
   │             ├── BNB Chain RPC (executor)      balances, snapshot, simulation
   │             ├── BNB Chain RPC (verifier)      a different provider
   │             ├── Binance Web3 API              stock prices (BNB from the spot ticker)
   │             ├── CoinGecko on-chain API        token charts, size and latest trades
   │             └── AI provider (optional)        assistant, target from a sentence
   │
   └── Privy wallet ── EIP-712 signatures, approve, settle() ──▶ SamaSettlement (BSC 56)`, "architecture"),
    h2("repos", "Repositories", "Repositori"),
    table(
      [["Folder", "Folder"], ["What lives there", "Isinya"]],
      [
        ["`sama-frontend`", ["Next.js app: landing, docs, onboarding, portfolio, token pages, Circles, rounds, activity, the AI assistant. Talks to the API or runs fully in the browser in mock mode", "Aplikasi Next.js: landing, docs, onboarding, portofolio, halaman token, Circle, round, aktivitas, asisten AI. Berbicara ke API atau berjalan penuh di browser dalam mode mock"]],
        ["`sama-backend`", ["Elysia API on Bun: sessions, targets, Circles, the round state machine, leftovers, proof, market data, the assistant and its saved chats", "API Elysia di Bun: sesi, target, Circle, state machine round, sisa, bukti, data pasar, asisten dan riwayat chat-nya"]],
        ["`sama-packages`", ["Domain logic as `@sama/*` packages, imported by the backend without a build step", "Logika domain sebagai paket `@sama/*`, diimpor backend tanpa langkah build"]],
        ["`sama-contract`", ["`SamaSettlement.sol`, Foundry tests and the deploy script", "`SamaSettlement.sol`, test Foundry, dan script deploy"]],
      ],
    ),
    h2("packages", "Packages", "Paket"),
    table(
      [["Package", "Paket"], ["Responsibility", "Tanggung jawab"]],
      [
        ["`@sama/shared`", ["Chain config, fixed-point math, canonical JSON, logging, deployments", "Konfigurasi chain, matematika fixed-point, JSON kanonik, logging, deployment"]],
        ["`@sama/assets`", ["Allowlist (bStocks, WBNB, USDT), on-chain checks, BEP-8056 multipliers, market calendar, TWAP reads", "Allowlist (bStocks, WBNB, USDT), cek on-chain, pengali BEP-8056, kalender pasar, pembacaan TWAP"]],
        ["`@sama/binance`, `@sama/oracle`", ["Stock prices and the per-round snapshot with cross-checks", "Harga saham dan snapshot per round dengan cek silang"]],
        ["`@sama/portfolio`", ["Holdings, targets, rebalance deltas, intent limits", "Kepemilikan, target, delta rebalance, batas intent"]],
        ["`@sama/matcher`", ["The production solver (`sama-mmcc-1`)", "Solver produksi (`sama-mmcc-1`)"]],
        ["`@sama/reference-matcher`", ["Independent solvers that check the matcher in tests", "Solver independen yang menguji matcher"]],
        ["`@sama/circles`", ["Membership, assets and round scheduling", "Keanggotaan, aset, dan penjadwalan round"]],
        ["`@sama/settlement`", ["EIP-712 types, canonical plans, preflight, generated contract bindings", "Tipe EIP-712, rencana kanonik, preflight, binding kontrak hasil generate"]],
        ["`@sama/verifier`", ["Settlement verification from chain data only", "Verifikasi settlement hanya dari data chain"]],
        ["`@sama/residual`, `@sama/pancakeswap`", ["Leftover recommendations and PancakeSwap quotes and swaps", "Rekomendasi sisa serta quote dan swap PancakeSwap"]],
        ["`@sama/agent`", ["Optional natural-language target interpreter; code resolves every number", "Penerjemah target bahasa alami (opsional); kode yang menentukan setiap angka"]],
        ["`@sama/market`", ["Token charts, market cap, volume, liquidity and latest trades from CoinGecko's on-chain API, behind one shared cache (TTL, merged requests, a cooldown after 429, the last good answer when the source fails)", "Chart token, kapitalisasi pasar, volume, likuiditas, dan trade terbaru dari API on-chain CoinGecko, di balik satu cache bersama (TTL, request digabung, jeda setelah 429, jawaban terakhir yang valid saat sumber gagal)"]],
        ["`@sama/tokens`", ["PancakeSwap's token list: names and logos for wallet tokens outside the allowlist", "Daftar token PancakeSwap: nama dan logo untuk token di wallet yang di luar allowlist"]],
        ["`@sama/api-types`", ["Wire types shared by the API and the frontend", "Tipe data yang dipakai bersama API dan frontend"]],
      ],
    ),
    h2("round-flow", "A round, end to end", "Satu round dari awal sampai akhir"),
    ol(
      ["`POST /api/circles/:id/round` opens a round with a price snapshot pinned to one block.", "`POST /api/circles/:id/round` membuka round dengan snapshot harga yang dikunci pada satu blok."],
      ["Each member fetches `GET /api/rounds/:id/intent`, signs the EIP-712 payload, and posts it back.", "Setiap anggota mengambil `GET /api/rounds/:id/intent`, menandatangani payload EIP-712, lalu mengirimnya kembali."],
      ["At the freeze time the background loop runs the matcher and builds a canonical plan.", "Saat waktu beku, loop latar menjalankan matcher dan menyusun rencana kanonik."],
      ["Participants fetch `GET /api/rounds/:id/approval`, sign the plan and send exact `approve` transactions.", "Peserta mengambil `GET /api/rounds/:id/approval`, menandatangani rencana, dan mengirim transaksi `approve` dengan jumlah persis."],
      ["Any participant fetches `GET /api/rounds/:id/settle`, sends `settle()`, and reports the hash with `POST`.", "Peserta mana pun mengambil `GET /api/rounds/:id/settle`, mengirim `settle()`, lalu melaporkan hash-nya dengan `POST`."],
      ["The API checks the hash against the plan, waits for the receipt, runs the verifier on a second RPC and records the result.", "API mengecek hash terhadap rencana, menunggu receipt, menjalankan verifier di RPC kedua, lalu mencatat hasilnya."],
    ),
    note(
      "A background loop advances rounds nobody is looking at (freezing, expiring, verifying), so a round never depends on a browser staying open.",
      "Loop latar menggerakkan round yang tidak sedang dibuka siapa pun (membekukan, mengakhiri, memverifikasi), jadi round tidak pernah bergantung pada browser yang tetap terbuka.",
    ),
    h2("data", "Data", "Data"),
    p(
      "Postgres holds offchain state only: users, targets, Circles, memberships, invites, rounds and their history, intents, approvals, leftover decisions and activity. Balances, prices and settlements are always re-read from BNB Chain. Local development uses PGlite with the same schema.",
      "Postgres hanya menyimpan state offchain: pengguna, target, Circle, keanggotaan, undangan, round dan riwayatnya, intent, persetujuan, keputusan sisa, dan aktivitas. Saldo, harga, dan settlement selalu dibaca ulang dari BNB Chain. Pengembangan lokal memakai PGlite dengan skema yang sama.",
    ),
  ],
};

export const api: DocPage = {
  slug: "developers/api",
  title: t("API reference", "Referensi API"),
  description: t("Every route the Sama app uses. JSON in and out, cookie sessions, bigints as tagged strings.", "Semua route yang dipakai aplikasi Sama. JSON masuk dan keluar, sesi cookie, bigint sebagai string bertanda."),
  blocks: [
    h2("conventions", "Conventions", "Konvensi"),
    ul(
      ["Base URL is `NEXT_PUBLIC_SAMA_API_URL`. Send `credentials: \"include\"` so the `sama_session` cookie travels.", "Base URL adalah `NEXT_PUBLIC_SAMA_API_URL`. Kirim `credentials: \"include\"` agar cookie `sama_session` ikut terkirim."],
      ["Bigints travel as `{\"$bigint\": \"<decimal>\"}` in both directions.", "Bigint dikirim sebagai `{\"$bigint\": \"<desimal>\"}` di kedua arah."],
      ["Every response carries an `x-request-id` header. Errors are `{ error, requestId }`.", "Setiap response membawa header `x-request-id`. Error berbentuk `{ error, requestId }`."],
      ["State-changing requests from an origin outside `SAMA_ALLOWED_ORIGINS` get `403`.", "Request yang mengubah state dari origin di luar `SAMA_ALLOWED_ORIGINS` mendapat `403`."],
    ),
    table(
      [["Status", "Status"], ["Meaning", "Arti"]],
      [
        ["400", ["Invalid input (for example weights that don't add up to 100%)", "Input tidak valid (misalnya bobot yang totalnya bukan 100%)"]],
        ["401", ["No session, or the sign-in token didn't verify", "Tidak ada sesi, atau token sign-in gagal diverifikasi"]],
        ["404", ["Not found, or not visible to you", "Tidak ditemukan, atau tidak terlihat olehmu"]],
        ["409", ["A round or Circle rule blocks the step (wrong state, not a member)", "Aturan round atau Circle menghalangi langkah ini (state salah, bukan anggota)"]],
        ["502 / 503", ["PancakeSwap, Binance, CoinGecko, the database or the RPC is unavailable; retry shortly", "PancakeSwap, Binance, CoinGecko, database, atau RPC tidak tersedia; coba lagi sebentar"]],
      ],
    ),
    h2("session", "Session", "Sesi"),
    table(
      [["Method", "Method"], ["Path", "Path"], ["Description", "Deskripsi"]],
      [
        ["POST", "`/api/session`", ["Exchange a Privy access token `{ token, address }` for the session cookie", "Tukar token akses Privy `{ token, address }` dengan cookie sesi"]],
        ["GET", "`/api/session`", ["The signed-in address, or `null`", "Alamat yang sedang masuk, atau `null`"]],
        ["DELETE", "`/api/session`", ["Sign out", "Keluar"]],
        ["POST", "`/api/session/dev`", ["Signed-message login for scripts and tests. Only with `SAMA_DEV_AUTH=1`, never in production", "Login lewat pesan bertanda tangan untuk script dan test. Hanya dengan `SAMA_DEV_AUTH=1`, tidak pernah di produksi"]],
      ],
    ),
    h2("public", "Public", "Publik"),
    table(
      [["Method", "Method"], ["Path", "Path"], ["Description", "Deskripsi"]],
      [
        ["GET", "`/api/health`", ["Database, chain, settlement contract and configured providers", "Database, chain, kontrak settlement, dan penyedia yang dikonfigurasi"]],
        ["GET", "`/api/assets`", ["The allowlist with prices, tiers and disclosures", "Allowlist beserta harga, tier, dan disclosure"]],
        ["GET", "`/api/proof`", ["Contract deployment and every settled round", "Deployment kontrak dan setiap round yang sudah diselesaikan"]],
        ["GET", "`/api/invites/:code`", ["Which Circle an invite opens, and whether it was used", "Circle yang dibuka sebuah undangan, dan apakah sudah dipakai"]],
        ["GET", "`/api/market/:token`", ["Price, market cap, FDV, 24-hour volume, liquidity and the pool behind them, for a listed token by address or symbol (`MarketStats`). Any other token is a 404", "Harga, kapitalisasi pasar, FDV, volume 24 jam, likuiditas, dan pool di baliknya, untuk token terdaftar berdasarkan alamat atau simbol (`MarketStats`). Token lain dijawab 404"]],
        ["GET", "`/api/market/:token/history?range=`", ["`{ points }`: the token's price over `1H`, `1D` (default), `1W`, `1M`, `1Y` or `ALL`, oldest first", "`{ points }`: harga token selama `1H`, `1D` (default), `1W`, `1M`, `1Y`, atau `ALL`, dari yang terlama"]],
        ["GET", "`/api/market/:token/trades`", ["`{ trades }`: the last trades in the token's pool from every wallet, newest first (up to 300, past 24 hours)", "`{ trades }`: trade terakhir di pool token dari semua wallet, terbaru dulu (maksimal 300, 24 jam terakhir)"]],
        ["GET", "`/api/agent`", ["`{ enabled }`: whether an AI provider is configured; the app hides the assistant when it is not", "`{ enabled }`: apakah penyedia AI dikonfigurasi; aplikasi menyembunyikan asisten bila tidak"]],
      ],
    ),
    h2("me", "Your account", "Akunmu"),
    table(
      [["Method", "Method"], ["Path", "Path"], ["Description", "Deskripsi"]],
      [
        ["GET", "`/api/me/home`", ["Portfolio, target, drift, Circles, rounds waiting on you, recent activity", "Portofolio, target, drift, Circle, round yang menunggumu, aktivitas terbaru"]],
        ["GET", "`/api/me/portfolio`", ["Live balances and values, plus your saved target", "Saldo dan nilai live, plus target tersimpan"]],
        ["GET", "`/api/me/portfolio/history?range=`", ["Value over time: `1H`, `1D`, `1W`, `1M`, `1Y`, `ALL`", "Nilai dari waktu ke waktu: `1H`, `1D`, `1W`, `1M`, `1Y`, `ALL`"]],
        ["POST", "`/api/me/target/preview`", ["Check a target against your wallet without saving", "Cek target terhadap wallet tanpa menyimpan"]],
        ["GET / POST", "`/api/me/target`", ["Read or save your target", "Baca atau simpan target"]],
        ["POST", "`/api/me/target/suggest`", ["`{ instruction }` in words to percent weights for the editor; nothing is saved", "`{ instruction }` berupa kalimat menjadi bobot persen untuk editor; tidak ada yang disimpan"]],
        ["POST", "`/api/me/assistant`", ["One assistant message `{ chatId?, message }`. Returns `{ chatId, title, reply }` where `reply` has text, result blocks and actions the user may confirm. A missing `chatId` starts a new saved chat", "Satu pesan ke asisten `{ chatId?, message }`. Mengembalikan `{ chatId, title, reply }` dengan `reply` berisi teks, blok hasil, dan aksi yang bisa dikonfirmasi pengguna. Tanpa `chatId`, chat baru dibuat dan disimpan"]],
        ["GET / DELETE", "`/api/me/chats`", ["List your saved chats / delete all of them", "Daftar chat tersimpan / hapus semuanya"]],
        ["GET / DELETE", "`/api/me/chats/:id`", ["One chat with its messages / delete it", "Satu chat beserta pesannya / hapus chat itu"]],
        ["GET / POST", "`/api/me/onboarding`", ["Whether onboarding is done / set it with `{ done }`", "Apakah onboarding sudah selesai / atur dengan `{ done }`"]],
        ["GET / POST", "`/api/me/settings`", ["Notification and default preferences", "Preferensi notifikasi dan default"]],
        ["GET", "`/api/me/activity`", ["Paged history: `limit` (30), `cursor`, `group`, `range`", "Riwayat per halaman: `limit` (30), `cursor`, `group`, `range`"]],
        ["POST", "`/api/me/transfers/sync`", ["Scan the chain now so a transfer you just sent shows in Activity", "Pindai chain sekarang agar transfer yang baru dikirim muncul di Aktivitas"]],
      ],
    ),
    h2("circles", "Circles", "Circle"),
    table(
      [["Method", "Method"], ["Path", "Path"], ["Description", "Deskripsi"]],
      [
        ["GET / POST", "`/api/circles`", ["Circles you can see / create one", "Circle yang bisa kamu lihat / buat Circle"]],
        ["GET", "`/api/circles/:id`", ["One Circle with its rounds and your role", "Satu Circle beserta round dan peranmu"]],
        ["POST", "`/api/circles/:id/join`", ["Join, with `{ invite }` when the Circle needs one", "Gabung, dengan `{ invite }` bila Circle membutuhkannya"]],
        ["POST", "`/api/circles/:id/invite`", ["Create a single-use invite link (organizer)", "Buat link undangan sekali pakai (organizer)"]],
        ["POST", "`/api/circles/:id/round`", ["The live round, opening one with a fresh snapshot if none is running", "Round yang sedang berjalan, atau membuka round baru dengan snapshot segar"]],
      ],
    ),
    h2("rounds", "Rounds", "Round"),
    table(
      [["Method", "Method"], ["Path", "Path"], ["Description", "Deskripsi"]],
      [
        ["GET", "`/api/rounds/:id`", ["The round from your point of view (`RoundView`)", "Round dari sudut pandangmu (`RoundView`)"]],
        ["GET / POST", "`/api/rounds/:id/intent`", ["Build your intent and its EIP-712 payload / submit `{ intent, signature }`", "Susun intent dan payload EIP-712 / kirim `{ intent, signature }`"]],
        ["POST", "`/api/rounds/:id/close`", ["Organizer closes collection early and matches", "Organizer menutup pengumpulan lebih awal dan mencocokkan"]],
        ["GET / POST", "`/api/rounds/:id/approval`", ["Plan approval payload and allowances / submit `{ signature }`", "Payload persetujuan rencana dan allowance / kirim `{ signature }`"]],
        ["GET / POST", "`/api/rounds/:id/settle`", ["The `settle()` call to send / report `{ txHash }`", "Panggilan `settle()` untuk dikirim / laporkan `{ txHash }`"]],
        ["POST", "`/api/rounds/:id/residual`", ["Decide leftovers: `{ choice: \"CARRY_FORWARD\" | \"CANCEL\" }`", "Putuskan sisa: `{ choice: \"CARRY_FORWARD\" | \"CANCEL\" }`"]],
        ["POST", "`/api/rounds/:id/residual/swap`", ["Swap leftovers in three steps: `prepare`, `build`, `record`", "Swap sisa dalam tiga langkah: `prepare`, `build`, `record`"]],
      ],
    ),
    h2("example", "Example: join a round", "Contoh: ikut round"),
    code("ts", `
import { createWalletClient, custom } from "viem";
import { bsc } from "viem/chains";

const api = (path: string, init?: RequestInit) =>
  fetch(process.env.NEXT_PUBLIC_SAMA_API_URL + path, { credentials: "include", ...init }).then((r) => r.json());

// 1. Build the intent from your saved target, live balances and the round snapshot.
const { intent, typedData } = await api(\`/api/rounds/\${roundId}/intent\`);

// 2. Sign it. Free: an EIP-712 signature moves nothing.
const wallet = createWalletClient({ chain: bsc, transport: custom(window.ethereum) });
const [account] = await wallet.getAddresses();
const signature = await wallet.signTypedData({ account, ...typedData });

// 3. Submit. Bigints in \`intent\` are sent back as {"$bigint": "..."}.
await api(\`/api/rounds/\${roundId}/intent\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ intent, signature }, (_k, v) => (typeof v === "bigint" ? { $bigint: v.toString() } : v)),
});`, "join-round.ts"),
    tip(
      "The live client in `sama-frontend/lib/api/live.ts` implements every call above, including bigint revival. Read it alongside this page.",
      "Klien live di `sama-frontend/lib/api/live.ts` mengimplementasikan semua panggilan di atas, termasuk pemulihan bigint. Baca bersama halaman ini.",
    ),
  ],
};

export const contract: DocPage = {
  slug: "developers/contract",
  title: t("Settlement contract", "Kontrak settlement"),
  description: t("SamaSettlement executes a fully signed multi-party plan atomically. It never matches, prices or holds tokens.", "SamaSettlement mengeksekusi rencana banyak pihak yang sudah ditandatangani semua secara atomik. Kontrak tidak mencocokkan, memberi harga, atau memegang token."),
  blocks: [
    h2("deployment", "Deployment", "Deployment"),
    table(
      [["Network", "Jaringan"], ["Address", "Alamat"]],
      [[["BNB Smart Chain (56)", "BNB Smart Chain (56)"], "`0x7811a30D29d6c2Ca95Aeb4EE9D896cE44Cb72AC8`"]],
    ),
    p(
      "Solidity 0.8.33, optimizer on (10,000 runs), EVM `cancun`. Built on OpenZeppelin `EIP712`, `SignatureChecker`, `SafeERC20` and `ReentrancyGuard`. No constructor arguments, no owner, no upgrade path.",
      "Solidity 0.8.33, optimizer aktif (10.000 runs), EVM `cancun`. Dibangun di atas `EIP712`, `SignatureChecker`, `SafeERC20`, dan `ReentrancyGuard` dari OpenZeppelin. Tanpa argumen constructor, tanpa owner, tanpa jalur upgrade.",
    ),
    h2("types", "Types", "Tipe"),
    code("solidity", `
struct Leg {
    address token;
    address from;
    address to;
    uint256 amount;
}

struct SettlementPlan {
    bytes32 roundId;
    bytes32 planId;
    bytes32 valuationSnapshotHash;
    uint64 validAfter;
    uint64 validUntil;
    address[] participants; // strictly ascending
    Leg[] legs;             // strictly ascending by (token, from, to)
}

struct Approval {
    uint256 nonce;
    bytes signature;        // EIP-712 PlanApproval, EOA or ERC-1271
}`, "SamaSettlement.sol"),
    h2("functions", "Functions", "Fungsi"),
    table(
      [["Function", "Fungsi"], ["Description", "Deskripsi"]],
      [
        ["`settle(plan, approvals) → planHash`", ["Validates the window, participants, legs, every approval and nonce, then runs `safeTransferFrom` for each leg. Anyone may call it", "Memvalidasi jendela waktu, peserta, leg, setiap persetujuan dan nonce, lalu menjalankan `safeTransferFrom` untuk setiap leg. Siapa pun boleh memanggilnya"]],
        ["`cancelNonce(nonce)`", ["Withdraws an approval you signed but that hasn't been used", "Menarik persetujuan yang sudah kamu tanda tangani tapi belum dipakai"]],
        ["`hashPlan(plan)`", ["The EIP-712 struct hash of a plan; offchain signers must produce the same value", "Hash struct EIP-712 sebuah rencana; penanda tangan offchain harus menghasilkan nilai yang sama"]],
        ["`approvalDigest(plan, participant, nonce)`", ["The exact digest a participant signs", "Digest persis yang ditandatangani peserta"]],
        ["`domainSeparator()`", ["The EIP-712 domain: name `Sama`, version `1`, chain id, this contract", "Domain EIP-712: nama `Sama`, versi `1`, chain id, kontrak ini"]],
        ["`planSettled(hash)`, `nonceUsed(owner, nonce)`", ["Public replay-protection state", "State perlindungan replay yang publik"]],
      ],
    ),
    h2("events", "Events", "Event"),
    code("solidity", `
event PlanSettled(bytes32 indexed roundId, bytes32 indexed planId, bytes32 indexed planHash, uint256 participantCount, uint256 legCount);
event CrossingLeg(bytes32 indexed planHash, address indexed token, address indexed from, address to, uint256 amount);
event NonceConsumed(address indexed owner, uint256 indexed nonce, bytes32 indexed planHash);
event NonceCancelled(address indexed owner, uint256 indexed nonce);`),
    h2("errors", "Errors", "Error"),
    table(
      [["Error", "Error"], ["When", "Kapan"]],
      [
        ["`PlanNotYetValid`, `PlanExpired`", ["Outside the plan's time window", "Di luar jendela waktu rencana"]],
        ["`PlanAlreadySettled`", ["The plan hash already settled", "Hash rencana sudah diselesaikan"]],
        ["`TooFewParticipants`, `EmptyPlan`", ["Fewer than two participants, or no legs", "Kurang dari dua peserta, atau tanpa leg"]],
        ["`ParticipantsNotSorted`, `LegsNotSorted`", ["The plan isn't in canonical order", "Rencana tidak dalam urutan kanonik"]],
        ["`ApprovalCountMismatch`", ["Approvals don't match participants one to one", "Persetujuan tidak satu-satu dengan peserta"]],
        ["`NonceAlreadyUsed`, `InvalidSignature`", ["A reused or cancelled nonce, or a bad signature", "Nonce dipakai ulang atau dibatalkan, atau tanda tangan salah"]],
        ["`ZeroAmount`, `ZeroToken`, `SelfTransfer`", ["A malformed leg", "Leg yang tidak valid"]],
        ["`UnknownParty`, `IdleParticipant`", ["A leg party outside the participants, or a participant with no leg", "Pihak leg di luar peserta, atau peserta tanpa leg"]],
      ],
    ),
    h2("deploy", "Build, test, deploy", "Build, test, deploy"),
    code("bash", `
cd sama-contract
forge build
forge test                       # unit + fuzz tests
forge test --match-path test/fork/*  # against a BSC mainnet fork

# Dry run against the live chain (sends nothing)
forge script script/DeploySettlement.s.sol --rpc-url bsc
# Deploy and verify on BscScan (needs SAMA_DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY)
forge script script/DeploySettlement.s.sol --rpc-url bsc --broadcast --verify`),
    note(
      "Only a real broadcast writes `sama-packages/shared/src/deployments/<chainId>.json`, so a dry run never overwrites the recorded deployment.",
      "Hanya broadcast sungguhan yang menulis `sama-packages/shared/src/deployments/<chainId>.json`, jadi dry run tidak pernah menimpa deployment yang tercatat.",
    ),
  ],
};

export const signing: DocPage = {
  slug: "developers/signing",
  title: t("EIP-712 signing", "Penandatanganan EIP-712"),
  description: t("The two typed messages a member signs: the intent to join a round and the approval of one exact plan.", "Dua pesan bertipe yang ditandatangani anggota: intent untuk ikut round dan persetujuan atas satu rencana yang persis."),
  blocks: [
    h2("domain", "Domain", "Domain"),
    code("ts", `
const domain = {
  name: "Sama",
  version: "1",
  chainId: 56,
  verifyingContract: "0x7811a30D29d6c2Ca95Aeb4EE9D896cE44Cb72AC8",
};`),
    p(
      "Both messages use the same domain, so a signature for another chain or another contract never verifies here.",
      "Kedua pesan memakai domain yang sama, jadi tanda tangan untuk chain atau kontrak lain tidak pernah valid di sini.",
    ),
    h2("intent", "PortfolioIntent", "PortfolioIntent"),
    p(
      "Signed when you join a round. It is verified offchain by the API and never sent to the contract. Assets are listed in address order.",
      "Ditandatangani saat kamu ikut round. Diverifikasi offchain oleh API dan tidak pernah dikirim ke kontrak. Aset diurutkan berdasarkan alamat.",
    ),
    code("ts", `
const types = {
  AssetDeltaLimit: [
    { name: "token", type: "address" },
    { name: "maxOut", type: "uint256" },   // most you send, raw units
    { name: "maxIn", type: "uint256" },    // most you receive, raw units
  ],
  PortfolioIntent: [
    { name: "owner", type: "address" },
    { name: "agent", type: "address" },
    { name: "circleId", type: "bytes32" },
    { name: "roundId", type: "bytes32" },
    { name: "valuationSnapshotHash", type: "bytes32" },
    { name: "policyHash", type: "bytes32" },
    { name: "assets", type: "AssetDeltaLimit[]" },
    { name: "nonce", type: "uint256" },
    { name: "validAfter", type: "uint64" },
    { name: "validUntil", type: "uint64" },
  ],
};`, "@sama/settlement"),
    ul(
      ["`valuationSnapshotHash` binds the intent to the round's prices.", "`valuationSnapshotHash` mengikat intent pada harga round."],
      ["`policyHash` binds your cost cap and leftover style.", "`policyHash` mengikat batas biaya dan gaya sisa."],
      ["The API accepts a signature from the owner or the owner's declared agent.", "API menerima tanda tangan dari pemilik atau agent yang dideklarasikan pemilik."],
    ),
    h2("approval", "PlanApproval", "PlanApproval"),
    p(
      "Signed when you approve a match. The contract recomputes it on-chain, so it must match `hashPlan` exactly.",
      "Ditandatangani saat kamu menyetujui pasangan. Kontrak menghitungnya ulang on-chain, jadi harus persis sama dengan `hashPlan`.",
    ),
    code("text", `
PlanApproval(address participant,uint256 nonce,SettlementPlan plan)
SettlementPlan(bytes32 roundId,bytes32 planId,bytes32 valuationSnapshotHash,uint64 validAfter,uint64 validUntil,address[] participants,Leg[] legs)
Leg(address token,address from,address to,uint256 amount)`),
    h3("nonce", "Approval nonces", "Nonce persetujuan"),
    p(
      "Nonces are unordered, so one wallet can be in several rounds at once. Sama derives each nonce from the plan and the participant, which makes it unique per plan:",
      "Nonce tidak berurutan, jadi satu wallet bisa ikut beberapa round sekaligus. Sama menurunkan setiap nonce dari rencana dan peserta, sehingga unik per rencana:",
    ),
    code("ts", `
nonce = BigInt(keccak256(encodeAbiParameters(
  [{ type: "bytes32" }, { type: "address" }],
  [planHash, participant],
)));`),
    warn(
      "Never sign a Sama message your wallet shows with a different `verifyingContract` or `chainId`. The app always tells you the amounts before the prompt; if they differ from what your wallet shows, reject it.",
      "Jangan pernah menandatangani pesan Sama yang di wallet menampilkan `verifyingContract` atau `chainId` berbeda. Aplikasi selalu menyebut jumlahnya sebelum pop-up; bila berbeda dengan yang tampil di wallet, tolak.",
    ),
  ],
};

export const localSetup: DocPage = {
  slug: "developers/local-setup",
  title: t("Run it locally", "Menjalankan secara lokal"),
  description: t("Run the frontend on its own in mock mode, or the full stack against BNB Chain.", "Jalankan frontend sendiri dalam mode mock, atau seluruh stack terhadap BNB Chain."),
  blocks: [
    h2("mock", "Frontend only (mock mode)", "Hanya frontend (mode mock)"),
    p(
      "Mock mode keeps every screen working in the browser with sample data. Sign-in is still real Privy, but nothing is signed or sent.",
      "Mode mock membuat semua layar berjalan di browser dengan data contoh. Sign-in tetap Privy sungguhan, tapi tidak ada yang ditandatangani atau dikirim.",
    ),
    code("bash", `
cd sama-frontend
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_PRIVY_APP_ID, keep NEXT_PUBLIC_SAMA_API_MODE=mock
pnpm dev                     # http://localhost:3200`),
    note(
      "Token pages (charts, size, trades) read the API's open `/api/market` routes in both modes, the way `/proof` does. In mock mode, set `NEXT_PUBLIC_SAMA_API_URL` to a running backend to see them.",
      "Halaman token (chart, ukuran pasar, trade) membaca route terbuka `/api/market` dari API di kedua mode, seperti `/proof`. Di mode mock, isi `NEXT_PUBLIC_SAMA_API_URL` dengan backend yang berjalan untuk melihatnya.",
    ),
    tip(
      "In the Privy dashboard, enable Email and Wallet login, turn on EVM embedded wallets, and add `http://localhost:3200` to the allowed domains.",
      "Di dashboard Privy, aktifkan login Email dan Wallet, nyalakan EVM embedded wallet, lalu tambahkan `http://localhost:3200` ke allowed domains.",
    ),
    h2("full", "Full stack", "Seluruh stack"),
    code("bash", `
# 1. Shared packages
cd sama-packages && bun install

# 2. API on :3300
cd ../sama-backend
bun install
cp .env.example .env         # PRIVY_*, BINANCE_WEB3_*, SESSION_SECRET, BSC_RPC_URL, VERIFIER_RPC_URL
bun run dev                  # http://localhost:3300/api/health

# 3. Frontend in live mode
cd ../sama-frontend
# .env.local: NEXT_PUBLIC_SAMA_API_MODE=live, NEXT_PUBLIC_SAMA_API_URL=http://localhost:3300
pnpm dev`),
    h2("env", "Environment", "Environment"),
    table(
      [["Variable", "Variabel"], ["Purpose", "Fungsi"]],
      [
        ["`SAMA_CHAIN_ID`, `SAMA_ENABLE_MAINNET`", ["56 or 97; mainnet must be switched on explicitly", "56 atau 97; mainnet harus diaktifkan secara eksplisit"]],
        ["`SAMA_SETTLEMENT_ADDRESS`", ["Override the recorded deployment", "Menimpa deployment yang tercatat"]],
        ["`BSC_RPC_URL`, `VERIFIER_RPC_URL`", ["Executor RPC, and a different provider with archive state for the verifier", "RPC executor, dan penyedia lain dengan archive state untuk verifier"]],
        ["`BSC_WS_URL`", ["Optional websocket RPC for realtime transfer logs; polling runs either way", "RPC websocket opsional untuk log transfer realtime; polling tetap berjalan"]],
        ["`PRIVY_APP_ID`, `PRIVY_APP_SECRET`", ["Verify sign-in tokens", "Memverifikasi token sign-in"]],
        ["`BINANCE_WEB3_API_KEY`, `BINANCE_WEB3_API_SECRET`", ["Stock prices", "Harga saham"]],
        ["`DATABASE_URL`, `SAMA_PGLITE_DIR`", ["Postgres, or PGlite for local work", "Postgres, atau PGlite untuk kerja lokal"]],
        ["`SESSION_SECRET`, `SAMA_ALLOWED_ORIGINS`, `SAMA_APP_ORIGIN`, `SAMA_CROSS_SITE_COOKIE`", ["Sessions and CORS", "Sesi dan CORS"]],
        ["`SAMA_MAX_PLAN_USD`, `SAMA_SWAP_SLIPPAGE_BPS`", ["Plan value cap (500) and leftover swap slippage (50)", "Batas nilai rencana (500) dan slippage swap sisa (50)"]],
        ["`SAMA_CRON_INTERVAL_SEC`", ["How often the background loop runs", "Seberapa sering loop latar berjalan"]],
        ["`COINGECKO_API_KEY`", ["Optional CoinGecko Demo key for token pages. Limits are then per key; without it the free per-IP limit applies and `/api/market` can answer 503", "Key Demo CoinGecko opsional untuk halaman token. Batasnya lalu dihitung per key; tanpa key berlaku batas gratis per IP dan `/api/market` bisa menjawab 503"]],
        ["`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`", ["Optional, any OpenAI-compatible gateway for the assistant and targets in words", "Opsional, gateway apa pun yang kompatibel dengan OpenAI untuk asisten dan target dengan kalimat"]],
        ["`GROQ_API_KEY`", ["Optional fallback when `AI_*` is not set; powers both the assistant and targets in words", "Cadangan opsional bila `AI_*` tidak diisi; menjalankan asisten dan target dengan kalimat"]],
        ["`ANTHROPIC_API_KEY`", ["Optional, describing a target in words only. The assistant needs `AI_*` or Groq", "Opsional, hanya untuk menuliskan target dengan kalimat. Asisten butuh `AI_*` atau Groq"]],
      ],
    ),
    h2("tests", "Tests", "Test"),
    code("bash", `
cd sama-packages && bun test        # matcher, reference matcher, settlement, verifier, …
cd sama-backend && bun test         # offline API tests (fake prices, in-memory PGlite)
SAMA_FORK=1 bun test test/e2e.fork.test.ts   # a full round on a BSC mainnet fork
cd sama-contract && forge test
cd sama-frontend && pnpm typecheck`),
    warn(
      "`SAMA_DEV_AUTH=1` enables a signed-message login for scripts. Never turn it on in production.",
      "`SAMA_DEV_AUTH=1` mengaktifkan login lewat pesan bertanda tangan untuk script. Jangan pernah dinyalakan di produksi.",
    ),
  ],
};
