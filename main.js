import './style.css';
import liff from '@line/liff';

// ✅ GASのエンドポイントURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbw3RriSKdaLpYutaVJeu69OXVPb7ntCCZikVra8jkKrfLygSboBPCHeGIRYZxbFfCqa/exec";

// ✅ グローバル変数（ページ閉じる前に `sendBeacon()` で利用）
let userId = null;
let displayName = null;
let userType = "client"; // デフォルトは顧客

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

        // ✅ URLパラメータで `type=coach` の場合はコーチ登録、それ以外はクライアント登録
        userType = urlParams.type || "client"; 

        // ✅ ログインしていなければログイン処理を行う
        if (!liff.isLoggedIn()) {
            console.log("LINEログインが必要です");
            liff.login();
            return; // ✅ ログイン処理後に処理を止める
        }

        console.log("ログイン済み！ユーザー情報を取得します");

        // ✅ ユーザー情報を取得
        const profile = await liff.getProfile();
        userId = profile.userId;
        displayName = profile.displayName;

        console.log("ユーザーID:", userId);
        console.log("表示名:", displayName);

        // ✅ UI 更新
        document.querySelector('#app').innerHTML = `
          <h1>ボディメイクナビ</h1>
          <p>ようこそ、<b>${displayName}</b> さん！</p>
          <p>登録処理中...</p>
          <p>登録種別: <b>${userType === "coach" ? "コーチ" : "クライアント"}</b></p>
        `;

        // ✅ システム設定のGASに送信
        await sendToGAS(userId, displayName, userType);

        // ✅ 🔥 送信完了後に自動で閉じる
        console.log("✅ データ送信完了！LIFFを自動で閉じます...");
        setTimeout(() => {
            liff.closeWindow();
        }, 1000); // ✅ 1秒待って閉じる（処理完了を視認させるため）
        
    } catch (error) {
        console.error("LIFFの初期化に失敗:", error);
        document.querySelector('#app').innerHTML = `
          <h1>LIFFアプリ</h1>
          <p>LIFF init failed.</p>
          <p><code>${error.message}</code></p>
        `;
    }
}

// ✅ GASにLINE IDと名前を送信する関数（CORS対策済み）
async function sendToGAS(userId, displayName, userType) {
    try {
        console.log("GASへデータ送信中...", userId, displayName, userType);

        // ✅ `application/x-www-form-urlencoded` にするために `URLSearchParams` を使用
        const formData = new URLSearchParams();
        formData.append("userId", userId);
        formData.append("displayName", displayName);
        formData.append("type", userType); // ✅ 顧客 or コーチ の判別情報を追加

        const response = await fetch(GAS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded", // ✅ プリフライト回避
                "Accept": "application/json", // ✅ レスポンスを JSON で受け取る
            },
            body: formData.toString(),
            keepalive: true // ✅ ページ閉じてもリクエスト継続
        });

        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }

        const result = await response.json();
        console.log("GASのレスポンス:", result);
    } catch (error) {
        console.error("GAS送信エラー:", error);
        alert("GASへの送信に失敗しました。");
    }
}

// ✅ 初期化関数を実行
initializeLIFF();
