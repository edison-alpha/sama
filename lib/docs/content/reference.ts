import { en } from "@/lib/i18n/en";
import { id } from "@/lib/i18n/id";
import { p, t, type Block, type DocPage } from "../types";

/** Built from the app dictionaries, so the glossary here and the dotted-word tooltips in the app never disagree. */
const glossaryBlocks: Block[] = (Object.keys(en.glossary) as Array<keyof typeof en.glossary>).flatMap((k) => [
  { t: "h3", id: k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), text: t(en.glossary[k][0], id.glossary[k][0]) } as Block,
  { t: "p", text: t(en.glossary[k][1], id.glossary[k][1]) } as Block,
]);

export const glossary: DocPage = {
  slug: "glossary",
  title: t("Glossary", "Glosarium"),
  description: t("Every term the app uses, in plain words. Dotted words in the app link to these definitions.", "Setiap istilah yang dipakai aplikasi, dengan bahasa sederhana. Kata bergaris titik di aplikasi merujuk ke definisi ini."),
  blocks: [
    ...glossaryBlocks,
    { t: "h3", id: "intent", text: t("Intent", "Intent") },
    p("Your signed limits for one round: per asset, the most you will send and receive. It moves nothing by itself.", "Batas bertanda tangan untuk satu round: per aset, jumlah maksimal yang kamu kirim dan terima. Intent tidak memindahkan apa pun dengan sendirinya."),
    { t: "h3", id: "plan", text: t("Plan", "Rencana") },
    p("The exact list of transfers in a round that every participant approves and one transaction executes.", "Daftar transfer persis dalam satu round yang disetujui semua peserta dan dieksekusi satu transaksi."),
    { t: "h3", id: "snapshot", text: t("Price snapshot", "Snapshot harga") },
    p("One price per asset for the whole round, pinned to one block. Its hash is in every intent and plan.", "Satu harga per aset untuk seluruh round, dikunci pada satu blok. Hash-nya ada di setiap intent dan rencana."),
    { t: "h3", id: "tier", text: t("Tier", "Tier") },
    p("A, B or C: how an asset is priced and whether its leftovers can be swapped. See [Supported assets](/docs/concepts/assets).", "A, B, atau C: bagaimana aset diberi harga dan apakah sisanya bisa di-swap. Lihat [Aset yang didukung](/docs/concepts/assets)."),
    { t: "h3", id: "wbnb", text: t("WBNB", "WBNB") },
    p("BNB wrapped as a token, always worth exactly 1 BNB. Sama trades BNB as WBNB because settlement moves tokens only. Convert BNB on the Portfolio page switches between the two.", "BNB yang dibungkus menjadi token, nilainya selalu tepat 1 BNB. Sama memperdagangkan BNB sebagai WBNB karena settlement hanya memindahkan token. Ubah BNB di halaman Portofolio menukar keduanya."),
    { t: "h3", id: "token-page", text: t("Token page", "Halaman token") },
    p("A token's chart, size and latest trades from its deepest on-chain pool. For reading only: rounds use their own price snapshot. See [Token pages](/docs/concepts/assets#token-pages).", "Chart, ukuran pasar, dan trade terbaru sebuah token dari pool on-chain terdalamnya. Hanya untuk dibaca: round memakai snapshot harganya sendiri. Lihat [Halaman token](/docs/concepts/assets#token-pages)."),
    { t: "h3", id: "dust", text: t("Dust", "Dust") },
    p("A leftover under $0.10, too small for any market. It is reported, never traded.", "Sisa di bawah $0,10, terlalu kecil untuk pasar mana pun. Dicatat, tidak pernah di-trade."),
  ],
};

