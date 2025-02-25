import './style.css';
import liff from '@line/liff';

// ✅ GASのエンドポイントURLを設定（システム設定スプレッドシートのGAS）
const GAS_URL = "https://script.google.com/macros/s/AKfycbzO1SkNr9s-iTZTVJ8DEn7oeGlkSLlvAQQ8-nB3ztmcuzkrMHNcpwyWdNmhlZWFgMnO/exec";

// ✅ URLパラメータを取得する関数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

// ✅ LIFFを初期化する関数
async function initializeLIFF() {
    try {
        console.log("LIFFの初期化を開始...");
        await liff.init({ liffId: "2006759470-npBm9Mxr" });

        console.log("LIFF初期化成功！");

        // ✅ `liff.init()` 完了後にURLパラメータを取得
        const urlParams = getUrlParams();
        console.log("取得したURLパラメータ:", urlParams);

        // ✅ ログインしていなければログイン処理を行う
        if (!liff.isLoggedIn()) {
            console.log("LINEログインが必要です");
            liff.login();
            return; // ✅ ログイン処理後に処理を止める
        }

        console.log("ログイン済み！ユーザー情報を取得します");

        // ✅ ユーザー情報を取得
        const profile = await liff.getProfile();
        console.log("ユーザーID:", profile.userId);
        console.log("表示名:", profile.displayName);

        // ✅ IDをHTMLに表示
        document.querySelector('#app').innerHTML = `
          <h1>LIFFアプリ</h1>
          <p>LIFF init succeeded.</p>
          <p>ようこそ、<b>${profile.displayName}</b> さん！</p>
          <p>LINE ID: <code>${profile.userId}</code></p>
        `;

        // ✅ システム設定のGASに送信
        sendToGAS(profile.userId, profile.displayName);
    } catch (error) {
        console.error("LIFFの初期化に失敗:", error);
        document.querySelector('#app').innerHTML = `
          <h1>LIFFアプリ</h1>
          <p>LIFF init failed.</p>
          <p><code>${error}</code></p>
        `;
    }
}

// ✅ GASにLINE IDと名前を送信する関数
async function sendToGAS(userId, displayName) {
    try {
        const response = await fetch(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, displayName })
        });

        const result = await response.text();
        console.log("GASのレスポンス:", result);
    } catch (error) {
        console.error("GAS送信エラー:", error);
    }
}

// ✅ 初期化関数を実行
initializeLIFF();
