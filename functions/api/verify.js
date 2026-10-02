export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        
        // ---------------------------------------------------------
        // パターン1: Botから「トークンとユーザー情報を登録して！」と言われたとき
        // ---------------------------------------------------------
        if (body.action === 'register') {
            const { token, guildId, userId } = body;
            if (!token || !guildId || !userId) {
                return new Response(JSON.stringify({ success: false, error: 'データが不足しています。' }), { status: 400 });
            }
            // KVに保存 (有効期限を例えば10分などにすることも可能)
            await env.AUTH_KV.put(token, JSON.stringify({ guildId, userId }), { expirationTtl: 600 });
            return new Response(JSON.stringify({ success: true }));
        }

        // ---------------------------------------------------------
        // パターン2: ブラウザから「認証を完了する」が押されたとき
        // ---------------------------------------------------------
        const { token, turnstileToken } = body;

        if (!token || !turnstileToken) {
            return new Response(JSON.stringify({ success: false, error: 'データが不足しています。' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. KVからトークンを検索して、どのサーバーの誰かを取り出す
        const tokenDataStr = await env.AUTH_KV.get(token);
        if (!tokenDataStr) {
            return new Response(JSON.stringify({ success: false, error: '無効または有効期限切れのトークンです。' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const { guildId, userId } = JSON.parse(tokenDataStr);

        // 2. Cloudflare Turnstileのトークンを検証
        const turnstileData = new URLSearchParams();
        turnstileData.append('secret', env.TURNSTILE_SECRET_KEY);
        turnstileData.append('response', turnstileToken);

        const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: turnstileData,
        });
        const turnstileOutcome = await turnstileResult.json();

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

        // 3. Discord APIを直接叩いて「認証済み」ロールを自動検索・付与する！
        const botToken = env.DISCORD_BOT_TOKEN;

        // ① サーバー内のロール一覧を取得して「認証済み」という名前のロールを探す
        const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            headers: { Authorization: `Bot ${botToken}` }
        });
        if (!rolesRes.ok) throw new Error('サーバーのロール一覧取得に失敗しました。');
        const roles = await rolesRes.json();
        
        let authRole = roles.find(r => r.name === '認証済み');
        
        // なければ自動作成する
        if (!authRole) {
            const createRoleRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${botToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: '認証済み', color: 5793266, reason: '認証システムによる自動作成' })
            });
            if (!createRoleRes.ok) throw new Error('「認証済み」ロールの自動作成に失敗しました。Botに権限があるか確認してください。');
            authRole = await createRoleRes.json();
        }

        // ② ユーザーにそのロールを付与する (PUTリクエスト)
        const addRoleRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${authRole.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bot ${botToken}` }
        });

        if (!addRoleRes.ok) {
            throw new Error('ユーザーへのロール付与に失敗しました（Botのロール位置が低くないか確認してください）。');
        }

        // 4. 使い終わったトークンをKVから削除（使い回し防止）
        await env.AUTH_KV.delete(token);

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
