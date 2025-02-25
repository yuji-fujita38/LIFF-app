import './style.css';
import liff from '@line/liff';

// ✅ GASのエンドポイントURL（環境変数などで管理推奨）
const GAS_URL = "https://script.google.com/macros/s/AKfycbw3RriSKdaLpYutaVJeu69OXVPb7ntCCZikVra8jkKrfLygSboBPCHeGIRYZxbFfCqa/exec";

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

        // ✅ デフォルトは顧客登録（client）、URLで `type=coach` の場合はコーチ登録
        const userType = urlParams.type || "client"; 

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

        // ✅ **データ送信をバックグラウンドで実行**
        sendToGAS(profile.userId, profile.displayName, userType);

        // ✅ **開いた瞬間に閉じる**
        setTimeout(() => {
            console.log("LIFFアプリを閉じます...");
            liff.closeWindow();
        }, 500); // 0.5秒後に閉じる（即時でもOK）
        
    } catch (error) {
        console.error("LIFFの初期化に失敗:", error);
    }
}

// ✅ GASにLINE IDと名前を送信する関数（バックグラウンド処理）
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
