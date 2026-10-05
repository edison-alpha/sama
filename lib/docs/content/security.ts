import { code, h2, h3, note, p, preview, table, ul, warn, t, type DocPage } from "../types";

export const security: DocPage = {
  slug: "security",
  title: t("Security model", "Model keamanan"),
  description: t("What you sign, what the contract can and cannot do, and the risks that remain.", "Apa yang kamu tanda tangani, apa yang bisa dan tidak bisa dilakukan kontrak, dan risiko yang tersisa."),
  blocks: [
    h2("custody", "No custody, ever", "Tanpa kustodi, kapan pun"),
    p(
      "Sama never holds your tokens. The API cannot move them, and the settlement contract only moves what an exact, fully signed plan says, straight from one wallet to another. Its token balance is zero before and after every settlement, and the verifier checks that on every round.",
      "Sama tidak pernah memegang tokenmu. API tidak bisa memindahkannya, dan kontrak settlement hanya memindahkan apa yang tertulis di rencana yang persis dan sudah ditandatangani semua pihak, langsung dari satu wallet ke wallet lain. Saldo token kontrak nol sebelum dan sesudah setiap settlement, dan verifier mengeceknya di setiap round.",
    ),
    h2("what-you-sign", "What you sign", "Apa yang kamu tanda tangani"),
    table(
      [["Signature", "Tanda tangan"], ["It authorizes", "Yang diizinkan"], ["It cannot", "Yang tidak bisa"]],
      [
        [["Intent (EIP-712)", "Intent (EIP-712)"], ["Your limits for one round: per asset, the most you send and receive", "Batasmu untuk satu round: per aset, jumlah maksimal yang kamu kirim dan terima"], ["Move any token", "Memindahkan token apa pun"]],
        [["Plan approval (EIP-712)", "Persetujuan rencana (EIP-712)"], ["One exact plan: every leg, amount, round, price snapshot and deadline", "Satu rencana persis: setiap leg, jumlah, round, snapshot harga, dan batas waktu"], ["Be reused for a different plan, or after it settles", "Dipakai ulang untuk rencana lain, atau setelah diselesaikan"]],
        [["Token allowance", "Allowance token"], ["The contract may move the exact amount of one token you send in the plan", "Kontrak boleh memindahkan jumlah persis satu token yang kamu kirim di rencana"], ["Exceed that amount", "Melebihi jumlah itu"]],
      ],
    ),
    h2("contract", "What the contract enforces", "Yang ditegakkan kontrak"),
    ul(
      ["**Time window**: a plan settles only between its `validAfter` and `validUntil`.", "**Jendela waktu**: rencana hanya bisa diselesaikan antara `validAfter` dan `validUntil`."],
      ["**Everyone signed**: one valid approval per participant, EOA or ERC-1271 smart wallet.", "**Semua menandatangani**: satu persetujuan sah per peserta, EOA atau smart wallet ERC-1271."],
      ["**No replay**: each plan settles at most once; each (owner, nonce) is consumed once.", "**Tanpa replay**: setiap rencana diselesaikan maksimal sekali; setiap (pemilik, nonce) dipakai sekali."],
      ["**Canonical plans**: participants and legs must be sorted, non-zero, and every party must be a participant. No participant can be idle.", "**Rencana kanonik**: peserta dan leg harus terurut dan tidak nol, dan setiap pihak harus peserta. Tidak ada peserta yang menganggur."],
      ["**All or nothing**: one failed `transferFrom` reverts the whole plan.", "**Semua atau tidak sama sekali**: satu `transferFrom` yang gagal membatalkan seluruh rencana."],
      ["**Nothing else**: no owner, no upgrade, no fee, no oracle, no stored funds. It is `nonReentrant`.", "**Tidak ada yang lain**: tanpa owner, tanpa upgrade, tanpa fee, tanpa oracle, tanpa dana tersimpan. Kontrak bersifat `nonReentrant`."],
    ),
    h2("server", "What the server checks", "Yang dicek server"),
    ul(
      ["Your balances are read from the chain, never taken from the browser.", "Saldo dibaca dari chain, tidak pernah diambil dari browser."],
      ["A reported settlement hash is accepted only if the transaction calls this round's contract, on the right chain, with exactly this round's plan. A member cannot post an unrelated transaction to fail a round.", "Hash settlement yang dilaporkan hanya diterima bila transaksinya memanggil kontrak round ini, di chain yang benar, dengan rencana round ini persis. Anggota tidak bisa mengirim transaksi lain untuk menggagalkan round."],
      ["State-changing requests from an origin outside the allowlist are refused before any handler runs.", "Request yang mengubah state dari origin di luar allowlist ditolak sebelum handler mana pun berjalan."],
      ["Sign-in tokens are verified with Privy on the server; the session is an HTTP-only cookie.", "Token sign-in diverifikasi dengan Privy di server; sesi berupa cookie HTTP-only."],
      ["Round state changes are compare-and-set, so a retried request never doubles a signature or a step.", "Perubahan state round memakai compare-and-set, jadi request yang diulang tidak pernah menggandakan tanda tangan atau langkah."],
    ),
    h2("risks", "Risks that remain", "Risiko yang tersisa"),
    table(
      [["Risk", "Risiko"], ["Mitigation", "Mitigasi"]],
      [
        [["The contract is not externally audited", "Kontrak belum diaudit pihak luar"], ["Plans are capped at $500 crossed until an audit; Foundry unit, fuzz and mainnet-fork tests cover custody, replay, tampering and reverts", "Rencana dibatasi $500 yang dicocokkan sampai ada audit; test unit, fuzz, dan fork mainnet Foundry mencakup kustodi, replay, manipulasi, dan revert"]],
        [["An issuer pauses or blocks a token", "Penerbit mem-pause atau memblokir token"], ["Status is read before a plan; a blocked wallet is left out. If it happens mid-round the settlement reverts and nothing moves", "Status dibaca sebelum rencana; wallet yang diblokir dikeluarkan. Bila terjadi di tengah round, settlement dibatalkan dan tidak ada yang berpindah"]],
        [["A price source is wrong or stale", "Sumber harga salah atau basi"], ["Tier A prices are cross-checked on-chain; any asset that fails is left out of the round", "Harga tier A dicek silang on-chain; aset yang gagal dikeluarkan dari round"]],
        [["A participant never approves", "Ada peserta yang tidak menyetujui"], ["The plan expires after 30 minutes; nothing moves", "Rencana kedaluwarsa setelah 30 menit; tidak ada yang berpindah"]],
        [["You change your mind after approving", "Kamu berubah pikiran setelah menyetujui"], ["Call `cancelNonce` on the contract before settlement", "Panggil `cancelNonce` di kontrak sebelum settlement"]],
      ],
    ),
    warn(
      "Sama coordinates trades you choose. It gives no investment advice and does not decide whether you may trade an asset where you live.",
      "Sama mengoordinasikan trade yang kamu pilih. Sama tidak memberi nasihat investasi dan tidak menentukan apakah kamu boleh memperdagangkan suatu aset di tempatmu.",
    ),
    h3("report", "Reporting an issue", "Melaporkan masalah"),
    p(
      "Found a vulnerability? Please report it privately to the team before disclosing it publicly, with steps to reproduce. Do not test against other people's funds.",
      "Menemukan celah keamanan? Laporkan secara privat ke tim sebelum diungkap ke publik, beserta langkah reproduksinya. Jangan menguji dengan dana orang lain.",
    ),
  ],
};

