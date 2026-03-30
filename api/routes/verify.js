import { Router } from "express";

const router = Router();

// Twitter API credentials doğrulama endpoint'i
router.post("/", async (req, res) => {
  const {
    TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
  } = process.env;

  if (
    !TWITTER_CONSUMER_KEY ||
    !TWITTER_CONSUMER_SECRET ||
    !TWITTER_ACCESS_TOKEN ||
    !TWITTER_ACCESS_TOKEN_SECRET
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Twitter API anahtarları eksik. Lütfen .env dosyanızı kontrol edin.",
    });
  }

  try {
    // Twitter API v2 - kullanıcı doğrulama
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2);

    // Basit bağlantı testi - gerçek OAuth imzası Supabase Edge Function'da yapılıyor
    return res.json({
      success: true,
      message: "API anahtarları mevcut. Supabase Edge Function üzerinden doğrulayın.",
      keys_configured: {
        consumer_key: !!TWITTER_CONSUMER_KEY,
        consumer_secret: !!TWITTER_CONSUMER_SECRET,
        access_token: !!TWITTER_ACCESS_TOKEN,
        access_token_secret: !!TWITTER_ACCESS_TOKEN_SECRET,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Doğrulama sırasında hata oluştu.",
    });
  }
});

export default router;
