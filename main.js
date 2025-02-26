async function sendToGAS(userId, displayName, userType) {
    try {
        console.log("GASへデータ送信中...", userId, displayName, userType);

        // ✅ `application/x-www-form-urlencoded` にするために `URLSearchParams` を使用
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
        console.log("GASのレスポンス:", JSON.stringify(result, null, 2));  // ⭐ 詳細に確認

        document.querySelector("#app").innerHTML += `
          <p><b>GASレスポンス:</b> ${JSON.stringify(result)}</p>
        `;

    } catch (error) {
        console.error("GAS送信エラー:", error);
        document.querySelector("#app").innerHTML += `
          <h1>エラー</h1>
          <p>GASへのデータ送信に失敗しました。</p>
          <p><code>${error.message}</code></p>
        `;
    }
}
