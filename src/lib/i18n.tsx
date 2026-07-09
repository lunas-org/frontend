"use client";

// Lightweight i18n — no routing changes, no dependency. A client context holds the active
// locale (persisted to localStorage, first-run guessed from the browser) and exposes t(key).
// Buyer pages read the same store, so a merchant who switches to Indonesian also gets Indonesian
// checkout/receipt links. Keys are grouped by screen ("checkout.title"). t() falls back to the
// English string, then the raw key, so a missing translation degrades gracefully rather than
// crashing. Interpolation: t("k", { name }) replaces {name} in the string.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Locale = "en" | "id";

const LS_KEY = "lunas:locale";

const en = {
  "common.usdc": "USDC",
  "common.back": "Back",
  "common.loading": "Loading…",
  "common.securedBy": "Secured by Lunas",
  "common.tryAgain": "Try again",
  "common.product": "Product",

  "lang.label": "Language",
  "lang.en": "EN",
  "lang.id": "ID",

  "nav.home": "Home",
  "nav.products": "Products",
  "nav.activity": "Activity",
  "nav.settings": "Settings",

  "landing.signIn": "Sign in",
  "landing.heroTitle": "Get paid from anywhere.",
  "landing.heroSubtitle":
    "Create a payment link in seconds. Your buyer pays however they like, and the status flips to Lunas ✓ the moment it's done.",
  "landing.startSelling": "Start selling",
  "landing.seeCheckout": "See a live checkout",
  "landing.noFees": "No setup fees · settle in seconds",
  "landing.howTitle": "How it works",
  "landing.how1Title": "Create a product",
  "landing.how1Desc": "Add a name and price. You get a payment link and QR instantly.",
  "landing.how2Title": "Share it",
  "landing.how2Desc": "Send the link on WhatsApp, or let buyers scan the QR in person.",
  "landing.how3Title": "Get Lunas ✓",
  "landing.how3Desc": "The moment payment lands, you both see it confirmed. No chasing.",
  "landing.whyTitle": "Why Lunas",
  "landing.why1Title": "Instant confirmation",
  "landing.why1Desc": "Payments confirm in seconds, not days.",
  "landing.why2Title": "Borderless",
  "landing.why2Desc": "Get paid by anyone, anywhere in the world.",
  "landing.why3Title": "No app needed",
  "landing.why3Desc": "Buyers pay from any phone browser.",
  "landing.why4Title": "Clean receipts",
  "landing.why4Desc": "Every payment gets a shareable receipt.",
  "landing.pricingTitle": "Pricing",
  "landing.pricingPer": "per successful payment. That's it.",
  "landing.pricingSub": "No monthly fees · no setup cost · no minimums",
  "landing.faqTitle": "Questions",
  "landing.faq1Q": "Do my buyers need an account?",
  "landing.faq1A": "No. They open your link, scan, and pay. That's the whole flow.",
  "landing.faq2Q": "When do I get my money?",
  "landing.faq2A": "Immediately. Your balance updates the second a payment confirms.",
  "landing.faq3Q": 'What does "Lunas" mean?',
  "landing.faq3A":
    'It means "paid in full." The green check is our promise: when you see Lunas ✓, the money is yours.',
  "landing.startFree": "Start selling free",
  "landing.footer": "© 2026 Lunas · Terms · Privacy",

  "login.welcome": "Welcome to Lunas",
  "login.subtitle": "Sign in to start getting paid.",
  "login.google": "Continue with Google",
  "login.signingIn": "Signing you in",
  "login.terms": "By continuing you agree to our Terms of Service and Privacy Policy.",
  "login.settingUp": "Setting up your account…",
  "login.wentWrong": "Something went wrong",

  "profile.title": "Say hi to your buyers",
  "profile.subtitle":
    "A name and photo make your checkout feel personal. Takes ten seconds, and you can change it anytime.",
  "profile.addPhoto": "Add photo",
  "profile.nameLabel": "Business or display name",
  "profile.namePlaceholder": "e.g. Studio Mira",
  "profile.nameHint": 'Buyers will see "Paying {name}"',
  "profile.waLabel": "WhatsApp number",
  "profile.optional": "optional",
  "profile.waPlaceholder": "+62 812 …",
  "profile.waHint": "Lets buyers reach you if they have a question.",
  "profile.continue": "Continue",
  "profile.skip": "Skip for now",
  "profile.doneTitle": "You're all set",
  "profile.doneSub": "Taking you to your dashboard…",
  "profile.defaultBusiness": "Your business",

  "dashboard.greeting": "Good to see you",
  "dashboard.balance": "Available balance",
  "dashboard.thisWeek": "+{amount} this week",
  "dashboard.createProduct": "Create product",
  "dashboard.recentOrders": "Recent orders",
  "dashboard.total": "{count} total",
  "dashboard.emptyTitle": "No orders yet",
  "dashboard.emptyDesc": "Share a product link and your first Lunas ✓ will show up here.",
  "dashboard.emptyCta": "Create your first product",
  "dashboard.paid": "Lunas ✓",
  "dashboard.pending": "Pending",
  "dashboard.errorTitle": "Something got disconnected",

  "products.title": "Products",
  "products.new": "New",
  "products.emptyTitle": "No products yet",
  "products.emptyDesc": "Create a product to get a payment link and QR you can share.",
  "products.emptyCta": "Create your first product",
  "products.paidCount": "{count} paid",

  "newProduct.title": "New product",
  "newProduct.nameLabel": "Product name",
  "newProduct.namePlaceholder": "e.g. Workshop ticket",
  "newProduct.nameError": "Give your product a name",
  "newProduct.priceLabel": "Price",
  "newProduct.priceError": "Enter a price above 0",
  "newProduct.buyersSee": "Buyers will see",
  "newProduct.payingName": "Paying {name}",
  "newProduct.yourProduct": "Your product",
  "newProduct.create": "Create payment link",
  "newProduct.creating": "Creating link…",

  "detail.paid": "{count} paid",
  "detail.scan": "Buyers scan this to pay instantly",
  "detail.copyLink": "Copy link",
  "detail.copied": "Copied",
  "detail.whatsapp": "WhatsApp",
  "detail.preview": "Preview as buyer",
  "detail.waShare": 'Pay for "{title}" ({price} USDC): {url}',
  "detail.sentTitle": "Ready to share",
  "detail.sentDesc": "Your payment link is on its way. The buyer just opens it, scans, and pays.",
  "detail.sentDone": "Done",

  "activity.title": "Activity",
  "activity.events": "{count} events",
  "activity.emptyTitle": "Nothing yet",
  "activity.emptyDesc": "When a buyer pays, you'll see the Lunas ✓ land right here.",
  "activity.paidTitle": "Payment received · Lunas ✓",
  "activity.createdTitle": "Payment link created",

  "settings.title": "Settings",
  "settings.editHint": "Tap name or photo to edit",
  "settings.businessName": "Business name",
  "settings.yourProducts": "Your products",
  "settings.noProducts": "No products yet.",
  "settings.account": "Account",
  "settings.logout": "Log out",
  "settings.logoutTitle": "Log out?",
  "settings.logoutDesc": "You'll need to sign in with Google again to manage your products.",
  "settings.logoutCancel": "Cancel",

  "checkout.paying": "Paying",
  "checkout.scan": "Scan with your payment app",
  "checkout.copyHint": "On this phone? Copy the code and paste it into your payment app.",
  "checkout.listening": "Listening for payment · updated {ago}",
  "checkout.justNow": "just now",
  "checkout.secondsAgo": "{s}s ago",
  "checkout.questions": "Questions? Message {name}",
  "checkout.processingTitle": "Listening for your payment",
  "checkout.processingSub": "Usually under ten seconds",
  "checkout.processingKeepOpen": "Keep this page open. It updates automatically.",
  "checkout.pendingTitle": "Payment detected",
  "checkout.pendingSub": "Confirming now. This only takes a moment.",
  "checkout.receivedFrom": "Payment from {chain} received",
  "checkout.successTitle": "Lunas ✓",
  "checkout.successSub": "Paid in full. You're all set.",
  "checkout.paidTo": "Paid to",
  "checkout.for": "For",
  "checkout.amount": "Amount",
  "checkout.receipt": "Receipt",
  "checkout.shareReceipt": "Share receipt",
  "checkout.viewReceipt": "View full receipt",
  "checkout.receiptCopied": "Receipt link copied",
  "checkout.addressCopied": "Payment code copied",
  "checkout.expiredTitle": "This link has expired",
  "checkout.expiredDesc": "Payment links are single-use for your safety. Ask the seller to send a fresh one.",
  "checkout.messageSeller": "Message the seller",
  "checkout.alreadyPaidTitle": "Already paid · Lunas ✓",
  "checkout.alreadyPaidDesc": "This order with {name} was already settled. No further payment is needed.",
  "checkout.viewReceiptShort": "View receipt",
  "checkout.almostTitle": "Almost there",
  "checkout.almostDesc": "We received {received} USDC, that's {remaining} USDC short of the {total} USDC total. Send the rest to finish.",
  "checkout.received": "Received",
  "checkout.stillNeeded": "Still needed",
  "checkout.sendRest": "Send the rest",
  "checkout.askHelp": "Ask the seller for help",
  "checkout.unsupportedTitle": "We can't accept that yet",
  "checkout.unsupportedDesc": "That payment method isn't supported here. Your funds are safe. Retrieve them, then pay with a different method.",
  "checkout.retrieve": "Retrieve my funds",
  "checkout.tryDifferent": "Try a different method",
  "checkout.defaultBusiness": "Your business",

  "receipt.paidInFull": "Paid in full · {date}",
  "receipt.paidTo": "Paid to",
  "receipt.for": "For",
  "receipt.amount": "Amount",
  "receipt.receipt": "Receipt",
  "receipt.share": "Share receipt",
  "receipt.message": "Message {name}",
  "receipt.purchase": "Purchase",

  "notFound.title": "This page wandered off",
  "notFound.desc": "The link may be broken or the page may have moved. Let's get you back on track.",
  "notFound.home": "Take me home",

  "error.title": "Something got disconnected",
  "error.desc": "We couldn't load this just now. Check your connection and try again.",

  "loadingPage.label": "Just a moment",

  "install.title": "Add Lunas to your home screen",
  "install.desc": "Open it like an app, one tap away.",
  "install.add": "Add",

  "offline.message": "You're offline. We'll reconnect automatically",

  "toast.profileUpdated": "Profile updated",
  "toast.linkCopied": "Payment link copied",
} as const;

