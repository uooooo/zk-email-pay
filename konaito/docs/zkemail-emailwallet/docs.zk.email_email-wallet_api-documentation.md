[Skip to main content](https://docs.zk.email/email-wallet/api-documentation#__docusaurus_skipToContent_fallback)

On this page

## Relayer API Documentation [​](https://docs.zk.email/email-wallet/api-documentation\#relayer-api-documentation "Direct link to Relayer API Documentation")

### Environment Setup [​](https://docs.zk.email/email-wallet/api-documentation\#environment-setup "Direct link to Environment Setup")

Ensure you have a `.env` file or other definition with your chosen relayer endpoint. We have provided a sample one here.

```codeBlockLines_e6Vv
RELAYER_API_URL=https://relayerapi.emailwallet.org

```

When you want more flexibility, you can deploy your own relayer via the [Relayer Infrastructure](https://docs.zk.email/email-wallet/relayer-infrastructure/overview).

### Core API Endpoints [​](https://docs.zk.email/email-wallet/api-documentation\#core-api-endpoints "Direct link to Core API Endpoints")

These endpoints concern basic universal features like sending ERC20s and ERC721s. You can see how to hit this or staging APIs for [account recovery](https://docs.zk.email/account-recovery/relayer-api/) or [oauth login](https://docs.zk.email/login-with-zk-email-oauth-api) in those specific docs. For safe signers, simply adding an email wallet address to a Safe Wallet on Base Sepolia will automatically trigger the email-based signer flow -- to make that multichain, please reach out to the team.

#### Create Account [​](https://docs.zk.email/email-wallet/api-documentation\#create-account "Direct link to Create Account")

**Endpoint:**

```codeBlockLines_e6Vv
POST /api/createAccount

```

**Request Body:**

```codeBlockLines_e6Vv
{
  "email_addr": "user@example.com"
}

```

**Example:**

```codeBlockLines_e6Vv
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
  return textResponse != "0x" ? textResponse : "";
};

createAccount('user@example.com')
  .then(address => console.log('Account Address:', address))
  .catch(error => console.error('Error:', error));

```

#### Check if Account is Created [​](https://docs.zk.email/email-wallet/api-documentation\#check-if-account-is-created "Direct link to Check if Account is Created")

**Endpoint:**

```codeBlockLines_e6Vv
POST /api/isAccountCreated

```

**Request Body:**

```codeBlockLines_e6Vv
{
  "email_addr": "user@example.com"
}

```

**Example:**

```codeBlockLines_e6Vv
const isAccountCreated = async (email) => {
  const response = await fetch(`${RELAYER_API_URL}/api/isAccountCreated`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_addr: email }),
  });
  const text = await response.text();
  return text == "true" ? "Account exists" : "Account does not exist";
};

isAccountCreated('user@example.com')
  .then(status => console.log('Account Status:', status))
  .catch(error => console.error('Error:', error));

```

#### Send Asset [​](https://docs.zk.email/email-wallet/api-documentation\#send-asset "Direct link to Send Asset")

**Endpoint:**

```codeBlockLines_e6Vv
POST /api/send

```

**Request Body:**

```codeBlockLines_e6Vv
{
  "email_addr": "user@example.com",
  "amount": 100,
  "token_id": "token123",
  "recipient_addr": "recipient@example.com",
  "is_recipient_email": true
}

```

**Example:**

```codeBlockLines_e6Vv
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
  return data ? "Asset sent successfully" : "Failed to send asset";
};

sendAsset('100', 'token123', 'recipient@example.com')
  .then(status => console.log('Send Status:', status))
  .catch(error => console.error('Error:', error));

```

#### Recover Account Code [​](https://docs.zk.email/email-wallet/api-documentation\#recover-account-code "Direct link to Recover Account Code")

**Endpoint:**

```codeBlockLines_e6Vv
POST /api/recoverAccountCode

```

**Request Body:**

```codeBlockLines_e6Vv
{
  "email_addr": "user@example.com"
}

```

**Example:**

```codeBlockLines_e6Vv
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
    ? "Account key recovery email sent"
    : "Failed to send account key recovery email";
};

recoverAccountCode('user@example.com')
  .then(status => console.log('Recovery Status:', status))
  .catch(error => console.error('Error:', error));

```

#### Get Wallet Address [​](https://docs.zk.email/email-wallet/api-documentation\#get-wallet-address "Direct link to Get Wallet Address")

**Endpoint:**

```codeBlockLines_e6Vv
POST /api/getWalletAddress

```

**Request Body:**

```codeBlockLines_e6Vv
{
  "email_addr": "user@example.com",
  "account_code": "<characters with 256 bits of entropy>"
}

```

**Example:**

```codeBlockLines_e6Vv
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
  return data || "Failed to fetch address, no address found";
};

getWalletAddress('user@example.com', 'accountKey123')
  .then(address => console.log('Wallet Address:', address))
  .catch(error => console.error('Error:', error));

```

#### Transfer NFT [​](https://docs.zk.email/email-wallet/api-documentation\#transfer-nft "Direct link to Transfer NFT")

**Endpoint:**

```codeBlockLines_e6Vv
POST /api/nftTransfer

```

**Request Body:**

```codeBlockLines_e6Vv
{
  "email_addr": "user@example.com",
  "nft_id": 123,
  "nft_addr": "0xNFTContractAddress",
  "recipient_addr": "recipient@example.com",
  "is_recipient_email": true
}

```

**Example:**

```codeBlockLines_e6Vv
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
  return data ? "NFT transferred successfully" : "Failed to transfer NFT";
};

transferNFT('nft123', '0xNFTContractAddress', 'recipient@example.com')
  .then(status => console.log('Transfer Status:', status))
  .catch(error => console.error('Error:', error));

```

- [Relayer API Documentation](https://docs.zk.email/email-wallet/api-documentation#relayer-api-documentation)
  - [Environment Setup](https://docs.zk.email/email-wallet/api-documentation#environment-setup)
  - [Core API Endpoints](https://docs.zk.email/email-wallet/api-documentation#core-api-endpoints)