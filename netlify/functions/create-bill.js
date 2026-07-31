/**
 * Serverless function: creates a ToyyibPay bill and returns the payment URL.
 *
 * WHY THIS FILE IS SEPARATE FROM index.html:
 * ToyyibPay's "Create Bill" API requires your account's Secret Key.
 * That key must NEVER be sent to the browser or committed to a public
 * repo — anyone who saw it could create bills or refunds on your account.
 * GitHub Pages only serves static files, so this function has to run on
 * a separate host that can execute server-side code (Vercel, Netlify,
 * Cloudflare Workers, a small VPS, etc). Your main site can stay on
 * GitHub Pages and just call this endpoint's URL.
 *
 * DEPLOY (Vercel, free tier):
 *   1. Put this file in a folder called /api at the root of a new repo.
 *   2. `vercel` (or connect the repo on vercel.com) to deploy.
 *   3. In Vercel dashboard -> Settings -> Environment Variables, add:
 *        TOYYIBPAY_SECRET_KEY   = your secret key from ToyyibPay dashboard
 *        TOYYIBPAY_CATEGORY_CODE = your category code
 *        TOYYIBPAY_BASE_URL      = https://toyyibpay.com  (or https://dev.toyyibpay.com for sandbox)
 *        SITE_URL                = https://yourusername.github.io/yourrepo
 *   4. Copy the deployed function URL (e.g. https://your-project.vercel.app/api/create-bill)
 *      into API_ENDPOINT inside index.html.
 *
 * This same logic can be ported to Netlify Functions or Cloudflare
 * Workers with minor syntax changes — the ToyyibPay API call itself
 * stays identical.
 */

export default async function handler(req, res) {
  // Allow the static GitHub Pages site to call this endpoint (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { productId, productName, amount } = req.body;

    if (!productId || !productName || !amount) {
      return res.status(400).json({ error: "productId, productName and amount are required" });
    }

    const BASE_URL = process.env.TOYYIBPAY_BASE_URL || "https://toyyibpay.com";
    const SITE_URL = process.env.SITE_URL || "https://example.com";

    const params = new URLSearchParams({
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
      categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE,
      billName: productName.slice(0, 30),          // ToyyibPay limits length
      billDescription: `Pembelian ebook: ${productName}`,
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(amount * 100)), // ringgit -> sen
      billReturnUrl: `${SITE_URL}/terima-kasih.html?product=${encodeURIComponent(productId)}`,
      billCallbackUrl: `${SITE_URL}/api/toyyibpay-callback`, // optional: for auto-delivery of ebook link
      billExternalReferenceNo: `${productId}-${Date.now()}`,
      billTo: "Pelanggan CikguJu",
      billEmail: "customer@example.com", // ideally collect this from a form before checkout
      billPhone: "0000000000",
      billSplitPayment: "0",
      billPaymentChannel: "2", // 0=FPX only, 1=Card only, 2=FPX+Card
      billContentEmail: "Terima kasih! Pautan muat turun ebook anda akan dihantar sebentar lagi.",
      billChargeToCustomer: "1",
    });

    const toyyibRes = await fetch(`${BASE_URL}/index.php/api/createBill`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const result = await toyyibRes.json();

    // ToyyibPay returns an array like [{ BillCode: "abcd1234" }]
    const billCode = Array.isArray(result) ? result[0]?.BillCode : null;

    if (!billCode) {
      console.error("ToyyibPay response:", result);
      return res.status(502).json({ error: "Gagal cipta bil ToyyibPay", raw: result });
    }

    return res.status(200).json({
      paymentUrl: `${BASE_URL}/${billCode}`,
      billCode,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Ralat server", detail: err.message });
  }
}
