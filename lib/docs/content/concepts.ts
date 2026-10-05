import { h2, h3, note, ol, p, preview, steps, table, tip, ul, warn, t, type DocPage } from "../types";

export const targets: DocPage = {
  slug: "concepts/targets",
  title: t("Portfolio and targets", "Portofolio dan target"),
  description: t("Your target is the mix you want. Each round turns the gap between it and your wallet into a signed, bounded rebalance.", "Target adalah komposisi yang kamu mau. Setiap round mengubah selisih antara target dan wallet-mu menjadi rebalance bertanda tangan yang berbatas."),
  blocks: [
    h2("portfolio", "Your portfolio", "Portofoliomu"),
    p(
      "Sama never trusts a balance it did not read itself. Every time you open the app, the API reads your balances from BNB Chain and values them with the current prices. Balances you type, or that a client sends, are never used.",
      "Sama tidak pernah memercayai saldo yang tidak dibacanya sendiri. Setiap kali aplikasi dibuka, API membaca saldo dari BNB Chain dan menilainya dengan harga terkini. Saldo yang diketik atau dikirim klien tidak pernah dipakai.",
    ),
    h2("target", "Setting a target", "Mengatur target"),
    p(
      "A target is a percentage per asset that adds up to exactly 100%. Start from a preset (Balanced, Conservative or Growth) or type each number yourself. Two extra settings travel with it:",
      "Target adalah persentase per aset yang totalnya tepat 100%. Mulai dari preset (Seimbang, Konservatif, atau Tumbuh) atau ketik sendiri setiap angkanya. Dua pengaturan tambahan ikut tersimpan:",
    ),
    ul(
      ["**Cost cap**: the most you'll pay to swap a leftover, in basis points (default 1%).", "**Batas biaya**: biaya maksimal untuk swap sisa, dalam basis poin (default 1%)."],
      ["**Leftover style**: what Sama does by default with the unmatched part (see [Leftovers](/docs/concepts/leftovers)).", "**Gaya sisa**: apa yang dilakukan Sama secara default pada bagian yang tidak berpasangan (lihat [Sisa](/docs/concepts/leftovers))."],
    ),
    preview("target", ["Where you are now against your target, and the trades it implies.", "Posisimu sekarang dibanding target, dan trade yang dibutuhkan."], {
      lang: "ts",
      code: `
// POST /api/me/target/preview
await fetch("/api/me/target/preview", {
  method: "POST",
  credentials: "include",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ weights: { NVDAB: 40, AAPLB: 30, USDT: 30 }, costCapBps: 100, residualStyle: "ECONOMIC" }),
});
// → { ok: true, problems: [], trades: [{ symbol: "NVDAB", side: "BUY", valueUsd: 120, amountTokens: 0.68 }, …] }`,
    }),
    note(
      "A target describes the whole wallet. Anything you hold but leave out of the target counts as 0%, so the next round would sell it. The editor never lets you hide a token you hold for that reason.",
      "Target menggambarkan seluruh wallet. Aset yang kamu pegang tapi tidak dimasukkan ke target dihitung 0%, jadi round berikutnya akan menjualnya. Karena itu editor tidak mengizinkan menyembunyikan token yang sedang kamu pegang.",
    ),
    h2("intent", "From target to intent", "Dari target ke intent"),
    p(
      "When you join a round, the API rebuilds your rebalance from three things it reads itself: your saved target, your live balances, and the round's price snapshot. The result is an **intent**: for each asset in the Circle, the most you will send and the most you will receive.",
      "Saat kamu ikut round, API menyusun ulang rebalance-mu dari tiga hal yang dibacanya sendiri: target tersimpan, saldo live, dan snapshot harga round. Hasilnya adalah **intent**: untuk setiap aset di Circle, jumlah maksimal yang kamu kirim dan jumlah maksimal yang kamu terima.",
    ),
    ul(
      ["Only assets in the Circle go into the intent. The others wait for a Circle that trades them.", "Hanya aset di Circle yang masuk ke intent. Sisanya menunggu Circle yang memperdagangkannya."],
      ["The limits are hard caps. The matcher can fill less, never more.", "Batasnya adalah batas keras. Matcher bisa mengisi lebih sedikit, tidak pernah lebih."],
      ["You sign the intent with a free EIP-712 signature. It moves nothing by itself. See [Signing](/docs/developers/signing).", "Kamu menandatangani intent dengan tanda tangan EIP-712 gratis. Intent tidak memindahkan apa pun dengan sendirinya. Lihat [Penandatanganan](/docs/developers/signing)."],
    ),
    h2("describe", "Describing a target in words", "Menuliskan target dengan kalimat"),
    p(
      "Sama can read a sentence such as \"reduce NVDAB to 20% and put the rest into USDT\". The language model only turns the sentence into structured operations; code resolves every symbol, price and amount against the allowlist. This mode is off by default on public servers.",
      "Sama bisa membaca kalimat seperti \"kurangi NVDAB jadi 20% dan sisanya ke USDT\". Model bahasa hanya mengubah kalimat menjadi operasi terstruktur; kode yang menentukan setiap simbol, harga, dan jumlah terhadap allowlist. Mode ini mati secara default di server publik.",
    ),
  ],
};

