[Skip to main content](https://docs.zk.email/zk-email-sdk/proof-of-luma#__docusaurus_skipToContent_fallback)

On this page

In this guide, we'll walk you through creating a new blueprint in the ZK Email Registry to prove registration confirmation for Luma events. You'll learn how to set up the blueprint details, configure the email query, define data extraction fields using regex, and test the blueprint with a sample email.

Prerequisites

- GitHub account
- Example .EML file ( [download here](https://docs.zk.email/assets/files/proof-of-luma-22be14ec80de67da66266178bce5ae17.eml))

## Set Up Basic Information [​](https://docs.zk.email/zk-email-sdk/proof-of-luma\#set-up-basic-information "Direct link to Set Up Basic Information")

Start by filling in the basic blueprint details:

- **Pattern Name**: `Proof Of Luma`
- **Circuit Name**: `ProofOfLuma`
- **Slug**: Auto-generated as `{your-username}/ProofOfLuma`
- **Upload test .EML**: Use the example .EML file downloaded earlier
- **Description**: `Prove that you received a registration confirmation for a Luma event`

Click **Next** to proceed.

![Create Blueprint Step 1](https://docs.zk.email/assets/images/step1-bfd7f3e5931bae6f279e756a8ed9f4c2.webp)

## Configure Email Query [​](https://docs.zk.email/zk-email-sdk/proof-of-luma\#configure-email-query "Direct link to Configure Email Query")

Next, configure the Email Query to find the relevant .EML files from your Gmail inbox:

- **Email Query**: `from:user.luma-mail.com subject:"Registration confirmed"`
- **Sender Domain**: `user.luma-mail.com`
- **Max Email Header Length**: `1024`
- **Skip body hash check**: `Yes` (reduces circuit constraints since we only need header data)

![Create Blueprint Step 2](https://docs.zk.email/assets/images/step2-b4fc4299076c6d9d877fb474dd68de3a.webp)

Click **Next** to continue.

## Set Up Field Extraction [​](https://docs.zk.email/zk-email-sdk/proof-of-luma\#set-up-field-extraction "Direct link to Set Up Field Extraction")

Now it's time to configure field extraction using regex:

1. Click `add values to extract`
2. Input `event` as the fieldName
3. Choose Email Header as the data location
4. Add 3 regex parts:
   - `(\r\n|^)subject:Registration confirmed for ` (private field)
   - `[^\r\n]+` (public field)
   - `\r\n` (private field)

![Create Blueprint Step 3](https://docs.zk.email/assets/images/step3-9d5e5abeb3409a0b0515e8941c75ab34.webp)

After adding the regex parts, you should see the event name extracted from the email. Then click **Submit Blueprint** to compile the blueprint.

![Create Blueprint Step 4](https://docs.zk.email/assets/images/step4-e2d868a3bd7fa00eeec3c986265f3e9f.webp)

## Test the Blueprint [​](https://docs.zk.email/zk-email-sdk/proof-of-luma\#test-the-blueprint "Direct link to Test the Blueprint")

Navigate to the [**compiled blueprint**](https://registry.zk.email/dc963079-fe7d-4bcb-a4ed-c60ad7a93d2b) and upload a test .EML file from Luma containing a registration confirmation email to verify the extraction works correctly.

And that's it! You've successfully created a Proof of Luma blueprint to prove event registration confirmation. Happy proving!

- [Set Up Basic Information](https://docs.zk.email/zk-email-sdk/proof-of-luma#set-up-basic-information)
- [Configure Email Query](https://docs.zk.email/zk-email-sdk/proof-of-luma#configure-email-query)
- [Set Up Field Extraction](https://docs.zk.email/zk-email-sdk/proof-of-luma#set-up-field-extraction)
- [Test the Blueprint](https://docs.zk.email/zk-email-sdk/proof-of-luma#test-the-blueprint)