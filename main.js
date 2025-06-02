import './style.css';
import liff from '@line/liff';

/**
 * テスト環境判定用フラグ
 * true: 本番環境
 * false: テスト環境
 * 【本番にリリースしたらtrueにすること！】
 * 【開発時は基本falseにすること！】
 */
const IS_PRODUCTION_FLG = false;

// ✅ GASのエンドポイントURL（環境変数などで管理推奨）
const GAS_URL = IS_PRODUCTION_FLG ? "https://script.google.com/macros/s/AKfycbw_qZ108jgUiDIIzmaPW6vCB9oVI24qRYpyE36qNVsRdHCpwXzP9Dbz0DmdpGBwR9Mk/exec"
:"https://script.google.com/macros/s/AKfycby6tNJweVFSqx029FIiWMMXFQpOEZ3PXqkmJ__djLdgzXvymG-IZJAXh3ELvSVq3lgt9Q/exec";

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

    // ✅ テスト用も含めて判定
    if (["coach", "client", "test_coach", "test_client"].includes(skipRedirect)) {
        if (skipRedirect === "test_coach") return "coach";
        if (skipRedirect === "test_client") return "client";
        return skipRedirect;
    }

    return null;
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
        
        // ✅ テスト用パラメータを通常の挙動にマッピング
        if (userType === "test_coach") userType = "coach";
        if (userType === "test_client") userType = "client";


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
    const redirectUrl = IS_PRODUCTION_FLG 
        // 本番環境
        ? ""
        // テスト環境
        : "https://liff.line.me/2007474035-rBkeNA5R?unique_key=A72dog&ts=1748873003";

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