export const circles: DocPage = {
  slug: "concepts/circles",
  title: t("Circles", "Circle"),
  description: t("A Circle is a group that rebalances the same assets on a schedule. Rounds happen inside Circles.", "Circle adalah grup yang rebalance aset yang sama secara terjadwal. Round terjadi di dalam Circle."),
  blocks: [
    h2("why-circles", "Why groups", "Kenapa grup"),
    p(
      "Matching works when enough people heading opposite ways meet at the same time. A Circle gathers them: the same assets, a known schedule, and a minimum number of members before a round can match.",
      "Pencocokan berhasil bila cukup banyak orang yang bergerak berlawanan bertemu di waktu yang sama. Circle mengumpulkan mereka: aset yang sama, jadwal yang jelas, dan jumlah minimal anggota sebelum round bisa dicocokkan.",
    ),
    h2("settings", "Settings", "Pengaturan"),
    table(
      [["Setting", "Pengaturan"], ["Options", "Pilihan"]],
      [
        [["Access", "Akses"], ["Public · By invitation · Private", "Publik · Dengan undangan · Privat"]],
        [["Assets", "Aset"], ["At least two from the allowlist. Members only match these inside the Circle", "Minimal dua dari allowlist. Anggota hanya dicocokkan pada aset ini di dalam Circle"]],
        [["Round schedule", "Jadwal round"], ["Manual (organizer starts one) · Daily · Weekly", "Manual (organizer memulai) · Harian · Mingguan"]],
        [["Sign-up window", "Jendela pendaftaran"], ["5 min · 15 min · 1 hour · 4 hours · 1 day", "5 menit · 15 menit · 1 jam · 4 jam · 1 hari"]],
        [["Members needed per round", "Anggota per round"], ["2 to 50", "2 sampai 50"]],
        [["Default for leftovers", "Default untuk sisa"], ["Cheapest route · Roll over · Skip", "Rute termurah · Bawa ke round berikutnya · Lewati"]],
      ],
    ),
    h2("invites", "Invitations", "Undangan"),
    p(
      "Organizers create invite links. Each link works once, and only its hash is stored, so a leaked database cannot be turned back into working invites. Share it by copy, Telegram, WhatsApp or QR.",
      "Organizer membuat link undangan. Setiap link hanya berlaku sekali, dan yang disimpan hanya hash-nya, jadi database yang bocor tidak bisa diubah kembali menjadi undangan yang berfungsi. Bagikan lewat salin, Telegram, WhatsApp, atau QR.",
    ),
    h2("privacy", "Privacy inside a Circle", "Privasi di dalam Circle"),
    ul(
      ["Other members appear as \"Peer 2\", \"Peer 3\", never by address.", "Anggota lain tampil sebagai \"Anggota 2\", \"Anggota 3\", tidak pernah sebagai alamat."],
      ["Receipts open only for members of the Circle.", "Struk hanya bisa dibuka anggota Circle."],
      ["Onchain, transfers are public as on any chain. Sama keeps its own views pseudonymous; it cannot hide the chain.", "Di chain, transfer bersifat publik seperti di chain mana pun. Sama menjaga tampilannya sendiri tetap anonim; Sama tidak bisa menyembunyikan chain."],
    ),
  ],
};