type Key = keyof typeof en;

const id: Record<Key, string> = {
  "common.usdc": "USDC",
  "common.back": "Kembali",
  "common.loading": "Memuat…",
  "common.securedBy": "Diamankan oleh Lunas",
  "common.tryAgain": "Coba lagi",
  "common.product": "Produk",

  "lang.label": "Bahasa",
  "lang.en": "EN",
  "lang.id": "ID",

  "nav.home": "Beranda",
  "nav.products": "Produk",
  "nav.activity": "Aktivitas",
  "nav.settings": "Pengaturan",

  "landing.signIn": "Masuk",
  "landing.heroTitle": "Terima pembayaran dari mana saja.",
  "landing.heroSubtitle":
    "Buat tautan pembayaran dalam hitungan detik. Pembeli bayar sesuka mereka, dan status berubah jadi Lunas ✓ begitu selesai.",
  "landing.startSelling": "Mulai berjualan",
  "landing.seeCheckout": "Lihat contoh pembayaran",
  "landing.noFees": "Tanpa biaya setup · cair dalam hitungan detik",
  "landing.howTitle": "Cara kerjanya",
  "landing.how1Title": "Buat produk",
  "landing.how1Desc": "Tambah nama dan harga. Tautan pembayaran dan QR langsung jadi.",
  "landing.how2Title": "Bagikan",
  "landing.how2Desc": "Kirim tautan lewat WhatsApp, atau minta pembeli pindai QR langsung.",
  "landing.how3Title": "Dapatkan Lunas ✓",
  "landing.how3Desc": "Saat pembayaran masuk, kalian berdua langsung lihat konfirmasinya. Tanpa menagih.",
  "landing.whyTitle": "Kenapa Lunas",
  "landing.why1Title": "Konfirmasi instan",
  "landing.why1Desc": "Pembayaran terkonfirmasi dalam detik, bukan hari.",
  "landing.why2Title": "Tanpa batas",
  "landing.why2Desc": "Terima bayaran dari siapa pun, di mana pun.",
  "landing.why3Title": "Tanpa aplikasi",
  "landing.why3Desc": "Pembeli bayar dari browser HP mana saja.",
  "landing.why4Title": "Struk rapi",
  "landing.why4Desc": "Setiap pembayaran dapat struk yang bisa dibagikan.",
  "landing.pricingTitle": "Harga",
  "landing.pricingPer": "per pembayaran berhasil. Itu saja.",
  "landing.pricingSub": "Tanpa biaya bulanan · tanpa biaya setup · tanpa minimum",
  "landing.faqTitle": "Pertanyaan",
  "landing.faq1Q": "Apakah pembeli perlu akun?",
  "landing.faq1A": "Tidak. Mereka buka tautan, pindai, dan bayar. Itu saja prosesnya.",
  "landing.faq2Q": "Kapan saya menerima uangnya?",
  "landing.faq2A": "Langsung. Saldo Anda diperbarui begitu pembayaran terkonfirmasi.",
  "landing.faq3Q": 'Apa arti "Lunas"?',
  "landing.faq3A":
    'Artinya "terbayar penuh." Centang hijau adalah janji kami: saat Anda lihat Lunas ✓, uangnya sudah jadi milik Anda.',
  "landing.startFree": "Mulai jualan gratis",
  "landing.footer": "© 2026 Lunas · Ketentuan · Privasi",

  "login.welcome": "Selamat datang di Lunas",
  "login.subtitle": "Masuk untuk mulai menerima pembayaran.",
  "login.google": "Lanjut dengan Google",
  "login.signingIn": "Sedang masuk",
  "login.terms": "Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.",
  "login.settingUp": "Menyiapkan akun Anda…",
  "login.wentWrong": "Terjadi kesalahan",

  "profile.title": "Sapa pembeli Anda",
  "profile.subtitle":
    "Nama dan foto membuat halaman pembayaran terasa personal. Cuma sepuluh detik, bisa diubah kapan saja.",
  "profile.addPhoto": "Tambah foto",
  "profile.nameLabel": "Nama bisnis atau tampilan",
  "profile.namePlaceholder": "mis. Studio Mira",
  "profile.nameHint": 'Pembeli akan lihat "Membayar {name}"',
  "profile.waLabel": "Nomor WhatsApp",
  "profile.optional": "opsional",
  "profile.waPlaceholder": "+62 812 …",
  "profile.waHint": "Agar pembeli bisa menghubungi Anda kalau ada pertanyaan.",
  "profile.continue": "Lanjut",
  "profile.skip": "Nanti saja",
  "profile.doneTitle": "Semua siap",
  "profile.doneSub": "Mengantar Anda ke dasbor…",
  "profile.defaultBusiness": "Bisnis Anda",

  "dashboard.greeting": "Senang bertemu Anda",
  "dashboard.balance": "Saldo tersedia",
  "dashboard.thisWeek": "+{amount} minggu ini",
  "dashboard.createProduct": "Buat produk",
  "dashboard.recentOrders": "Pesanan terbaru",
  "dashboard.total": "{count} total",
  "dashboard.emptyTitle": "Belum ada pesanan",
  "dashboard.emptyDesc": "Bagikan tautan produk dan Lunas ✓ pertama Anda akan muncul di sini.",
  "dashboard.emptyCta": "Buat produk pertama Anda",
  "dashboard.paid": "Lunas ✓",
  "dashboard.pending": "Menunggu",
  "dashboard.errorTitle": "Koneksi terputus",

  "products.title": "Produk",
  "products.new": "Baru",
  "products.emptyTitle": "Belum ada produk",
  "products.emptyDesc": "Buat produk untuk mendapat tautan pembayaran dan QR yang bisa dibagikan.",
  "products.emptyCta": "Buat produk pertama Anda",
  "products.paidCount": "{count} dibayar",

  "newProduct.title": "Produk baru",
  "newProduct.nameLabel": "Nama produk",
  "newProduct.namePlaceholder": "mis. Tiket workshop",
  "newProduct.nameError": "Beri nama produk Anda",
  "newProduct.priceLabel": "Harga",
  "newProduct.priceError": "Masukkan harga di atas 0",
  "newProduct.buyersSee": "Pembeli akan lihat",
  "newProduct.payingName": "Membayar {name}",
  "newProduct.yourProduct": "Produk Anda",
  "newProduct.create": "Buat tautan pembayaran",
  "newProduct.creating": "Membuat tautan…",

  "detail.paid": "{count} dibayar",
  "detail.scan": "Pembeli pindai ini untuk bayar seketika",
  "detail.copyLink": "Salin tautan",
  "detail.copied": "Tersalin",
  "detail.whatsapp": "WhatsApp",
  "detail.preview": "Pratinjau sebagai pembeli",
  "detail.waShare": 'Bayar untuk "{title}" ({price} USDC): {url}',
  "detail.sentTitle": "Siap dibagikan",
  "detail.sentDesc": "Tautan pembayaran Anda dalam perjalanan. Pembeli tinggal membuka, memindai, dan membayar.",
  "detail.sentDone": "Selesai",

  "activity.title": "Aktivitas",
  "activity.events": "{count} kejadian",
  "activity.emptyTitle": "Belum ada apa-apa",
  "activity.emptyDesc": "Saat pembeli membayar, Lunas ✓ akan muncul tepat di sini.",
  "activity.paidTitle": "Pembayaran diterima · Lunas ✓",
  "activity.createdTitle": "Tautan pembayaran dibuat",

  "settings.title": "Pengaturan",
  "settings.editHint": "Ketuk nama atau foto untuk ubah",
  "settings.businessName": "Nama bisnis",
  "settings.yourProducts": "Produk Anda",
  "settings.noProducts": "Belum ada produk.",
  "settings.account": "Akun",
  "settings.logout": "Keluar",
  "settings.logoutTitle": "Keluar?",
  "settings.logoutDesc": "Anda perlu masuk lagi dengan Google untuk mengelola produk Anda.",
  "settings.logoutCancel": "Batal",

  "checkout.paying": "Membayar",
  "checkout.scan": "Pindai dengan aplikasi pembayaran Anda",
  "checkout.copyHint": "Buka di HP ini? Salin kode dan tempel ke aplikasi pembayaran Anda.",
  "checkout.listening": "Menunggu pembayaran · diperbarui {ago}",
  "checkout.justNow": "barusan",
  "checkout.secondsAgo": "{s} dtk lalu",
  "checkout.questions": "Ada pertanyaan? Hubungi {name}",
  "checkout.processingTitle": "Menunggu pembayaran Anda",
  "checkout.processingSub": "Biasanya di bawah sepuluh detik",
  "checkout.processingKeepOpen": "Biarkan halaman ini terbuka. Akan terupdate otomatis.",
  "checkout.pendingTitle": "Pembayaran terdeteksi",
  "checkout.pendingSub": "Sedang mengonfirmasi. Hanya sebentar.",
  "checkout.receivedFrom": "Pembayaran dari {chain} diterima",
  "checkout.successTitle": "Lunas ✓",
  "checkout.successSub": "Terbayar penuh. Semua beres.",
  "checkout.paidTo": "Dibayar ke",
  "checkout.for": "Untuk",
  "checkout.amount": "Jumlah",
  "checkout.receipt": "Struk",
  "checkout.shareReceipt": "Bagikan struk",
  "checkout.viewReceipt": "Lihat struk lengkap",
  "checkout.receiptCopied": "Tautan struk tersalin",
  "checkout.addressCopied": "Kode pembayaran tersalin",
  "checkout.expiredTitle": "Tautan ini sudah kedaluwarsa",
  "checkout.expiredDesc": "Tautan pembayaran hanya sekali pakai demi keamanan Anda. Minta penjual kirim yang baru.",
  "checkout.messageSeller": "Hubungi penjual",
  "checkout.alreadyPaidTitle": "Sudah dibayar · Lunas ✓",
  "checkout.alreadyPaidDesc": "Pesanan dengan {name} ini sudah lunas. Tidak perlu bayar lagi.",
  "checkout.viewReceiptShort": "Lihat struk",
  "checkout.almostTitle": "Hampir selesai",
  "checkout.almostDesc": "Kami menerima {received} USDC, kurang {remaining} USDC dari total {total} USDC. Kirim sisanya untuk selesai.",
  "checkout.received": "Diterima",
  "checkout.stillNeeded": "Masih kurang",
  "checkout.sendRest": "Kirim sisanya",
  "checkout.askHelp": "Minta bantuan penjual",
  "checkout.unsupportedTitle": "Belum bisa kami terima",
  "checkout.unsupportedDesc": "Metode pembayaran itu belum didukung di sini. Dana Anda aman. Ambil kembali, lalu bayar dengan metode lain.",
  "checkout.retrieve": "Ambil dana saya",
  "checkout.tryDifferent": "Coba metode lain",
  "checkout.defaultBusiness": "Bisnis Anda",

  "receipt.paidInFull": "Terbayar penuh · {date}",
  "receipt.paidTo": "Dibayar ke",
  "receipt.for": "Untuk",
  "receipt.amount": "Jumlah",
  "receipt.receipt": "Struk",
  "receipt.share": "Bagikan struk",
  "receipt.message": "Hubungi {name}",
  "receipt.purchase": "Pembelian",

  "notFound.title": "Halaman ini tersesat",
  "notFound.desc": "Tautannya mungkin rusak atau halamannya sudah pindah. Ayo kembali ke jalur.",
  "notFound.home": "Bawa saya pulang",

  "error.title": "Koneksi terputus",
  "error.desc": "Kami tidak bisa memuat ini sekarang. Periksa koneksi dan coba lagi.",

  "loadingPage.label": "Sebentar ya",

  "install.title": "Tambahkan Lunas ke layar utama",
  "install.desc": "Buka seperti aplikasi, satu ketukan saja.",
  "install.add": "Tambah",

  "offline.message": "Anda sedang offline. Kami akan menyambung ulang otomatis",

  "toast.profileUpdated": "Profil diperbarui",
  "toast.linkCopied": "Tautan pembayaran tersalin",
};

const DICTS: Record<Locale, Record<Key, string>> = { en, id };

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => en[key] ?? key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "en" || saved === "id") {
      setLocaleState(saved);
    } else if (navigator.language?.toLowerCase().startsWith("id")) {
      setLocaleState("id");
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LS_KEY, l);
    } catch {
      // localStorage unavailable — keep in-memory only
    }
  }, []);

  const t = useCallback(
    (key: Key, vars?: Record<string, string | number>) => {
      let s: string = DICTS[locale][key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      }
      return s;
    },
    [locale]
  );

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
