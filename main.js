import './style.css';
import liff from '@line/liff';

// ✅ GASのエンドポイントURL（環境変数などで管理推奨）
const GAS_URL = "https://script.google.com/macros/s/AKfycbw_qZ108jgUiDIIzmaPW6vCB9oVI24qRYpyE36qNVsRdHCpwXzP9Dbz0DmdpGBwR9Mk/exec";

let userId = null;
let displayName = null;
let userType = "client"; // デフォルトは顧客

// ✅ URLパラメータを取得する関数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

// ✅ URLパラメータから `skipRedirect` の値を取得
function getSkipRedirectType() {
    const params = new URLSearchParams(window.location.search);
    const skipRedirect = params.get("skipRedirect");

    if (skipRedirect === "coach" || skipRedirect === "client") {
        return skipRedirect;
    }
    
    return null; // スキップしない場合
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
    const userTypeFromURL = getSkipRedirectType();
    const userType = userTypeFromURL || getUrlParams().type || "client"; 

    // ✅ URLパラメータで `skipRedirect=coach` または `skipRedirect=client` の場合、リダイレクトせずにデータ送信
    if (userTypeFromURL) {
        console.log(`✅ ${userTypeFromURL} のリダイレクトスキップが指定されました。`);
        sendToGAS(userId, displayName, userTypeFromURL); // 🚀 送信処理を実行
        liff.closeWindow();
        return;
    }

    // ✅ 通常のリダイレクト処理
    const redirectUrl = (userType === "coach") 
        ? "https://liff.line.me/2006759470-OZ0a7wX8?unique_key=GOCZ7R&ts=1740514622"
        : "https://liff.line.me/2006759470-OZ0a7wX8?unique_key=Ve3HHH&ts=1740514466";

    console.log(`✅ ${userType} 用のリダイレクト: ${redirectUrl}`);

    // ✅ 新しいウィンドウで開く
    liff.openWindow({
        url: redirectUrl,
        external: true, // LINE外のブラウザで開く
    });

    console.log("LIFFアプリを閉じます...");
    liff.closeWindow();
}, 100);
 // 0.5秒後に閉じる（即時でもOK）
     
            sendToGAS(userId, displayName, userType);
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