export const rounds: DocPage = {
  slug: "concepts/rounds",
  title: t("Rounds", "Round"),
  description: t("One round: members sign, Sama matches, everyone approves, one transaction settles, and you decide the rest.", "Satu round: anggota menandatangani, Sama mencocokkan, semua menyetujui, satu transaksi menyelesaikan, lalu kamu memutuskan sisanya."),
  blocks: [
    h2("journey", "The journey", "Perjalanannya"),
    preview("round", ["Click a phase to see what you see and do there.", "Klik satu fase untuk melihat apa yang kamu lihat dan lakukan di sana."]),
    steps(
      [["Join", "Gabung"], ["The round collects signed rebalances until its sign-up window ends. You can leave the page; your place is saved.", "Round mengumpulkan rebalance bertanda tangan sampai jendela pendaftaran berakhir. Kamu boleh meninggalkan halaman; tempatmu tersimpan."]],
      [["Match", "Cocokkan"], ["When the window closes the round freezes, prices are pinned, and the solver runs. This usually takes seconds.", "Saat jendela ditutup, round dibekukan, harga dikunci, lalu solver berjalan. Biasanya hanya beberapa detik."]],
      [["Approve", "Setujui"], ["If you're in the plan, you see exactly what you send and receive. You have 30 minutes to approve and allow those exact amounts.", "Bila kamu masuk rencana, kamu melihat persis apa yang kamu kirim dan terima. Kamu punya 30 menit untuk menyetujui dan mengizinkan jumlah persis itu."]],
      [["Settle", "Settle"], ["Once everyone approved, any participant can send the single `settle()` transaction. An independent check follows.", "Setelah semua menyetujui, peserta mana pun bisa mengirim satu transaksi `settle()`. Setelah itu ada cek independen."]],
      [["Leftovers", "Sisa"], ["Whatever didn't match is yours to roll over, swap on PancakeSwap, or skip.", "Bagian yang tidak berpasangan bisa kamu bawa ke round berikutnya, swap di PancakeSwap, atau lewati."]],
      [["Receipt", "Struk"], ["A verified record of every transfer, the transaction, and each check.", "Catatan terverifikasi berisi setiap transfer, transaksinya, dan setiap cek."]],
    ),
    h2("states", "Every state", "Semua state"),
    p(
      "The API moves a round through these states with compare-and-set updates, so two requests can never move the same round twice.",
      "API memindahkan round melalui state ini dengan pembaruan compare-and-set, jadi dua request tidak pernah bisa memindahkan round yang sama dua kali.",
    ),
    table(
      [["State", "State"], ["What it means", "Artinya"], ["What you do", "Yang kamu lakukan"]],
      [
        ["`OPEN`, `COLLECTING`", ["Members are joining", "Anggota sedang bergabung"], ["Sign & join", "Tanda tangan & gabung"]],
        ["`FROZEN`, `SOLVING`", ["Prices pinned, solver running", "Harga dikunci, solver berjalan"], ["Wait", "Tunggu"]],
        ["`PROPOSED`, `APPROVING`", ["A plan exists; participants approve", "Rencana ada; peserta menyetujui"], ["Approve & allow", "Setujui & izinkan"]],
        ["`READY_TO_SETTLE`", ["Everyone approved", "Semua sudah setuju"], ["Submit settlement", "Kirim settlement"]],
        ["`SETTLING`, `SETTLED`, `VERIFYING`", ["Transaction sent, being checked", "Transaksi terkirim, sedang dicek"], ["Wait", "Tunggu"]],
        ["`COMPLETE`", ["Settled and verified", "Selesai dan terverifikasi"], ["Decide leftovers, open receipt", "Putuskan sisa, buka struk"]],
        ["`NO_CROSS`", ["Nobody was heading the other way. Nothing moved", "Tidak ada yang bergerak berlawanan. Tidak ada yang berpindah"], ["Decide leftovers", "Putuskan sisa"]],
        ["`INSUFFICIENT_PARTICIPANTS`", ["Fewer members than the Circle needs. Nothing moved", "Anggota kurang dari kebutuhan Circle. Tidak ada yang berpindah"], ["Invite people, wait for the next round", "Undang orang, tunggu round berikutnya"]],
        ["`EXPIRED`", ["Nobody joined in time", "Tidak ada yang bergabung tepat waktu"], ["Start a new round", "Mulai round baru"]],
        ["`PLAN_STALE`, `PLAN_REJECTED`", ["Approval window passed, or someone didn't approve. Nothing moved", "Jendela persetujuan lewat, atau ada yang tidak menyetujui. Tidak ada yang berpindah"], ["Back to the Circle", "Kembali ke Circle"]],
        ["`SETTLEMENT_REVERTED`", ["The chain cancelled the transaction; every token stayed put", "Chain membatalkan transaksi; semua token tetap di tempat"], ["See the reason", "Lihat alasannya"]],
        ["`VERIFICATION_FAILED`", ["The result didn't match the plan; the team is alerted", "Hasil tidak cocok dengan rencana; tim diberi tahu"], ["Check the receipt", "Cek struk"]],
      ],
    ),
    tip(
      "Every failed or empty state ends with \"nothing moved\" for a reason: settlement is all or nothing, so a round either moves exactly the approved plan or moves nothing.",
      "Setiap state gagal atau kosong berakhir dengan \"tidak ada yang berpindah\" karena alasan jelas: settlement itu semua atau tidak sama sekali, jadi round hanya memindahkan rencana yang disetujui persis, atau tidak memindahkan apa pun.",
    ),
    h2("prices", "Round prices", "Harga round"),
    p(
      "Each round uses one price snapshot, pinned to one block, for every member. Stock prices come from Binance; for tier A assets they are cross-checked against a 30-minute on-chain PancakeSwap TWAP and must agree within 1% while the market is open (3% when closed). An asset that fails a check is left out of the round with a reason you can see; it is never silently priced.",
      "Setiap round memakai satu snapshot harga, dikunci pada satu blok, untuk semua anggota. Harga saham diambil dari Binance; untuk aset tier A, harga itu dicek silang dengan TWAP PancakeSwap on-chain 30 menit dan harus selisih tidak lebih dari 1% saat pasar buka (3% saat tutup). Aset yang gagal dicek dikeluarkan dari round dengan alasan yang terlihat; tidak pernah diberi harga diam-diam.",
    ),
  ],
};

