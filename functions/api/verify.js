export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const { token, turnstileToken } = body;

        // 1. データが揃っているか確認
        if (!token || !turnstileToken) {
            return new Response(JSON.stringify({ success: false, error: 'データが不足しています。' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Cloudflare Turnstileのトークンを検証
        const turnstileData = new URLSearchParams();
        turnstileData.append('secret', env.TURNSTILE_SECRET_KEY); // 環境変数からシークレットキーを安全に取得
        turnstileData.append('response', turnstileToken);

        const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: turnstileData,
        });
        const turnstileOutcome = await turnstileResult.json();

        // 3. 検証に失敗した場合
        if (!turnstileOutcome.success) {
            return new Response(JSON.stringify({ success: false, error: 'セキュリティ検証に失敗しました。' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 4. 検証成功！
        // ※この後、必要に応じてCloudflare KVやデータベース等を経由してDiscord Bot側へロール付与を連携させます。
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}