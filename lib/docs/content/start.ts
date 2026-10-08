import { cards, h2, h3, note, ol, p, preview, steps, table, tip, ul, warn, t, type DocPage } from "../types";

export const introduction: DocPage = {
  slug: "",
  title: t("Introduction", "Pengenalan"),
  description: t(
    "Sama pairs wallets whose share-token rebalances point opposite ways on BNB Chain and settles each match wallet to wallet in one transaction.",
    "Sama memasangkan wallet yang rebalance token sahamnya berlawanan arah di BNB Chain dan menyelesaikan setiap pasangan wallet-ke-wallet dalam satu transaksi.",
  ),
  blocks: [
    h2("what-is-sama", "What Sama is", "Apa itu Sama"),
    p(
      "When you rebalance a portfolio of tokenized shares, somebody else on the same chain is often doing the exact opposite. Sama collects those rebalances in short, scheduled **rounds**, finds the parts that fit together, and moves the shares directly between the wallets involved. Only what stays unmatched is left for you to decide.",
      "Saat kamu rebalance portofolio saham tokenized, sering ada orang lain di chain yang sama yang melakukan kebalikannya. Sama mengumpulkan rebalance itu dalam **round** singkat yang terjadwal, mencari bagian yang saling cocok, lalu memindahkan sahamnya langsung di antara wallet yang terlibat. Hanya bagian yang tidak berpasangan yang diserahkan kepadamu.",
    ),
    preview("pair", ["Two wallets heading opposite ways: Sama settles the overlap between them, and nothing passes through a pool.", "Dua wallet yang bergerak berlawanan: Sama menyelesaikan bagian yang tumpang tindih di antara mereka, tanpa lewat pool."]),
    p(
      "The name comes from Indonesian: *sama* means both \"the same\" and, as *bersama*, \"together\". Two wallets holding the same shares, moving in opposite directions, settle together.",
      "Nama Sama berasal dari bahasa Indonesia: *sama* berarti setara, dan *bersama* berarti together. Dua wallet yang memegang saham yang sama tapi bergerak berlawanan, diselesaikan bersama.",
    ),
    h2("principles", "Four things that never change", "Empat hal yang tidak pernah berubah"),
    ul(
      ["**Your keys, your tokens.** Shares go straight from wallet to wallet. The settlement contract never holds a token, before or after.", "**Kunci dan token tetap milikmu.** Saham berpindah langsung dari wallet ke wallet. Kontrak settlement tidak pernah memegang token, sebelum maupun sesudahnya."],
      ["**You approve exact amounts.** Every transfer, amount and deadline is in the plan you sign. A different plan means a different signature.", "**Kamu menyetujui jumlah persis.** Setiap transfer, jumlah, dan batas waktu ada di rencana yang kamu tanda tangani. Rencana berbeda berarti tanda tangan berbeda."],
      ["**All or nothing.** Every matched transfer in a round lands in one transaction. If any one fails, none of them move.", "**Semua atau tidak sama sekali.** Semua transfer yang berpasangan dalam satu round masuk dalam satu transaksi. Bila satu gagal, tidak ada yang berpindah."],
      ["**Checked afterwards.** A separate verifier re-reads every settlement from the chain through its own RPC and publishes the result on your receipt.", "**Dicek setelahnya.** Verifier terpisah membaca ulang setiap settlement dari chain lewat RPC-nya sendiri dan mencantumkan hasilnya di struk."],
    ),
    h2("where-to-start", "Where to start", "Mulai dari mana"),
    cards(
      { title: ["Quickstart", "Mulai cepat"], text: ["From sign-in to your first round in a few minutes.", "Dari masuk sampai round pertamamu dalam beberapa menit."], href: "/docs/quickstart", icon: "pulse" },
      { title: ["Why Sama", "Kenapa Sama"], text: ["What rebalancing alone costs, and where the savings come from.", "Berapa biaya rebalance sendirian, dan dari mana penghematannya."], href: "/docs/why-sama", icon: "book" },
      { title: ["How a round works", "Cara kerja round"], text: ["Join, match, approve, settle, decide the rest.", "Gabung, cocokkan, setujui, settle, putuskan sisanya."], href: "/docs/concepts/rounds", icon: "round" },
      { title: ["Security model", "Model keamanan"], text: ["What you sign, what the contract can do, and what it can't.", "Apa yang kamu tanda tangani, apa yang bisa dilakukan kontrak, dan apa yang tidak."], href: "/docs/security", icon: "shield" },
      { title: ["Architecture", "Arsitektur"], text: ["How the frontend, API, matcher, contract and verifier fit together.", "Bagaimana frontend, API, matcher, kontrak, dan verifier saling terhubung."], href: "/docs/developers/architecture", icon: "layers" },
      { title: ["API reference", "Referensi API"], text: ["Every route the app uses, with inputs and outputs.", "Semua route yang dipakai aplikasi, beserta input dan output-nya."], href: "/docs/developers/api", icon: "code" },
    ),
    h2("status", "Current status", "Status saat ini"),
    table(
      [["Area", "Area"], ["Status", "Status"]],
      [
        [["Network", "Jaringan"], ["BNB Smart Chain mainnet (56); testnet 97 for development", "BNB Smart Chain mainnet (56); testnet 97 untuk pengembangan"]],
        [["Assets", "Aset"], ["88 bStocks (stocks and ETFs), WBNB for BNB, and USDT as cash", "88 bStocks (saham dan ETF), WBNB untuk BNB, dan USDT sebagai kas"]],
        ["SamaSettlement", "`0x7811a30D29d6c2Ca95Aeb4EE9D896cE44Cb72AC8`"],
        [["Plan size limit", "Batas nilai plan"], ["$500 matched per plan while the contract is unaudited", "$500 yang dicocokkan per plan selama kontrak belum diaudit"]],
        [["Gas sponsorship", "Sponsor gas"], ["Planned. Approvals and settlement need a little BNB today", "Direncanakan. Approval dan settlement saat ini masih butuh sedikit BNB"]],
      ],
    ),
    warn(
      "The settlement contract has not had an external audit yet. Keep amounts small. Sama is coordination software: it gives no investment advice and does not decide whether you may trade an asset.",
      "Kontrak settlement belum diaudit pihak luar. Gunakan nilai kecil. Sama adalah perangkat koordinasi: tidak memberi nasihat investasi dan tidak menentukan apakah kamu boleh memperdagangkan suatu aset.",
      ["Before you use real funds", "Sebelum memakai dana sungguhan"],
    ),
  ],
};

