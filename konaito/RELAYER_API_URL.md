---
title: Relayer API Documentation | Email Wallet | ZK Email
description: Complete reference for the Email Wallet Relayer API, including endpoints for account creation, asset transfers, NFT management, and account recovery with TypeScript examples
url: https://docs.zk.email
image: https://docs.zk.email/img/zk-email-docs-banner.webp
siteName: undefined
type: website
twitterCard: summary_large_image
twitterSite: undefined
---
# APIドキュメント

## リレイヤAPIドキュメント

### 環境設定

`.env`ファイル、またはその他の方法で、使用するリレイヤのエンドポイントを定義してください。サンプルを以下に示します。

```
RELAYER_API_URL=https://relayerapi.emailwallet.org
```

より柔軟性を持たせたい場合は、[リレイヤインフラストラクチャ](https://docs.zk.email/email-wallet/relayer-infrastructure/overview)を通じて独自のリレイヤをデプロイできます。

### 主要APIエンドポイント

これらのエンドポイントは、ERC20やERC721の送信といった基本的な汎用機能に関連します。アカウントリカバリやOAuthログインのステージングAPIなどを利用する方法については、それぞれのドキュメントを参照してください。[Safe signers](https://safe.global/)の場合、Base Sepolia上のSafeウォレットにメールウォレットアドレスを追加するだけで、メールベースの署名フローが自動的にトリガーされます。マルチチェーン対応については、チームにお問い合わせください。

#### アカウント作成

*   **エンドポイント:**
    ```
    POST /api/createAccount
    ```
*   **リクエストボディ:**
    ```json
    {
      "email_addr": "user@example.com"
    }
    ```
*   **例:**
    ```javascript
    const createAccount = async (email) => {
      const response = await fetch(`${RELAYER_API_URL}/api/createAccount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_addr: email }),
      });
      const textResponse = await response.text();
      console.log("Parsed response:", textResponse);
      return textResponse !== "0x" ? textResponse : "";
    };

    createAccount('user@example.com')
      .then(address => console.log('Account Address:', address))
      .catch(error => console.error('Error:', error));
    ```

#### アカウント作成状況の確認

*   **エンドポイント:**
    ```
    POST /api/isAccountCreated
    ```
*   **リクエストボディ:**
    ```json
    {
      "email_addr": "user@example.com"
    }
    ```
*   **例:**
    ```javascript
    const isAccountCreated = async (email) => {
      const response = await fetch(`${RELAYER_API_URL}/api/isAccountCreated`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_addr: email }),
      });
      const text = await response.text();
      return text === "true" ? "アカウントが存在します" : "アカウントは存在しません";
    };

    isAccountCreated('user@example.com')
      .then(status => console.log('Account Status:', status))
      .catch(error => console.error('Error:', error));
    ```

#### アセット送信

*   **エンドポイント:**
    ```
    POST /api/send
    ```
*   **リクエストボディ:**
    ```json
    {
      "email_addr": "user@example.com",
      "amount": 100,
      "token_id": "token123",
      "recipient_addr": "recipient@example.com",
      "is_recipient_email": true
    }
    ```
*   **例:**
    ```javascript
    const sendAsset = async (amountString, tokenId, recipientAddr) => {
      const email = localStorage.getItem("loggedInUser") || "";
      const isRecipientEmail = recipientAddr.includes("@");
      const amount = parseFloat(amountString);

      const response = await fetch(`${RELAYER_API_URL}/api/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_addr: email,
          amount,
          token_id: tokenId,
          recipient_addr: recipientAddr,
          is_recipient_email: isRecipientEmail,
        }),
      });
      const data = await response.text();
      return data ? "アセットの送信に成功しました" : "アセットの送信に失敗しました";
    };

    sendAsset('100', 'token123', 'recipient@example.com')
      .then(status => console.log('Send Status:', status))
      .catch(error => console.error('Error:', error));
    ```

#### アカウント復旧コード送信

*   **エンドポイント:**
    ```
    POST /api/recoverAccountCode
    ```
*   **リクエストボディ:**
    ```json
    {
      "email_addr": "user@example.com"
    }
    ```
*   **例:**
    ```javascript
    const recoverAccountCode = async (email) => {
      const response = await fetch(`${RELAYER_API_URL}/api/recoverAccountCode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_addr: email }),
      });
      const data = await response.text();
      return data
        ? "アカウントキー復旧メールが送信されました"
        : "アカウントキー復旧メールの送信に失敗しました";
    };

    recoverAccountCode('user@example.com')
      .then(status => console.log('Recovery Status:', status))
      .catch(error => console.error('Error:', error));
    ```

#### ウォレットアドレス取得

*   **エンドポイント:**
    ```
    POST /api/getWalletAddress
    ```
*   **リクエストボディ:**
    ```json
    {
      "email_addr": "user@example.com",
      "account_code": "<256ビットのエントロピーを持つ文字>"
    }
    ```
*   **例:**
    ```javascript
    const getWalletAddress = async (email, accountKey) => {
      let code = accountKey.startsWith("0x") ? accountKey : `0x${accountKey}`;
      const response = await fetch(`${RELAYER_API_URL}/api/getWalletAddress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_addr: email, account_code: code }),
      });
      const data = await response.text();
      return data || "アドレスの取得に失敗しました。アドレスが見つかりません";
    };

    getWalletAddress('user@example.com', 'accountKey123')
      .then(address => console.log('Wallet Address:', address))
      .catch(error => console.error('Error:', error));
    ```

#### NFT転送

*   **エンドポイント:**
    ```
    POST /api/nftTransfer
    ```
*   **リクエストボディ:**
    ```json
    {
      "email_addr": "user@example.com",
      "nft_id": 123,
      "nft_addr": "0xNFTContractAddress",
      "recipient_addr": "recipient@example.com",
      "is_recipient_email": true
    }
    ```
*   **例:**
    ```javascript
    const transferNFT = async (nftId, nftAddr, recipientAddr) => {
      const email = localStorage.getItem("loggedInUser") || "";
      const isRecipientEmail = recipientAddr.includes("@");

      const response = await fetch(`${RELAYER_API_URL}/api/nftTransfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_addr: email,
          nft_id: Number(nftId),
          nft_addr: nftAddr,
          recipient_addr: recipientAddr,
          is_recipient_email: isRecipientEmail,
        }),
      });
      const data = await response.text();
      return data ? "NFTの転送に成功しました" : "NFTの転送に失敗しました";
    };

    transferNFT('nft123', '0xNFTContractAddress', 'recipient@example.com')
      .then(status => console.log('Transfer Status:', status))
      .catch(error => console.error('Error:', error));
    ```