export const matching: DocPage = {
  slug: "concepts/matching",
  title: t("Matching", "Pencocokan"),
  description: t("How the solver finds the largest set of transfers that moves every member toward their own target.", "Bagaimana solver menemukan kumpulan transfer terbesar yang menggerakkan setiap anggota menuju target masing-masing."),
  blocks: [
    h2("goal", "What the solver maximizes", "Apa yang dimaksimalkan solver"),
    p(
      "Given every signed intent and the round's prices, the solver finds the largest dollar value of transfers between members such that each member sends no more than they offered, receives no more than they asked for, and gets exactly as much value back as they send.",
      "Dari semua intent bertanda tangan dan harga round, solver mencari nilai dolar transfer terbesar antar anggota, dengan syarat setiap anggota tidak mengirim lebih dari yang ditawarkan, tidak menerima lebih dari yang diminta, dan menerima nilai yang persis sama dengan yang dikirim.",
    ),
    preview("ring", ["Maya, Alex and you close a loop no pair could.", "Maya, Alex, dan kamu menutup putaran yang tidak bisa ditutup pasangan."]),
    h2("method", "Method", "Metode"),
    p(
      "Members and assets form a flow network: sell capacity on member → asset edges, buy capacity on asset → member edges, and an exact value balance at every member. The largest crossed value is a min-cost circulation, solved with minimum-mean cycle canceling. There is no external solver and no randomness.",
      "Anggota dan aset membentuk jaringan alir: kapasitas jual di sisi anggota → aset, kapasitas beli di sisi aset → anggota, dan keseimbangan nilai yang persis di setiap anggota. Nilai pencocokan terbesar adalah min-cost circulation, diselesaikan dengan minimum-mean cycle canceling. Tidak ada solver eksternal dan tidak ada unsur acak.",
    ),
    ul(
      ["**Deterministic**: the same input always gives the same plan.", "**Deterministik**: input yang sama selalu menghasilkan rencana yang sama."],
      ["**Integer amounts**: values are quantized to $0.01 lots; raw token amounts never exceed a member's limits.", "**Jumlah bulat**: nilai dikuantisasi ke lot $0,01; jumlah token mentah tidak pernah melebihi batas anggota."],
      ["**Exact accounting**: for every member and asset, matched + left over = requested.", "**Akuntansi persis**: untuk setiap anggota dan aset, yang cocok + sisa = yang diminta."],
      ["**Honest empty results**: zero overlap returns `NO_CROSS`. No match is ever manufactured.", "**Hasil kosong yang jujur**: tanpa tumpang tindih hasilnya `NO_CROSS`. Pasangan tidak pernah dibuat-buat."],
      ["**Dust**: a leftover under $0.10 on a filled asset is rounding dust, too small for any market.", "**Dust**: sisa di bawah $0,10 pada aset yang terisi adalah sisa pembulatan, terlalu kecil untuk pasar mana pun."],
    ),
    h2("reference", "Checked against a reference", "Dicek dengan pembanding"),
    p(
      "A separate reference matcher solves the same problem two other ways (exact rational simplex for small rounds, the HiGHS LP solver for larger ones) and shares no code with the production solver. Tests require both to agree on the optimum value for every generated round.",
      "Reference matcher terpisah menyelesaikan masalah yang sama dengan dua cara lain (simplex rasional eksak untuk round kecil, solver LP HiGHS untuk yang besar) dan tidak berbagi kode dengan solver produksi. Test mensyaratkan keduanya sepakat pada nilai optimum untuk setiap round yang dibuat.",
    ),
    note(
      "Your intent is a set of limits, not an order. The solver may fill part of it. Whatever it doesn't fill becomes your leftover, never a trade you didn't approve.",
      "Intent-mu adalah kumpulan batas, bukan order. Solver bisa mengisi sebagian. Bagian yang tidak terisi menjadi sisa, tidak pernah menjadi trade yang tidak kamu setujui.",
    ),
  ],
};

