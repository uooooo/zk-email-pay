[Skip to main content](https://docs.zk.email/zk-email-sdk/registry#__docusaurus_skipToContent_fallback)

On this page

The ZK Email Registry is a platform that allows you to create, manage, and sharing email zero-knowledge proofs. It provides an interface for defining email verification [blueprints](https://docs.zk.email/zk-email-sdk/registry#what-is-a-blueprint) and generating proofs.

You can browse existing blueprints to see what others have created, or [create your own new blueprints](https://docs.zk.email/zk-email-sdk/create-blueprint).

To get started, you can visit the [ZK Email Registry](https://registry.zk.email/).

## What is a blueprint? [​](https://docs.zk.email/zk-email-sdk/registry\#what-is-a-blueprint "Direct link to What is a blueprint?")

A blueprint is a set of parameters that define the email proof. These parameters include the regex for extracting parts of the email, the size of the email header and body, the email sender and all the required fields. The registry uses these parameters to compile a circuit that can be used to generate proofs.

A blueprint consists of:

- **Pattern Details**: This defines the pattern name, circuit name, and description of the blueprint.
- **Proof Details**: Includes the sender, fields to extract and external inputs for generating the proof.

The Registry uses these parameters to compile a zero-knowledge circuit and creating for proof generation and a smart contract for proof verification.

## Create New Blueprint [​](https://docs.zk.email/zk-email-sdk/registry\#create-new-blueprint "Direct link to Create New Blueprint")

To create a new blueprint, you must be signed in with your Github account. Once you are signed in, you can click the "Create Blueprint" button to start the creation process.

If you want to learn how to create a new blueprint, follow this guide:

[**📄️Blueprints** \\
Learn more about blueprints.](https://docs.zk.email/zk-email-sdk/create-blueprint)[**📄️Regex** \\
Learn how to create a new regex pattern.](https://docs.zk.email/zk-email-sdk/regex)

## Step-by-step Guides [​](https://docs.zk.email/zk-email-sdk/registry\#step-by-step-guides "Direct link to Step-by-step Guides")

[**📄️Creating Proof Of Luma** \\
Learn how to create a Proof of Luma.](https://docs.zk.email/zk-email-sdk/proof-of-luma)

- [What is a blueprint?](https://docs.zk.email/zk-email-sdk/registry#what-is-a-blueprint)
- [Create New Blueprint](https://docs.zk.email/zk-email-sdk/registry#create-new-blueprint)
- [Step-by-step Guides](https://docs.zk.email/zk-email-sdk/registry#step-by-step-guides)