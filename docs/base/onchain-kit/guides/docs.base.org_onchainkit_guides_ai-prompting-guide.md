Guides

Developer's Guide to Effective AI Prompting

[Get Started](https://docs.base.org/get-started/base) [Base Chain](https://docs.base.org/base-chain/quickstart/why-base) [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) [Base App](https://docs.base.org/base-app/introduction/beta-faq) [Mini Apps](https://docs.base.org/mini-apps/overview) [OnchainKit](https://docs.base.org/onchainkit/getting-started) [Cookbook](https://docs.base.org/cookbook/onboard-any-user) [Showcase](https://docs.base.org/showcase) [Learn](https://docs.base.org/learn/welcome)

On this page

- [Understanding Context Windows](https://docs.base.org/onchainkit/guides/ai-prompting-guide#understanding-context-windows)
- [Why Context Matters](https://docs.base.org/onchainkit/guides/ai-prompting-guide#why-context-matters)
- [Optimizing for Context Windows](https://docs.base.org/onchainkit/guides/ai-prompting-guide#optimizing-for-context-windows)
- [Setting Up AI Tools](https://docs.base.org/onchainkit/guides/ai-prompting-guide#setting-up-ai-tools)
- [Configuring Cursor Rules](https://docs.base.org/onchainkit/guides/ai-prompting-guide#configuring-cursor-rules)
- [Creating Cursor Rules](https://docs.base.org/onchainkit/guides/ai-prompting-guide#creating-cursor-rules)
- [Setting Up an OnchainKit Project](https://docs.base.org/onchainkit/guides/ai-prompting-guide#setting-up-an-onchainkit-project)
- [Creating Project Documentation](https://docs.base.org/onchainkit/guides/ai-prompting-guide#creating-project-documentation)
- [Effective Prompting Strategies](https://docs.base.org/onchainkit/guides/ai-prompting-guide#effective-prompting-strategies)
- [Be Specific and Direct](https://docs.base.org/onchainkit/guides/ai-prompting-guide#be-specific-and-direct)
- [Provide Context for Complex Tasks](https://docs.base.org/onchainkit/guides/ai-prompting-guide#provide-context-for-complex-tasks)
- [Ask for Iterations](https://docs.base.org/onchainkit/guides/ai-prompting-guide#ask-for-iterations)
- [Working with OnchainKit](https://docs.base.org/onchainkit/guides/ai-prompting-guide#working-with-onchainkit)
- [Leveraging LLMs.txt for Documentation](https://docs.base.org/onchainkit/guides/ai-prompting-guide#leveraging-llms-txt-for-documentation)
- [Component Integration Example](https://docs.base.org/onchainkit/guides/ai-prompting-guide#component-integration-example)
- [Debugging with AI](https://docs.base.org/onchainkit/guides/ai-prompting-guide#debugging-with-ai)
- [Effective Debugging Prompts](https://docs.base.org/onchainkit/guides/ai-prompting-guide#effective-debugging-prompts)
- [When You’re Stuck](https://docs.base.org/onchainkit/guides/ai-prompting-guide#when-you%E2%80%99re-stuck)
- [Advanced Prompting Techniques](https://docs.base.org/onchainkit/guides/ai-prompting-guide#advanced-prompting-techniques)
- [Best Practices Summary](https://docs.base.org/onchainkit/guides/ai-prompting-guide#best-practices-summary)

This guide helps developers leverage AI tools effectively in their coding workflow. Whether you’re using Cursor, GitHub Copilot, or other AI assistants,
these strategies will help you get better results and integrate AI smoothly into your development process.

## [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#understanding-context-windows)  Understanding Context Windows

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#why-context-matters)  Why Context Matters

AI coding assistants have what’s called a “context window” - the amount of text they can “see” and consider when generating responses. Think of it as the AI’s working memory:

- Most modern AI assistants can process thousands of tokens (roughly 4-5 words per token)
- Everything you share and everything the AI responds with consumes this limited space
- Once the context window fills up, parts of your conversational history may be lost.

This is why providing relevant context upfront is crucial - the AI can only work with what it can “see” in its current context window.

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#optimizing-for-context-windows)  Optimizing for Context Windows

To get the most out of AI assistants:

1. **Prioritize relevant information**: Focus on sharing the most important details first.
2. **Remove unnecessary content**: Avoid pasting irrelevant code or documentation.
3. **Structure your requests**: Use clear sections and formatting to make information easy to process.
4. **Reference external resources**: For large codebases, consider sharing only the most relevant files.

For larger projects, create and reference a central documentation file that summarizes key information, rather than repeatedly explaining the same context.

## [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#setting-up-ai-tools)  Setting Up AI Tools

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#configuring-cursor-rules)  Configuring Cursor Rules

Cursor Rules allow you to provide consistent context to Cursor AI, making it more effective at understanding your codebase and providing relevant suggestions.

#### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#creating-cursor-rules)  Creating Cursor Rules

1. Open the Command Palette in Cursor:   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`
2. Search for “Cursor Rules” and select the option to create or edit rules
3. Add project-specific rules that help Cursor understand your project:   - [Next.js](https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/refs/heads/main/rules/nextjs-tailwind-typescript-apps-cursorrules-prompt/.cursorrules)
   - [Astro](https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/refs/heads/main/rules/astro-typescript-cursorrules-prompt-file/.cursorrules)
   - [Vite](https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/refs/heads/main/rules/typescript-vite-tailwind-cursorrules-prompt-file/.cursorrules)
4. Save your rules file and Cursor will apply these rules to its AI suggestions

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#setting-up-an-onchainkit-project)  Setting Up an OnchainKit Project

To create a new OnchainKit project:

Copy

Ask AI

```
npm create onchain@latest

```

After creating your project, prompt to generate comprehensive documentation for your new OnchainKit project.

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#creating-project-documentation)  Creating Project Documentation

A comprehensive instructions file helps AI tools understand your project better. This should be created early in your project and updated regularly.**Ready-to-Use Prompt for Creating Instructions.md:**

Copy

Ask AI

```
Create a detailed instructions.md file for my project with the following sections:

1. Overview: Summarize the project goals, problem statements, and core functionality.
2. Tech Stack: List all technologies, libraries, frameworks with versions.
3. Project Structure: Document the file organization with explanations.
4. Coding Standards: Document style conventions, linting rules, and patterns.
5. User Stories: Key functionality from the user perspective.
6. APIs and Integrations: External services and how they connect.

```

Note: When planning architecture or making complex design decisions, use AI models with strong reasoning—like o4 mini or Claude 3.7 Sonnet. They excel at thinking through tradeoffs, edge cases, and long-term planning.

## [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#effective-prompting-strategies)  Effective Prompting Strategies

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#be-specific-and-direct)  Be Specific and Direct

Start with clear commands and be specific about what you want. AI tools respond best to clear, direct instructions.**Example:** ❌ “Help me with my code”

✅ “Refactor this authentication function to use async/await instead of nested then() calls”

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#provide-context-for-complex-tasks)  Provide Context for Complex Tasks

**Ready-to-Use Prompt:**

Copy

Ask AI

```
 I'm working on a onchainkit project using [frameworks/libraries]. I need your help with:

1. Problem: [describe specific issue]
2. Current approach: [explain what you've tried]
3. Constraints: [mention any technical limitations]
4. Expected outcome: [describe what success looks like]

Here's the relevant documentation @https://docs.base.org/onchainkit/getting-started

Here's the relevant code:
[paste your code]

```

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#ask-for-iterations)  Ask for Iterations

Start simple and refine through iterations rather than trying to get everything perfect in one go.**Ready-to-Use Prompt:**

Copy

Ask AI

```
Let's approach this step by step:
1. First, implement a basic version of [feature] with minimal functionality.
2. Then, we'll review and identify areas for improvement.
3. Next, let's add error handling and edge cases.
4. Finally, we'll optimize for performance.

Please start with step 1 now.

```

## [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#working-with-onchainkit)  Working with OnchainKit

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#leveraging-llms-txt-for-documentation)  Leveraging LLMs.txt for Documentation

The OnchainKit project provides optimized documentation in the form of LLMs.txt files. These files are specifically formatted to be consumed by AI models:

1. Use [OnchainKit Documentation](https://docs.base.org/onchainkit/getting-started)
2. Find the component you want to implement
3. Copy the corresponding LLMs.txt url
4. Paste it into your prompt to provide context

**Example LLMs.txt Usage:**

Copy

Ask AI

```
I'm implementing a swap component with OnchainKit. Here's the relevant LLMs.txt:

@https://docs.base.org/onchainkit/getting-started

Based on this documentation, please show me how to implement a wallet connector that:
1. Swap from Base USDC to Base ETH.
2. Handles connection states properly.
3. Includes error handling.
4. Follows best practices for user experience.

```

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#component-integration-example)  Component Integration Example

**Ready-to-Use Prompt for Token Balance Display:**

Copy

Ask AI

```
I need to implement a new feature in my project.

1. Shows the connected wallet's balance of our {ERC20 token}.
2. It updates when the balance changes.
3. Handles loading and error states appropriately.
4. Follows our project's coding standards.
5. Update the instructions.md to reflect this new implementation.

```

_**\*update the prompt a token of your choice**_

## [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#debugging-with-ai)  Debugging with AI

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#effective-debugging-prompts)  Effective Debugging Prompts

**Ready-to-Use Prompt for Bug Analysis:**

Copy

Ask AI

```
I'm encountering an issue with my code:

1. Expected behavior: [what should happen]
2. Actual behavior: [what's happening instead]
3. Error messages: [include any errors]
4. Relevant code: [paste the problematic code]

Please analyze this situation step by step and help me:
1. Identify potential causes of this issue
2. Suggest debugging steps to isolate the problem
3. Propose possible solutions

```

**Ready-to-Use Prompt for Adding Debug Logs:**

Copy

Ask AI

```
I need to debug the following function. Please add comprehensive logging statements that will help me trace:
1. Input values and their types
2. Function execution flow
3. Intermediate state changes
4. Output values or errors

Here's my code:
[paste your code]

```

### [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#when-you%E2%80%99re-stuck)  When You’re Stuck

If you’re uncertain how to proceed:**Ready-to-Use Clarification Prompt:**

Copy

Ask AI

```
I'm unsure how to proceed with [specific task]. Here's what I know:
1. [context about the problem]
2. [what you've tried]
3. [specific areas where you need guidance]

What additional information would help you provide better assistance?

```

## [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#advanced-prompting-techniques)  Advanced Prompting Techniques

Modern AI assistants have capabilities that you can leverage with these advanced techniques:

1. **Step-by-step reasoning**: Ask the AI to work through problems systematically

Copy

Ask AI

```
Please analyze this code step by step and identify potential issues.

```

2. **Format specification**: Request specific formats for clarity

Copy

Ask AI

```
Please structure your response as a tutorial with code examples and explanations.

```

3. **Length guidance**: Indicate whether you want brief or detailed responses

Copy

Ask AI

```
Please provide a concise explanation in 2-3 paragraphs.

```

4. **Clarify ambiguities**: Help resolve unclear points when you receive multiple options

Copy

Ask AI

```
I notice you suggested two approaches. To clarify, I'd prefer to use the first approach with TypeScript.

```

## [​](https://docs.base.org/onchainkit/guides/ai-prompting-guide\#best-practices-summary)  Best Practices Summary

01. **Understand context limitations**: Recognize that AI tools have finite context windows and prioritize information accordingly
02. **Provide relevant context**: Share code snippets, error messages, and project details that matter for your specific question
03. **Be specific in requests**: Clear, direct instructions yield better results than vague questions
04. **Break complex tasks into steps**: Iterative approaches often work better for complex problems
05. **Request explanations**: Ask the AI to explain generated code or concepts you don’t understand
06. **Use formatting for clarity**: Structure your prompts with clear sections and formatting
07. **Reference documentation**: When working with specific libraries like OnchainKit, share relevant documentation
08. **Test and validate**: Always review and test AI-generated code before implementing
09. **Build on previous context**: Refer to earlier parts of your conversation when iterating
10. **Provide feedback**: Let the AI know what worked and what didn’t to improve future responses

Was this page helpful?

YesNo

[Suggest edits](https://github.com/base/docs/edit/master/docs/onchainkit/guides/ai-prompting-guide.mdx) [Raise issue](https://github.com/base/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/onchainkit/guides/ai-prompting-guide)

[Use AI-powered IDEs](https://docs.base.org/onchainkit/guides/using-ai-powered-ides) [Testing with OnchainTestKit](https://docs.base.org/onchainkit/guides/testing-with-onchaintestkit)

Assistant

Responses are generated using AI and may contain mistakes.