export const settlement: DocPage = {
  slug: "concepts/settlement",
  title: t("Approval and settlement", "Persetujuan dan settlement"),
  description: t("You approve one exact plan. One transaction moves every matched transfer, or none of them.", "Kamu menyetujui satu rencana yang persis. Satu transaksi memindahkan semua transfer yang berpasangan, atau tidak satu pun."),
  blocks: [
    h2("approve", "Approving", "Menyetujui"),
    p(
      "A plan lists every transfer in the round (token, from, to, amount), the round, the price snapshot hash, and a validity window. Approving it takes two actions in your wallet:",
      "Rencana berisi setiap transfer dalam round (token, dari, ke, jumlah), round-nya, hash snapshot harga, dan jendela waktu berlaku. Menyetujuinya butuh dua tindakan di wallet:",
    ),
    ol(
      ["**Sign the plan** (free). Your EIP-712 signature covers the whole plan. Change one leg and the signature is worthless.", "**Tanda tangani rencana** (gratis). Tanda tangan EIP-712 mencakup seluruh rencana. Ubah satu leg dan tanda tangan itu tidak berlaku."],
      ["**Allow the exact amount** of each token you send. Sama asks for the amount in the plan, never an unlimited allowance.", "**Izinkan jumlah persis** setiap token yang kamu kirim. Sama meminta jumlah sesuai rencana, tidak pernah allowance tanpa batas."],
    ),
    preview("approval", ["Before any prompt, Sama lists what your wallet will ask.", "Sebelum pop-up apa pun, Sama menuliskan apa yang akan diminta wallet."]),
    h2("settle", "Settling", "Settlement"),
    p(
      "When every participant has approved, anyone in the round can send `settle()` to the SamaSettlement contract. It checks the time window, the participants, every signature and nonce, then calls `transferFrom` for each leg. If any leg fails (an insufficient balance, a missing allowance, a paused token) the whole call reverts.",
      "Setelah semua peserta menyetujui, siapa pun di round bisa mengirim `settle()` ke kontrak SamaSettlement. Kontrak mengecek jendela waktu, peserta, setiap tanda tangan dan nonce, lalu memanggil `transferFrom` untuk setiap leg. Bila satu leg gagal (saldo kurang, allowance kurang, token di-pause), seluruh panggilan dibatalkan.",
    ),
    ul(
      ["The contract never holds a token: every transfer goes straight from one wallet to another.", "Kontrak tidak pernah memegang token: setiap transfer langsung dari satu wallet ke wallet lain."],
      ["Each plan can settle once, and each approval nonce can be used once.", "Setiap rencana hanya bisa diselesaikan sekali, dan setiap nonce persetujuan hanya bisa dipakai sekali."],
      ["You can withdraw an unused approval at any time with `cancelNonce`.", "Kamu bisa menarik persetujuan yang belum dipakai kapan saja dengan `cancelNonce`."],
    ),
    h2("verify", "Verifying", "Verifikasi"),
    p(
      "After the transaction confirms, an independent verifier re-reads it through a different RPC provider and checks 17 things, from the receipt status to every balance change. See [Verification](/docs/verification).",
      "Setelah transaksi terkonfirmasi, verifier independen membaca ulang lewat penyedia RPC yang berbeda dan mengecek 17 hal, dari status receipt sampai setiap perubahan saldo. Lihat [Verifikasi](/docs/verification).",
    ),
    h2("gas", "Gas", "Gas"),
    p(
      "Signatures are always free. The allowance and `settle()` are ordinary BNB Chain transactions and need a little BNB today. Gas sponsorship through a BSC paymaster is planned so that holders without BNB can take part.",
      "Tanda tangan selalu gratis. Allowance dan `settle()` adalah transaksi BNB Chain biasa dan saat ini butuh sedikit BNB. Sponsor gas lewat paymaster BSC direncanakan agar pemegang yang tidak punya BNB tetap bisa ikut.",
    ),
  ],
};

