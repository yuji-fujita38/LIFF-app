import './style.css';
import liff from '@line/liff';

// ✅ GASのエンドポイントURL（環境変数などで管理推奨）
const GAS_URL = "https://script.google.com/macros/s/AKfycbw3RriSKdaLpYutaVJeu69OXVPb7ntCCZikVra8jkKrfLygSboBPCHeGIRYZxbFfCqa/exec";

let userId = null;
let displayName = null;
let userType = "client"; // デフォルトは顧客

// ✅ URLパラメータを取得する関数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

// ✅ LIFFを初期化する関数（開いたら即閉じる）
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
            return;
        }

        console.log("ログイン済み！ユーザー情報を取得します");

        // ✅ ユーザー情報を取得
        const profile = await liff.getProfile();
        userId = profile.userId;
        displayName = profile.displayName;

        console.log("ユーザーID:", userId);
        console.log("表示名:", displayName);

        // ✅ **開いた瞬間に閉じる**
        setTimeout(() => {
            console.log("LIFFアプリを閉じます...");
            liff.closeWindow();
        }, 100); // 0.5秒後に閉じる（即時でもOK）

        // ✅ **3 秒後にスプレッドシートに ID を登録**
        setTimeout(() => {
            sendToGAS(userId, displayName, userType);
        }, 3000); // 3秒後に送信
    } catch (error) {
        console.error("LIFFの初期化に失敗:", error);
    }
}

// ✅ GASにLINE IDと名前を送信する関数（バックグラウンド処理）
async function sendToGAS(userId, displayName, userType) {
    try {
        console.log("3秒後にGASへデータ送信中...", userId, displayName, userType);

        const formData = new URLSearchParams();
        formData.append("userId", userId);
        formData.append("displayName", displayName);
        formData.append("type", userType);

        const response = await fetch(GAS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }

        const result = await response.json();
        console.log("GASのレスポンス:", result);

    } catch (error) {
        console.error("GAS送信エラー:", error);
    }
}

// ✅ 初期化関数を実行
initializeLIFF();
