<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>サーバー認証 - 認証システム</title>
    
    <!-- タブのアイコン (favicon) -->
    <link rel="icon" href="./favicon.ico" type="image/x-icon">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        discord: {
                            DEFAULT: '#5865F2',
                            hover: '#4752C4',
                        }
                    }
                }
            }
        }
    </script>
    <!-- Cloudflare Turnstile のスクリプト -->
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body class="bg-[#2f3136] min-h-screen flex flex-col justify-between font-sans text-gray-200">

    <!-- ヘッダー -->
    <header class="w-full py-5 px-8 bg-[#202225] shadow-md flex items-center justify-center">
        <h1 class="text-xl font-bold text-white flex items-center gap-2 tracking-wider">
            <!-- Discord風のアイコン -->
            <svg class="w-7 h-7 text-discord" fill="currentColor" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Discord Server Auth
        </h1>
    </header>

    <!-- メインコンテンツ -->
    <main class="flex-1 flex items-center justify-center p-4">
        <!-- パネル部分 -->
        <div class="max-w-md w-full bg-[#36393f] rounded-2xl shadow-2xl p-8 border border-white/5 text-center transition-all">
            
            <div id="auth-box">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-discord/10 text-discord rounded-full mb-6 ring-4 ring-discord/20">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                </div>

                <h2 class="text-2xl font-bold mb-2 text-white">セキュリティ検証</h2>
                <p class="text-[#b9bbbe] text-sm mb-6">悪意ある操作を防止するため、以下のチェックを完了してください。</p>

                <!-- エラーメッセージ表示エリア（alertの代わり） -->
                <div id="error-message" class="hidden bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs mb-6 text-left break-all"></div>

                <!-- 👇 Cloudflare Turnstile ウィジェットの配置場所 -->
                <div class="flex justify-center mb-6">
                    <div class="cf-turnstile" data-sitekey="0x4AAAAAAFL8gbxTE-64Li3m" data-callback="onTurnstileSuccess" data-theme="dark"></div>
                </div>

                <!-- 認証処理中の状態を表示するステータスエリア -->
                <div id="status-container" class="hidden items-center justify-center gap-2 py-3.5 px-4 bg-discord/10 rounded-xl text-discord font-bold text-sm border border-discord/20">
                    <svg class="animate-spin h-5 w-5 text-discord" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>認証処理中...</span>
                </div>
            </div>

            <!-- 完了後に切り替える画面 -->
            <div id="success-box" class="hidden">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full mb-6 ring-4 ring-emerald-500/20">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold mb-2 text-white">認証が完了しました！</h2>
                <p class="text-[#b9bbbe] text-sm mb-6">Discordサーバーに戻り、ロールが付与されているかご確認ください。</p>
                <p class="text-xs text-gray-400 bg-[#202225] py-2 rounded-lg border border-white/5">このページは閉じても問題ありません。</p>
            </div>

        </div>
    </main>

    <!-- フッター -->
    <footer class="w-full py-5 text-center text-xs text-gray-500 bg-[#202225] border-t border-black/20">
        &copy; iroiroBot System. All rights reserved.
    </footer>

    <!-- スクリプト処理 -->
    <script>
        // 1. URLからDiscord Botのトークンを取得
        function extractToken() {
            const params = new URLSearchParams(window.location.search);
            return params.get('token');
        }

        const discordToken = extractToken();
        let turnstileToken = null; // Turnstileの認証完了トークン

        function showError(message) {
            const errorBox = document.getElementById('error-message');
            errorBox.textContent = message;
            errorBox.classList.remove('hidden');
        }

        function hideError() {
            const errorBox = document.getElementById('error-message');
            errorBox.classList.add('hidden');
        }

        // 初期チェック（トークンが無い場合）
        if (!discordToken) {
            showError('エラー: 有効な認証トークンが見つかりません。Discordから再度アクセスしてください。');
        }

        // 2. Turnstileの検証が成功したときに呼ばれるコールバック関数（自動実行）
        function onTurnstileSuccess(token) {
            turnstileToken = token;
            executeAuth(); // 自動的に送信処理を実行
        }

        // 3. 認証実行処理
        async function executeAuth() {
            hideError();

            if (!discordToken) {
                showError('認証トークンが不足しています。');
                return;
            }

            if (!turnstileToken) {
                showError('セキュリティ検証トークンが無効です。');
                return;
            }

            const statusContainer = document.getElementById('status-container');
            statusContainer.classList.remove('hidden');
            statusContainer.classList.add('flex');

            try {
                // Cloudflare Pages Functions (バックエンド) へデータを送信
                const response = await fetch('/api/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: discordToken,
                        turnstileToken: turnstileToken
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // 成功した場合：画面を成功状態に切り替え
                    document.getElementById('auth-box').classList.add('hidden');
                    document.getElementById('success-box').classList.remove('hidden');
                } else {
                    showError('認証に失敗しました: ' + (result.error || '不明なエラー'));
                    statusContainer.classList.add('hidden');
                    statusContainer.classList.remove('flex');
                }
            } catch (error) {
                console.error('通信エラー:', error);
                showError('サーバーとの通信に失敗しました。');
                statusContainer.classList.add('hidden');
                statusContainer.classList.remove('flex');
            }
        }
    </script>
</body>
</html>
