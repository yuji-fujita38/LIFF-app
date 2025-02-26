import './style.css';
import liff from '@line/liff';

// ✅ GASのエンドポイントURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbw_qZ108jgUiDIIzmaPW6vCB9oVI24qRYpyE36qNVsRdHCpwXzP9Dbz0DmdpGBwR9Mk/exec";

// ✅ URLパラメータを取得する関数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

async function initializeLIFF() {
    try {
        console.log("🔹 LIFFの初期化開始...");
        await liff.init({ liffId: "2006759470-npBm9Mxr" });

        console.log("✅ LIFF初期化成功！");

        // ✅ `liff.init()` 完了後にURLパラメータを取得
        const urlParams = getUrlParams();
        console.log("取得したURLパラメータ:", urlParams);

        // ✅ `type=coach` の場合はコーチ登録、それ以外はクライアント登録
        const userType = urlParams.type || "client";
        const shouldRedirect = urlParams.redirect !== "false"; // デフォルトはリダイレクト（falseが指定された場合のみリダイレクトしない）

        console.log(`📌 ユーザータイプ: ${userType}`);
        console.log(`📌 リダイレクト設定: ${shouldRedirect}`);

        // ✅ ログインしていなければログイン処理を行う
        if (!liff.isLoggedIn()) {
            console.log("🔹 LINEログインが必要です");
            liff.login();
            return;
        }

        console.log("📌 ログイン済み！ユーザー情報を取得します");

        // ✅ ユーザー情報を取得
        const profile = await liff.getProfile();
        const userId = profile.userId;
        const displayName = profile.displayName;

        console.log("📌 ユーザーID:", userId);
        console.log("📌 表示名:", displayName);

        // ✅ GASへデータ送信
        await sendToGAS(userId, displayName, userType);

        if (shouldRedirect) {
            // ✅ リダイレクトする場合（デフォルト動作）
            const redirectUrl = (userType === "coach") 
                ? "https://liff.line.me/2006759470-OZ0a7wX8?unique_key=GOCZ7R&ts=1740514622"
                : "https://liff.line.me/2006759470-OZ0a7wX8?unique_key=Ve3HHH&ts=1740514466";

            console.log(`✅ ${userType} 用のリダイレクト: ${redirectUrl}`);

            // ✅ 新しいウィンドウで開く
            liff.openWindow({
                url: redirectUrl,
                external: true, // LINE外のブラウザで開く
            });
        }

        console.log("🔹 LIFFアプリを閉じます...");
        setTimeout(() => liff.closeWindow(), 500);

    } catch (error) {
        console.error("❌ LIFFの初期化に失敗:", error);
    }
}

// ✅ GASにLINE IDと名前を送信
async function sendToGAS(userId, displayName, userType) {
    try {
        console.log("🔹 GASへデータ送信...", userId, displayName, userType);

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
        console.log("✅ GASのレスポンス:", result);

    } catch (error) {
        console.error("❌ GAS送信エラー:", error);
    }
}

// ✅ 初期化関数を実行
initializeLIFF();
