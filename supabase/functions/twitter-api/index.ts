import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TWITTER_V1 = "https://api.twitter.com/1.1";

async function generateOAuthHeader(
  method: string,
  url: string,
  extraParams: Record<string, string> = {}
): Promise<string> {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY")!;
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET")!;
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN")!;
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")!;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const allParams = { ...oauthParams, ...extraParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(baseString));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  const authParams = { ...oauthParams, oauth_signature: signature };
  const header = Object.keys(authParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(authParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
}

async function twitterV1(
  method: string,
  endpoint: string,
  formParams?: Record<string, string>,
  queryParams?: Record<string, string>
) {
  let url = `${TWITTER_V1}${endpoint}`;
  const sigParams = { ...formParams, ...queryParams };

  if (queryParams) {
    url += "?" + new URLSearchParams(queryParams).toString();
  }

  const authHeader = await generateOAuthHeader(method, `${TWITTER_V1}${endpoint}`, sigParams);

  const headers: Record<string, string> = {
    Authorization: authHeader,
  };

  const options: RequestInit = { method, headers };

  if (formParams && method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = new URLSearchParams(formParams).toString();
  }

  const response = await fetch(url, options);

  // 204 No Content
  if (response.status === 204) return { success: true };

  const text = await response.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!response.ok) {
    throw new Error(`Twitter API v1.1 [${response.status}]: ${JSON.stringify(data)}`);
  }

  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requiredVars = [
      "TWITTER_CONSUMER_KEY",
      "TWITTER_CONSUMER_SECRET",
      "TWITTER_ACCESS_TOKEN",
      "TWITTER_ACCESS_TOKEN_SECRET",
    ];
    for (const v of requiredVars) {
      if (!Deno.env.get(v)) throw new Error(`Missing: ${v}`);
    }

    const { action, params } = await req.json();
    let result: unknown;

    switch (action) {

      // ===== Kimlik doğrula =====
      case "verify_credentials": {
        result = await twitterV1("GET", "/account/verify_credentials.json", undefined, {
          include_entities: "false",
          skip_status: "true",
          include_email: "false",
        });
        // v1.1 formatını v2 formatına uyarla
        const u = result as Record<string, unknown>;
        result = {
          data: {
            id: u.id_str,
            name: u.name,
            username: u.screen_name,
            profile_image_url: u.profile_image_url_https,
            public_metrics: {
              followers_count: u.followers_count,
              following_count: u.friends_count,
              tweet_count: u.statuses_count,
            },
          }
        };
        break;
      }

      // ===== Beğen =====
      case "like": {
        result = await twitterV1("POST", "/favorites/create.json", {
          id: params.tweetId,
        });
        break;
      }

      // ===== Beğeniyi kaldır =====
      case "unlike": {
        result = await twitterV1("POST", "/favorites/destroy.json", {
          id: params.tweetId,
        });
        break;
      }

      // ===== Retweet =====
      case "retweet": {
        result = await twitterV1("POST", `/statuses/retweet/${params.tweetId}.json`);
        break;
      }

      // ===== Retweet kaldır =====
      case "unretweet": {
        result = await twitterV1("POST", `/statuses/unretweet/${params.tweetId}.json`);
        break;
      }

      // ===== Takip et =====
      case "follow": {
        result = await twitterV1("POST", "/friendships/create.json", {
          screen_name: params.username.replace("@", ""),
          follow: "true",
        });
        break;
      }

      // ===== Takibi bırak =====
      case "unfollow": {
        result = await twitterV1("POST", "/friendships/destroy.json", {
          screen_name: params.username.replace("@", ""),
        });
        break;
      }

      // ===== Tweet at =====
      case "tweet": {
        const tweetParams: Record<string, string> = { status: params.text };
        if (params.replyToId) {
          tweetParams.in_reply_to_status_id = params.replyToId;
          tweetParams.auto_populate_reply_metadata = "true";
        }
        result = await twitterV1("POST", "/statuses/update.json", tweetParams);
        break;
      }

      // ===== Tweet sil =====
      case "delete_tweet": {
        result = await twitterV1("POST", `/statuses/destroy/${params.tweetId}.json`);
        break;
      }

      // ===== Kendi timeline =====
      case "get_timeline": {
        result = await twitterV1("GET", "/statuses/user_timeline.json", undefined, {
          count: (params.count || 10).toString(),
          tweet_mode: "extended",
        });
        break;
      }

      // ===== Takipçiler =====
      case "get_followers": {
        const q: Record<string, string> = {
          count: Math.min(params.count || 100, 200).toString(),
          skip_status: "true",
        };
        if (params.username) q.screen_name = params.username.replace("@", "");
        result = await twitterV1("GET", "/followers/list.json", undefined, q);
        break;
      }

      // ===== Takip edilenler =====
      case "get_following": {
        const q2: Record<string, string> = {
          count: Math.min(params.count || 100, 200).toString(),
          skip_status: "true",
        };
        if (params.username) q2.screen_name = params.username.replace("@", "");
        result = await twitterV1("GET", "/friends/list.json", undefined, q2);
        break;
      }

      // ===== Tweet ara =====
      case "search_tweets": {
        result = await twitterV1("GET", "/search/tweets.json", undefined, {
          q: params.query,
          count: Math.min(params.count || 10, 100).toString(),
          tweet_mode: "extended",
          result_type: "recent",
        });
        break;
      }

      // ===== Ana akış =====
      case "get_home_timeline": {
        result = await twitterV1("GET", "/statuses/home_timeline.json", undefined, {
          count: Math.min(params.count || 20, 200).toString(),
          tweet_mode: "extended",
        });
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Twitter API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