const FAQ: Array<[[string, string], [string, string]]> = [
  ...en.faq.map((q, i) => [[q[0], id.faq[i]![0]], [q[1], id.faq[i]![1]]] as [[string, string], [string, string]]),
  [["Why did nothing match in my round?", "Kenapa tidak ada yang cocok di round-ku?"], ["Matching needs somebody heading the other way on the same assets at the same time. A small Circle, a one-sided market, or assets few people hold (tier C) all make a match less likely. Roll your leftover into the next round or invite people who trade the same assets.", "Pencocokan butuh orang yang bergerak berlawanan pada aset yang sama di waktu yang sama. Circle kecil, pasar satu arah, atau aset yang sedikit pemegangnya (tier C) membuat pasangan jarang ditemukan. Bawa sisamu ke round berikutnya atau undang orang yang memperdagangkan aset yang sama."]],
  [["Can I leave a round after joining?", "Bisakah aku keluar dari round setelah bergabung?"], ["Joining only signs your limits; nothing moves until you approve a plan. If you don't approve, the plan expires after 30 minutes and nothing moves. After approving, you can still withdraw with `cancelNonce` before settlement.", "Bergabung hanya menandatangani batasmu; tidak ada yang berpindah sampai kamu menyetujui rencana. Bila tidak menyetujui, rencana kedaluwarsa setelah 30 menit dan tidak ada yang berpindah. Setelah menyetujui, kamu masih bisa menariknya dengan `cancelNonce` sebelum settlement."]],
  [["Who sends the settlement transaction?", "Siapa yang mengirim transaksi settlement?"], ["Any participant. Once everyone approved, the first person to press Submit settlement pays the gas for everyone's transfers.", "Peserta mana pun. Setelah semua menyetujui, orang pertama yang menekan Kirim settlement membayar gas untuk semua transfer."]],
  [["What price do I get?", "Harga apa yang aku dapat?"], ["The round's snapshot price, the same for every member. It is shown before you join and again before you approve.", "Harga snapshot round, sama untuk semua anggota. Ditampilkan sebelum kamu bergabung dan lagi sebelum kamu menyetujui."]],
  [["Does Sama charge a fee?", "Apakah Sama memungut biaya?"], ["The settlement contract takes no fee. You pay network gas for allowances and settlement, and PancakeSwap's pool fee if you choose to swap a leftover.", "Kontrak settlement tidak memungut biaya. Kamu membayar gas jaringan untuk allowance dan settlement, dan fee pool PancakeSwap bila memilih swap sisa."]],
  [["Why is BNB traded as WBNB?", "Kenapa BNB diperdagangkan sebagai WBNB?"], ["The settlement contract moves tokens with `transferFrom`, and native BNB is not a token. WBNB is the same BNB wrapped one to one. Use Convert BNB on the Portfolio page to wrap it before a round and unwrap it afterwards.", "Kontrak settlement memindahkan token lewat `transferFrom`, dan BNB native bukan token. WBNB adalah BNB yang sama, dibungkus satu banding satu. Pakai Ubah BNB di halaman Portofolio untuk membungkusnya sebelum round dan membukanya sesudahnya."]],
  [["Why is the price on a token page different from my round's price?", "Kenapa harga di halaman token berbeda dari harga round-ku?"], ["The token page shows the price in the token's on-chain pool. A round uses one Binance price snapshot for everyone, cross-checked on-chain for tier A. The two are usually close but can differ, and the round price is the one you trade at.", "Halaman token menampilkan harga di pool on-chain token itu. Round memakai satu snapshot harga Binance untuk semua anggota, yang dicek silang on-chain untuk tier A. Keduanya biasanya dekat tapi bisa berbeda, dan harga round itulah yang kamu pakai untuk trade."]],
  [["Why does a token page show no chart or no trades?", "Kenapa halaman token tidak menampilkan chart atau trade?"], ["Some tokens, mostly tier C, have a pool with no trades in the past day, and a few have no on-chain pool at all. The page says so rather than drawing an empty chart. If market data is briefly unavailable, it retries on its own.", "Sebagian token, kebanyakan tier C, punya pool tanpa trade dalam sehari terakhir, dan beberapa tidak punya pool on-chain sama sekali. Halamannya mengatakan itu, bukan menggambar chart kosong. Bila data pasar sesaat tidak tersedia, halaman mencoba lagi sendiri."]],
  [["Can the AI assistant move my funds?", "Apakah asisten AI bisa memindahkan danaku?"], ["No. It reads your data through the API and can only propose. A suggested target, Circle or page is a button, and nothing happens until you press it and, for a target, save it yourself.", "Tidak. Asisten membaca datamu lewat API dan hanya bisa mengusulkan. Target, Circle, atau halaman yang disarankan berupa tombol, dan tidak ada yang terjadi sampai kamu menekannya dan, untuk target, menyimpannya sendiri."]],
  [["Can other members see my address?", "Bisakah anggota lain melihat alamatku?"], ["Not in Sama: members appear as Peer 2, Peer 3. The settlement itself is a public BNB Chain transaction, like any other.", "Tidak di Sama: anggota tampil sebagai Anggota 2, Anggota 3. Settlement-nya sendiri adalah transaksi BNB Chain publik, seperti transaksi lainnya."]],
];

export const faq: DocPage = {
  slug: "faq",
  title: t("FAQ", "Pertanyaan umum"),
  description: t("Short answers to what people ask most.", "Jawaban singkat untuk pertanyaan yang paling sering diajukan."),
  blocks: FAQ.flatMap(([q, a], i) => [
    { t: "h3", id: `q-${i + 1}`, text: t(...q) } as Block,
    { t: "p", text: t(...a) } as Block,
  ]),
};
