[Skip to main content](https://docs.zk.email/zk-email-sdk/create-blueprint#__docusaurus_skipToContent_fallback)

On this page

The ZK Email Registry allows you to create email proofs by defining a blueprint. This guide will walk you through the steps to create a new blueprint, ensuring you can set up a new email verification pattern.

Prerequisites

Before starting, you'll need an .EML file. If you don't have one, learn how to obtain it [**here**](https://docs.zk.email/zk-email-sdk/get-eml-file).

## Getting Started [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#getting-started "Direct link to Getting Started")

1. Log in to the [**ZK Email Registry**](https://registry.zk.email/) using your GitHub account (your handle will be used to identify your blueprints).
2. Navigate to the blueprint creation page.
3. Click the "Create Blueprint" button on the top right to begin.

## Blueprint Details [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#blueprint-details "Direct link to Blueprint Details")

![Create Blueprint Step 1](https://docs.zk.email/assets/images/create-blueprint-af0a71c1ea561137ab3e9ee443f15e58.webp)

### Pattern Name [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#pattern-name "Direct link to Pattern Name")

Choose a descriptive and clear name that users will see in the registry.

```codeBlockLines_e6Vv
Example: "Google Confirmation Proof"

```

### Slug [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#slug "Direct link to Slug")

Your URL identifier is automatically generated as:

```codeBlockLines_e6Vv
{github-username}/{circuitName}

```

### Test Email Upload [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#test-email-upload "Direct link to Test Email Upload")

Upload a .EML file here. This file serves multiple purposes:

- Powering the AI auto extraction feature
- Testing your extraction regex

If you need to download an .EML file, you can learn how to do so [**here**](https://docs.zk.email/zk-email-sdk/get-eml-file).

### Description [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#description "Direct link to Description")

Provide a concise yet informative explanation of what your blueprint proves.

```codeBlockLines_e6Vv
Example: "Prove that you received a devcon confirmation email."

```

## Email Details [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#email-details "Direct link to Email Details")

Now we will configure the query to find the email for creating the proof and setting the sender domain to be used for DKIM verification.

![Create Blueprint Step 2](https://docs.zk.email/assets/images/create-blueprint-step2-5af95f1936a8b52f32216299e45a2229.webp)

### Email Query [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#email-query "Direct link to Email Query")

Specify a Gmail search query to locate relevant emails. You can use any valid Gmail query. More information [**here**](https://support.google.com/mail/answer/7190).

```codeBlockLines_e6Vv
Example: "from:google.com"

```

This query is used to search the logged-in user's Gmail inbox to easily find and select the relevant email for generating proofs.

### Sender Domain [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#sender-domain "Direct link to Sender Domain")

Specify the domain used for DKIM verification, which is crucial for email authenticity.

- Location: Find this in the `d=` field of the DKIM-Signature header.
- Format: Enter the domain name without the "@" symbol.

```codeBlockLines_e6Vv
Example: "google.com"

```

info

Sometimes there are multiple DKIM signatures in the email. In this case you should use the one that is more likely to be the one from the sender (more similar or the same as the one specified in the from field).

Example of an email with multiple DKIM signatures:

```codeBlockLines_e6Vv
From: Uber Receipts <noreply@uber.com>

DKIM-Signature: ... d=mgt.uber.com; ...
DKIM-Signature: ... d=mailgun.org ...

```

In this case you should set the sender domain to mgt.uber.com as it is more likely to be the one from the sender.

### Max Email Header Length [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#max-email-header-length "Direct link to Max Email Header Length")

Define the maximum size for email headers:

- Must be a multiple of 64 bytes
- Ensure it's large enough to encompass your entire email header

```codeBlockLines_e6Vv
Example: 1024

```

caution

Setting this value too low may result in a blueprint compilation error, while setting it too high unnecessarily increases the circuit size.

### Skip body hash check [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#skip-body-hash-check "Direct link to Skip body hash check")

Enable this option to ignore the email body during proof generation:

- Useful when extracting data solely from headers
- Reduces the number of constraints in the circuit
- Can significantly improve proof generation speed

note

Only enable this if you're certain all required data is in the headers, as it will prevent any body content verification.

warning

This option should be marked if you're using an email from Protonmail as they don't provide access to the original email body.

### Email Body Cutoff Value [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#email-body-cutoff-value "Direct link to Email Body Cutoff Value")

This is optional but we encourage you to set it in order to reduce the circuit size and its compilation time.

## Field Extraction [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#field-extraction "Direct link to Field Extraction")

This section defines the data you want to extract from the email.

![Create Blueprint Step 3](https://docs.zk.email/assets/images/create-blueprint-step3-54c69613bb673ded848d7f92234f2820.webp)

### AI Auto-extraction [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#ai-auto-extraction "Direct link to AI Auto-extraction")

Leverage AI to simplify the field extraction process:

- Provide a clear description of the fields you want to extract
- Click the "Generate Fields" button
- Review and refine the AI-generated extraction fields as needed

### Fields to Extract [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#fields-to-extract "Direct link to Fields to Extract")

For each data point you wish to extract:

- **Field Name**: Assign a clear, descriptive identifier





```codeBlockLines_e6Vv
Example: "receiverName"

```

- **Data Location**: Specify the email section to search:
  - Body: Main email content
  - Headers: Email metadata (subject, sender, etc.)
- **Max Length**: Set the maximum character count for this field





```codeBlockLines_e6Vv
Example: 64

```

- **Decomposed Regex Parts**: Define your extraction pattern:





```codeBlockLines_e6Vv
[\
    {\
      "isPublic": true,\
      "regexDef": "[a-zA-Z0-9_]+"  // Matches username\
    }\
]

```


Learn more about decomposed regex [**here**](https://docs.zk.email/zk-email-sdk/regex#decomposed-regex).

### External Inputs [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#external-inputs "Direct link to External Inputs")

For any additional data:

- **Field Name**: Choose a descriptive identifier (e.g., "eventCode")
- **Maximum Length**: Set an appropriate character limit (e.g., 20)

## Example Blueprints [​](https://docs.zk.email/zk-email-sdk/create-blueprint\#example-blueprints "Direct link to Example Blueprints")

[**📄️Proof of Luma** \\
Proof that you were confirmed for a Luma event](https://docs.zk.email/zk-email-sdk/proof-of-luma)

- [Getting Started](https://docs.zk.email/zk-email-sdk/create-blueprint#getting-started)
- [Blueprint Details](https://docs.zk.email/zk-email-sdk/create-blueprint#blueprint-details)
  - [Pattern Name](https://docs.zk.email/zk-email-sdk/create-blueprint#pattern-name)
  - [Slug](https://docs.zk.email/zk-email-sdk/create-blueprint#slug)
  - [Test Email Upload](https://docs.zk.email/zk-email-sdk/create-blueprint#test-email-upload)
  - [Description](https://docs.zk.email/zk-email-sdk/create-blueprint#description)
- [Email Details](https://docs.zk.email/zk-email-sdk/create-blueprint#email-details)
  - [Email Query](https://docs.zk.email/zk-email-sdk/create-blueprint#email-query)
  - [Sender Domain](https://docs.zk.email/zk-email-sdk/create-blueprint#sender-domain)
  - [Max Email Header Length](https://docs.zk.email/zk-email-sdk/create-blueprint#max-email-header-length)
  - [Skip body hash check](https://docs.zk.email/zk-email-sdk/create-blueprint#skip-body-hash-check)
  - [Email Body Cutoff Value](https://docs.zk.email/zk-email-sdk/create-blueprint#email-body-cutoff-value)
- [Field Extraction](https://docs.zk.email/zk-email-sdk/create-blueprint#field-extraction)
  - [AI Auto-extraction](https://docs.zk.email/zk-email-sdk/create-blueprint#ai-auto-extraction)
  - [Fields to Extract](https://docs.zk.email/zk-email-sdk/create-blueprint#fields-to-extract)
  - [External Inputs](https://docs.zk.email/zk-email-sdk/create-blueprint#external-inputs)
- [Example Blueprints](https://docs.zk.email/zk-email-sdk/create-blueprint#example-blueprints)