export const leftovers: DocPage = {
  slug: "concepts/leftovers",
  title: t("Leftovers", "Sisa"),
  description: t("The part of your rebalance that didn't find a match. You decide what happens to it.", "Bagian rebalance-mu yang tidak berpasangan. Kamu yang memutuskan nasibnya."),
  blocks: [
    h2("choices", "Three choices", "Tiga pilihan"),
    preview("leftover", ["The choice you make after a round, with Sama's recommendation.", "Pilihan setelah round, beserta rekomendasi Sama."]),
    table(
      [["Choice", "Pilihan"], ["What happens", "Yang terjadi"], ["Cost", "Biaya"]],
      [
        [["Roll into the next round", "Bawa ke round berikutnya"], ["Your next intent is rebuilt from the same target, so the gap is tried again", "Intent berikutnya disusun ulang dari target yang sama, jadi selisihnya dicoba lagi"], ["Free", "Gratis"]],
        [["Swap now on PancakeSwap", "Swap sekarang di PancakeSwap"], ["You trade it from your own wallet at the current price", "Kamu trade dari wallet-mu sendiri dengan harga saat ini"], ["Pool fee, price impact, gas", "Fee pool, price impact, gas"]],
        [["Skip it", "Lewati"], ["Your target stays saved; nothing else trades", "Targetmu tetap tersimpan; tidak ada trade lain"], ["Free", "Gratis"]],
      ],
    ),
    h2("recommendation", "The recommendation", "Rekomendasi"),
    p(
      "Sama's leftover engine compares the measured all-in cost of each route (price impact + pool fee + gas, in dollars) with your cost cap and the market session. If swapping would cost more than your cap, it recommends rolling over instead and tells you why, for example \"This swap would cost 2.4%, above your 1% cap\".",
      "Mesin sisa Sama membandingkan biaya total terukur setiap rute (price impact + fee pool + gas, dalam dolar) dengan batas biayamu dan sesi pasar. Bila swap lebih mahal dari batasmu, Sama menyarankan membawanya ke round berikutnya dan menjelaskan alasannya, misalnya \"Swap ini akan memakan biaya 2,4%, di atas batasmu 1%\".",
    ),
    h2("swap", "How the swap works", "Cara kerja swap"),
    ol(
      ["Sama asks PancakeSwap for a quote and checks your router allowance.", "Sama meminta quote ke PancakeSwap dan mengecek allowance router kamu."],
      ["Your wallet sends the swap itself. Sama never takes custody, even here.", "Wallet-mu sendiri yang mengirim swap. Sama tidak pernah memegang aset, bahkan di sini."],
      ["Sama reads your balances back from the chain. A swap counts as done only if you received at least the quoted minimum (default slippage 0.5%).", "Sama membaca ulang saldo dari chain. Swap dianggap selesai hanya bila kamu menerima minimal jumlah quote (slippage default 0,5%)."],
    ),
    warn(
      "Swaps are only offered for tier A assets, which have a PancakeSwap pool, and only while the NYSE regular session is open. Tier B and C leftovers can be rolled over or skipped.",
      "Swap hanya ditawarkan untuk aset tier A, yang punya pool PancakeSwap, dan hanya saat sesi reguler NYSE buka. Sisa tier B dan C bisa dibawa ke round berikutnya atau dilewati.",
    ),
  ],
};