export const verification: DocPage = {
  slug: "verification",
  title: t("Verification and proof", "Verifikasi dan bukti"),
  description: t("Every settlement is re-read from the chain by an independent verifier. Here is every check it runs.", "Setiap settlement dibaca ulang dari chain oleh verifier independen. Ini semua cek yang dijalankannya."),
  blocks: [
    h2("independent", "Independent by design", "Independen sejak rancangan"),
    p(
      "The verifier never reads Sama's database or the executor's records. It takes only the transaction hash, the contract, the approved plan and the tokens to watch, then reads everything else from the chain, through an RPC provider that differs from the one that executed the round. Its report is stored with the round and shown on your receipt.",
      "Verifier tidak pernah membaca database Sama atau catatan executor. Verifier hanya menerima hash transaksi, kontrak, rencana yang disetujui, dan token yang dipantau, lalu membaca sisanya dari chain lewat penyedia RPC yang berbeda dari yang mengeksekusi round. Laporannya disimpan bersama round dan ditampilkan di strukmu.",
    ),
    preview("checks", ["The checks as they appear on a receipt.", "Daftar cek seperti yang tampil di struk."]),
    h2("checks", "Every check", "Semua cek"),
    table(
      [["Check", "Cek"], ["What it confirms", "Yang dipastikan"]],
      [
        ["`tx.status`", ["The receipt status is success", "Status receipt sukses"]],
        ["`tx.to`", ["The transaction called the settlement contract", "Transaksi memanggil kontrak settlement"]],
        ["`chain.id`", ["It ran on BNB Smart Chain", "Berjalan di BNB Smart Chain"]],
        ["`calldata.plan`", ["The calldata decodes to `settle()` with the approved plan hash", "Calldata ter-decode menjadi `settle()` dengan hash rencana yang disetujui"]],
        ["`event.PlanSettled`", ["The contract emitted PlanSettled for this plan", "Kontrak memancarkan PlanSettled untuk rencana ini"]],
        ["`event.CrossingLeg`", ["One CrossingLeg event per planned transfer", "Satu event CrossingLeg per transfer terencana"]],
        ["`event.Transfer`", ["No ERC-20 transfer happened outside the plan", "Tidak ada transfer ERC-20 di luar rencana"]],
        ["`event.NonceConsumed`", ["Each participant's approval was used on-chain", "Persetujuan setiap peserta dipakai on-chain"]],
        ["`state.planSettled`", ["The contract marks the plan as settled", "Kontrak menandai rencana sudah diselesaikan"]],
        ["`state.nonceUsed`", ["Every approval nonce is consumed", "Setiap nonce persetujuan sudah terpakai"]],
        ["`participants.set`", ["Approvals consumed equal the plan's participants", "Persetujuan yang terpakai sama dengan peserta rencana"]],
        ["`balances.netDelta`", ["Each balance moved exactly by the plan's net amount, block before vs receipt block", "Setiap saldo berubah persis sebesar jumlah bersih rencana, blok sebelum vs blok receipt"]],
        ["`balances.noCustody`", ["The contract holds none of the watched tokens", "Kontrak tidak memegang token yang dipantau"]],
        ["`plan.window`", ["It settled inside the plan's validity window", "Diselesaikan di dalam jendela waktu rencana"]],
        ["`plan.snapshotHash`", ["The plan's prices are the round's snapshot", "Harga di rencana adalah snapshot round"]],
        ["`prices.independent`", ["Every stock price was cross-checked on-chain", "Setiap harga saham dicek silang on-chain"]],
        ["`providers.independent`", ["Verification used a different RPC provider than execution", "Verifikasi memakai penyedia RPC yang berbeda dari eksekusi"]],
      ],
    ),
    note(
      "A failed historical read is reported as INCONCLUSIVE, never as PASS. A round is marked complete only when the verification passes; otherwise it ends in `VERIFICATION_FAILED` and the team is alerted.",
      "Pembacaan historis yang gagal dilaporkan sebagai INCONCLUSIVE, tidak pernah PASS. Round dinyatakan selesai hanya bila verifikasi lolos; bila tidak, round berakhir di `VERIFICATION_FAILED` dan tim diberi tahu.",
    ),
    h2("proof", "Public proof", "Bukti publik"),
    p(
      "The [Proof](/proof) page lists the settlement contract, its deploy transaction and source verification on BscScan, and every settled round with its checks. Participants are never named.",
      "Halaman [Bukti](/proof) menampilkan kontrak settlement, transaksi deploy dan verifikasi source di BscScan, serta setiap round yang sudah diselesaikan beserta ceknya. Peserta tidak pernah disebut namanya.",
    ),
    code("bash", `
# Read the same data the Proof page shows
curl https://<api-host>/api/proof`),
  ],
};