export const whySama: DocPage = {
  slug: "why-sama",
  title: t("Why Sama", "Kenapa Sama"),
  description: t(
    "Rebalancing tokenized shares alone is expensive. Here is where the cost comes from and which part of it Sama removes.",
    "Rebalance saham tokenized sendirian itu mahal. Ini sumber biayanya dan bagian mana yang dihilangkan Sama.",
  ),
  blocks: [
    h2("the-cost", "The cost of rebalancing alone", "Biaya rebalance sendirian"),
    p(
      "A rebalance is a set of sells and buys. On a DEX each of them meets a pool, and every pool trade pays three things:",
      "Rebalance adalah sekumpulan jual dan beli. Di DEX masing-masing bertemu pool, dan setiap trade di pool membayar tiga hal:",
    ),
    ul(
      ["**Spread and fees**: the pool's fee tier on every swap.", "**Spread dan fee**: fee pool di setiap swap."],
      ["**Price impact**: tokenized shares sit in shallow pools, so a modest order moves the price against you.", "**Price impact**: saham tokenized ada di pool yang dangkal, jadi order biasa saja sudah menggeser harga melawanmu."],
      ["**Gas and approvals**: one approval per token, one swap per leg.", "**Gas dan approval**: satu approval per token, satu swap per leg."],
    ),
    p(
      "At 2 pm one wallet trims NVDAB. At 3 pm another adds it. Both pay all three costs, and neither ever learns the other existed. The trade they needed was with each other.",
      "Jam 2 siang satu wallet mengurangi NVDAB. Jam 3 wallet lain menambahnya. Keduanya membayar ketiga biaya itu, dan tidak pernah tahu yang lain ada. Trade yang mereka butuhkan sebenarnya dengan satu sama lain.",
    ),
    h2("pairs-and-loops", "Pairs, and loops nobody sees", "Pasangan, dan putaran yang tidak terlihat"),
    p(
      "Pairs are the easy case. The interesting one is a loop: Maya wants to swap AAPLB into TSLAB, Alex TSLAB into NVDAB, and you NVDAB into AAPLB. No two of you fit together, so a pair-only matcher finds nothing. Taken as a group, all three rebalances close.",
      "Pasangan adalah kasus mudah. Yang menarik adalah putaran: Maya mau menukar AAPLB ke TSLAB, Alex TSLAB ke NVDAB, dan kamu NVDAB ke AAPLB. Tidak ada dua dari kalian yang cocok, jadi matcher yang hanya mencari pasangan tidak menemukan apa pun. Dilihat sebagai satu kelompok, ketiganya tertutup.",
    ),
    preview("ring", ["A three-wallet loop. No pair matches; the group does.", "Putaran tiga wallet. Tidak ada pasangan yang cocok; kelompoknya cocok."]),
    p(
      "Sama's solver looks at the whole round at once, so a match can run through three, four or more wallets. See [Matching](/docs/concepts/matching) for how.",
      "Solver Sama melihat seluruh round sekaligus, jadi satu pasangan bisa melibatkan tiga, empat, atau lebih wallet. Lihat [Pencocokan](/docs/concepts/matching) untuk caranya.",
    ),
    h2("what-changes", "What changes with Sama", "Apa yang berubah dengan Sama"),
    table(
      [["", ""], ["Alone on a DEX", "Sendirian di DEX"], ["With Sama", "Dengan Sama"]],
      [
        [["Who you trade with", "Dengan siapa kamu trade"], ["A pool", "Pool"], ["Wallets heading the other way", "Wallet yang bergerak berlawanan"]],
        [["Price", "Harga"], ["Whatever the pool gives after impact", "Harga pool setelah impact"], ["One snapshot price for the whole round", "Satu harga snapshot untuk seluruh round"]],
        [["Transactions", "Transaksi"], ["One swap per leg", "Satu swap per leg"], ["One settlement for every match in the round", "Satu settlement untuk semua pasangan dalam round"]],
        [["The unmatched part", "Bagian yang tidak berpasangan"], ["—", "—"], ["Roll into the next round, swap on PancakeSwap, or skip", "Bawa ke round berikutnya, swap di PancakeSwap, atau lewati"]],
      ],
    ),
    note(
      "Sama does not promise a saving on every round. If nobody in a round is heading the other way, nothing matches and nothing moves. That is a valid result, not an error.",
      "Sama tidak menjanjikan penghematan di setiap round. Bila tidak ada yang bergerak berlawanan dalam satu round, tidak ada yang cocok dan tidak ada yang berpindah. Itu hasil yang sah, bukan error.",
    ),
    h2("who-its-for", "Who it's for", "Untuk siapa"),
    ul(
      ["**Long-term holders** who rebalance a basket of bStocks to a target mix on a schedule.", "**Pemegang jangka panjang** yang rebalance sekumpulan bStock ke komposisi target secara terjadwal."],
      ["**Communities and clubs** that already share a watchlist and want to trade it together. A Circle is exactly that group.", "**Komunitas dan klub** yang sudah berbagi watchlist dan mau trade bersama. Circle adalah kelompok itu."],
      ["**Builders** who want a non-custodial, verifiable settlement layer for multi-party trades. See the [developer docs](/docs/developers/architecture).", "**Builder** yang butuh lapisan settlement non-kustodial dan bisa diverifikasi untuk trade banyak pihak. Lihat [docs developer](/docs/developers/architecture)."],
    ),
  ],
};

