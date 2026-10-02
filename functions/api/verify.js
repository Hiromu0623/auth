export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const { token, turnstileToken } = body;

        if (!token || !turnstileToken) {
            return new Response(JSON.stringify({ success: false, error: 'データが不足しています。' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        
        const turnstileData = new URLSearchParams();
        turnstileData.append('secret', env.TURNSTILE_SECRET_KEY);
        turnstileData.append('response', turnstileToken);

        const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: turnstileData,
        });
        const turnstileOutcome = await turnstileResult.json();

        // 2. 失敗した場合、Turnstileから返ってきたエラーコード（error-codes）をそのまま返す
        if (!turnstileOutcome.success) {
            const errorCodes = turnstileOutcome['error-codes'] ? turnstileOutcome['error-codes'].join(', ') : '不明なエラー';
            return new Response(JSON.stringify({ 
                success: false, 
                error: `Turnstile検証エラー: [${errorCodes}]` 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