export const assets: DocPage = {
  slug: "concepts/assets",
  title: t("Supported assets", "Aset yang didukung"),
  description: t("88 bStocks on BNB Chain plus USDT as cash, identified by contract address and grouped into three tiers.", "88 bStocks di BNB Chain plus USDT sebagai kas, dikenali dari alamat kontrak dan dikelompokkan dalam tiga tier."),
  blocks: [
    h2("bstocks", "bStocks", "bStocks"),
    p(
      "bStocks are tokenized shares and ETFs issued by Binance on BNB Chain. Each token is backed 1:1 by the underlying share held by Nest Clearing and Custody (ADGM). Sama's allowlist currently has 88 of them: 75 stocks and 13 ETFs. USDT is the cash leg.",
      "bStocks adalah saham dan ETF tokenized yang diterbitkan Binance di BNB Chain. Setiap token didukung 1:1 oleh saham dasarnya yang disimpan Nest Clearing and Custody (ADGM). Allowlist Sama saat ini berisi 88: 75 saham dan 13 ETF. USDT menjadi kas.",
    ),
    h2("identity", "Identity by address", "Identitas dari alamat"),
    p(
      "BNB Chain has no single canonical token registry, so Sama identifies an asset by `chainId:address`. Symbols and names are display only. A lookalike token with the same symbol at a different address is always rejected.",
      "BNB Chain tidak punya registry token kanonik tunggal, jadi Sama mengenali aset dari `chainId:alamat`. Simbol dan nama hanya untuk tampilan. Token tiruan dengan simbol sama di alamat berbeda selalu ditolak.",
    ),
    h2("tiers", "Tiers", "Tier"),
    preview("tiers", ["What each tier can do.", "Apa yang bisa dilakukan setiap tier."]),
    table(
      [["Tier", "Tier"], ["Count", "Jumlah"], ["Pricing", "Harga"], ["Leftovers", "Sisa"]],
      [
        ["A", "18", ["Binance, cross-checked against an on-chain PancakeSwap TWAP", "Binance, dicek silang dengan TWAP PancakeSwap on-chain"], ["Roll over, swap, or skip", "Bawa, swap, atau lewati"]],
        ["B", "11", ["Binance only", "Hanya Binance"], ["Roll over or skip", "Bawa atau lewati"]],
        ["C", "59", ["Binance only; few holders or leveraged, so a match is unlikely", "Hanya Binance; pemegang sedikit atau leverage, jadi pasangan jarang ditemukan"], ["Roll over or skip", "Bawa atau lewati"]],
      ],
    ),
    h3("leveraged", "Leveraged ETFs", "ETF leverage"),
    p(
      "Leveraged and inverse ETFs lose value when held over time. The target editor warns before you add one.",
      "ETF leverage dan inverse kehilangan nilai bila dipegang lama. Editor target memberi peringatan sebelum kamu menambahkannya.",
    ),
    h2("checks", "Checks on every asset", "Cek pada setiap aset"),
    ul(
      ["Bytecode exists at the address, and `symbol()` and `decimals()` match the allowlist.", "Bytecode ada di alamat itu, dan `symbol()` serta `decimals()` cocok dengan allowlist."],
      ["The token is not fee-on-transfer and not rebasing.", "Token bukan fee-on-transfer dan bukan rebasing."],
      ["Pause and blocklist status is read when the token supports it; blocked wallets are left out of a plan.", "Status pause dan blocklist dibaca bila token mendukungnya; wallet yang diblokir dikeluarkan dari rencana."],
      ["bStocks use a share multiplier (BEP-8056). Wallet balances are shown as raw balance × multiplier.", "bStocks memakai pengali saham (BEP-8056). Saldo wallet ditampilkan sebagai saldo mentah × pengali."],
    ),
    h2("market-hours", "Market hours", "Jam bursa"),
    p(
      "Prices follow the US market sessions (regular, extended, overnight). Outside them, stock prices are the last close, the cross-check tolerance widens, and the leftover engine leans toward rolling over rather than swapping.",
      "Harga mengikuti sesi pasar AS (reguler, extended, overnight). Di luar sesi, harga saham adalah harga penutupan terakhir, toleransi cek silang melebar, dan mesin sisa cenderung menyarankan membawa ke round berikutnya daripada swap.",
    ),
  ],
};