export const quickstart: DocPage = {
  slug: "quickstart",
  title: t("Quickstart", "Mulai cepat"),
  description: t("From sign-in to your first settled round.", "Dari masuk sampai round pertamamu selesai."),
  blocks: [
    h2("before-you-start", "Before you start", "Sebelum mulai"),
    ul(
      ["An email address, or a wallet such as MetaMask, Trust Wallet, Binance Wallet or OKX Wallet.", "Alamat email, atau wallet seperti MetaMask, Trust Wallet, Binance Wallet, atau OKX Wallet."],
      ["Some bStocks, BNB or USDT on BNB Chain. You can finish setup without them and add assets later.", "Sedikit bStocks, BNB, atau USDT di BNB Chain. Kamu bisa menyelesaikan setup tanpanya dan menambah aset nanti."],
      ["A little BNB for gas, until gas sponsorship goes live.", "Sedikit BNB untuk gas, sampai sponsor gas aktif."],
    ),
    h2("first-round", "Your first round", "Round pertamamu"),
    steps(
      [["Sign in", "Masuk"], ["Open [sama](/start) and continue with email (you get an embedded wallet) or connect your own wallet. Sama never sees your keys.", "Buka [sama](/start) lalu lanjut dengan email (kamu mendapat embedded wallet) atau hubungkan wallet-mu sendiri. Sama tidak pernah melihat kunci kamu."]],
      [["Check your portfolio", "Cek portofolio"], ["Sama reads your balances straight from BNB Chain and lists every asset it supports. Open any token for its chart, size and latest trades. To rebalance BNB, convert it to WBNB with **Convert BNB**.", "Sama membaca saldo langsung dari BNB Chain dan menampilkan setiap aset yang didukung. Buka token mana pun untuk melihat chart, ukuran pasar, dan trade terbarunya. Untuk me-rebalance BNB, ubah dulu menjadi WBNB lewat **Ubah BNB**."]],
      [["Set a target", "Atur target"], ["Pick a preset or type a percentage per token. The total must be exactly 100%. Sama previews what it would take to get there before you save.", "Pilih preset atau ketik persentase tiap token. Totalnya harus tepat 100%. Sama menunjukkan apa yang dibutuhkan untuk mencapainya sebelum kamu simpan."]],
      [["Join a Circle", "Gabung Circle"], ["Pick a Circle that trades the assets you hold, or start your own and invite people.", "Pilih Circle yang memperdagangkan aset yang kamu pegang, atau buat sendiri dan undang orang lain."]],
      [["Sign into the round", "Tanda tangan untuk ikut round"], ["One free signature adds your rebalance to the open round. Nothing moves yet.", "Satu tanda tangan gratis menambahkan rebalance-mu ke round yang sedang dibuka. Belum ada yang berpindah."]],
      [["Approve your match", "Setujui pasanganmu"], ["When the round closes, Sama shows exactly what you send and receive. Approve the plan and allow those exact amounts.", "Saat round ditutup, Sama menunjukkan persis apa yang kamu kirim dan terima. Setujui rencananya dan izinkan jumlah persis itu."]],
      [["Settle and decide the rest", "Settle dan putuskan sisanya"], ["Anyone in the round can submit the settlement. Afterwards, choose what happens to anything that didn't match, then open your receipt.", "Siapa pun di round bisa mengirim settlement. Setelah itu, pilih nasib bagian yang tidak berpasangan, lalu buka strukmu."]],
    ),
    tip(
      "No assets yet? Try the [demo](/demo) first. It replays a real round with sample data and moves nothing.",
      "Belum punya aset? Coba [demo](/demo) dulu. Demo memutar ulang round sungguhan dengan data contoh dan tidak memindahkan apa pun.",
    ),
    h2("what-you-sign", "What your wallet will ask", "Apa yang akan diminta wallet"),
    p(
      "Sama tells you before each prompt how many times your wallet will open and what each one does.",
      "Sama memberi tahu sebelum setiap pop-up berapa kali wallet akan terbuka dan apa fungsinya.",
    ),
    table(
      [["Step", "Langkah"], ["Kind", "Jenis"], ["Cost", "Biaya"]],
      [
        [["Join a round", "Ikut round"], ["EIP-712 signature (intent)", "Tanda tangan EIP-712 (intent)"], ["Free", "Gratis"]],
        [["Approve the plan", "Setujui rencana"], ["EIP-712 signature (plan approval)", "Tanda tangan EIP-712 (persetujuan rencana)"], ["Free", "Gratis"]],
        [["Allow tokens", "Izinkan token"], ["`approve` for the exact amount", "`approve` untuk jumlah persis"], ["Gas", "Gas"]],
        [["Settle", "Settle"], ["`settle()` transaction, one participant sends it", "Transaksi `settle()`, dikirim satu peserta"], ["Gas", "Gas"]],
        [["Swap leftovers", "Swap sisa"], ["PancakeSwap swap from your own wallet", "Swap PancakeSwap dari wallet-mu sendiri"], ["Gas + pool fee", "Gas + fee pool"]],
      ],
    ),
    h3("next", "Next", "Selanjutnya"),
    ol(
      ["Read how [targets](/docs/concepts/targets) turn into what you sign.", "Baca bagaimana [target](/docs/concepts/targets) diubah menjadi yang kamu tanda tangani."],
      ["Learn the [round lifecycle](/docs/concepts/rounds) and what each state means.", "Pelajari [siklus round](/docs/concepts/rounds) dan arti setiap state."],
    ),
  ],
};
