# CikguJu Ebook Store — Panduan Deploy

## Struktur fail
```
index.html              -> Laman web utama (statik, untuk GitHub Pages)
api/create-bill.js       -> Fungsi serverless (Vercel-style) yang cipta bil ToyyibPay
README.md                -> Panduan ini
```

## Kenapa perlu dua tempat hosting?

GitHub Pages **hanya boleh serve fail statik** (HTML/CSS/JS) — ia tidak boleh
run kod backend. Tapi ToyyibPay punya API "Create Bill" **wajib** guna Secret
Key akaun anda, dan Secret Key ini **tidak boleh** letak dalam kod frontend
sebab sesiapa boleh copy dari browser (View Source) dan guna akaun
ToyyibPay anda untuk cipta/urus bil.

Penyelesaian standard: kekalkan `index.html` di GitHub Pages seperti biasa,
dan deploy folder `api/` secara berasingan ke platform yang boleh run kod
server (Vercel, Netlify Functions, atau Cloudflare Workers — semua ada free
tier yang cukup untuk kegunaan kedai ebook kecil-kecilan).

```
[Pelawat] --> [GitHub Pages: index.html]
                     |
                     |  fetch(API_ENDPOINT)
                     v
            [Vercel Function: api/create-bill.js]
                     |
                     |  guna TOYYIBPAY_SECRET_KEY (rahsia)
                     v
              [ToyyibPay API] --> paymentUrl
```

## Langkah 1 — Deploy index.html ke GitHub Pages
1. Push `index.html` ke repo GitHub anda (root, atau folder `/docs`).
2. Settings → Pages → pilih branch & folder → Save.
3. Site anda akan live di `https://username.github.io/repo-name/`.

## Langkah 2 — Dapatkan akaun & kelayakan ToyyibPay
1. Daftar di https://toyyibpay.com (atau https://dev.toyyibpay.com untuk sandbox/testing).
2. Buat satu **Category** (contoh: "Ebook CikguJu") → salin **Category Code**.
3. Pergi ke Settings → salin **Secret Key** anda.
4. *Sangat penting:* jangan kongsi Secret Key dalam chat, kod frontend, atau repo awam.

## Langkah 3 — Deploy fungsi backend (contoh guna Vercel, percuma)
1. Buat repo/folder berasingan yang mengandungi folder `api/create-bill.js`.
2. Install Vercel CLI: `npm i -g vercel`, kemudian `vercel login`.
3. Dalam folder projek: `vercel` (ikut arahan untuk deploy).
4. Di dashboard Vercel → Project → Settings → Environment Variables, tambah:
   - `TOYYIBPAY_SECRET_KEY` = secret key anda
   - `TOYYIBPAY_CATEGORY_CODE` = category code anda
   - `TOYYIBPAY_BASE_URL` = `https://dev.toyyibpay.com` (sandbox) atau `https://toyyibpay.com` (live)
   - `SITE_URL` = URL GitHub Pages anda
5. Redeploy (`vercel --prod`) supaya environment variables terpakai.
6. Anda akan dapat URL seperti `https://nama-projek.vercel.app/api/create-bill`.

## Langkah 4 — Sambungkan frontend ke backend
Dalam `index.html`, cari baris:
```js
const API_ENDPOINT = "https://YOUR-BACKEND-URL.example.com/api/create-bill";
```
Tukar kepada URL fungsi Vercel anda dari Langkah 3, commit & push semula.

## Langkah 5 — Uji dalam mod sandbox dahulu
Guna `https://dev.toyyibpay.com` dan akaun sandbox untuk test seluruh alur
(klik "Beli Sekarang" → checkout modal → redirect ke ToyyibPay → bayaran test
→ return URL) sebelum tukar ke `https://toyyibpay.com` (live) untuk transaksi
sebenar.

## Langkah 6 — Tukar nombor WhatsApp
Dalam `index.html`, cari:
```html
href="https://wa.me/60123456789?text=..."
```
Tukar `60123456789` kepada nombor WhatsApp perniagaan sebenar anda (format:
kod negara + nombor, tanpa "+" atau "0" di depan, contoh 60123456789 untuk
012-345 6789).

## Langkah 7 (pilihan) — Hantar pautan ebook secara automatik
`billCallbackUrl` dalam `create-bill.js` menghala ke satu lagi endpoint
(`/api/toyyibpay-callback`) yang perlu anda tambah sendiri — ToyyibPay akan
"ping" endpoint itu selepas bayaran berjaya, dan di situlah anda boleh:
- Semak status bayaran (`status_id === "1"` bermakna berjaya),
- Hantar emel automatik dengan pautan muat turun (guna servis seperti
  Resend, SendGrid, atau Google Apps Script + Gmail),
- Atau log transaksi ke Google Sheet / database untuk rekod.

Ini bahagian yang paling spesifik kepada cara anda nak "hantar" ebook
(pautan Google Drive, Dropbox terkunci, atau fail terus) — beritahu saya
kaedah pilihan anda dan saya boleh bina kod untuk bahagian ini juga.

## Nota keselamatan
- Jangan sekali-kali paste Secret Key ToyyibPay dalam mesej chat, kod
  frontend, atau commit ke repo awam.
- Guna environment variables (seperti dalam panduan atas) untuk semua
  kunci rahsia.
