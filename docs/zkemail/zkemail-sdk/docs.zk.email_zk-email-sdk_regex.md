[Skip to main content](https://docs.zk.email/zk-email-sdk/regex#__docusaurus_skipToContent_fallback)

On this page

ZK Email allows you to create zero-knowledge proofs of emails. You can define a **decomposed regex** to extract specific fields from an email (such as sender, recipient, subject, timestamps, etc.) while keeping the rest of the email private.

This page will explain how regex works, how decomposed regex is used in ZK Email, common special characters, and provide template examples for popular email fields.

## What is Regex? [​](https://docs.zk.email/zk-email-sdk/regex\#what-is-regex "Direct link to What is Regex?")

**Regex** (short for _regular expression_) is a sequence of characters that forms a search pattern. It is widely used to match or find strings in text. For example, you might use regex to find all email addresses in a long document, or to validate if a user’s input meets certain rules (e.g., format of a phone number).

A regular expression uses a combination of:

- **Literal characters** (e.g., letters, numbers, punctuation).
- **Metacharacters** (e.g., `^`, `$`, `(`, `)`, `?`, `+`, `*`, `[`, `]`, `{`, `}`, `|`, `\`).
- **Quantifiers** (e.g., `?`, `+`, `*`, `{m,n}`).
- **Character classes** (e.g., `[A-Za-z0-9]`, `[^a-z]`, `\s`).
- **Anchors** (e.g., `^` for start of string, `$` for end of string, `\b` for word boundary).

These building blocks allow you to define very patterns to search or extract substrings from text.

Examples:

- `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}` \- Matches email addresses. [**Try out**](https://regex101.com/r/NlTlk4/1).
- `^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$` \- Matches US phone numbers. [**Try out**](https://regex101.com/r/QwP1va/1).
- `^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$` \- Matches valid IP address octets (0-255). [**Try out**](https://regex101.com/r/E6ujVA/1).

### Special Characters and Expressions [​](https://docs.zk.email/zk-email-sdk/regex\#special-characters-and-expressions "Direct link to Special Characters and Expressions")

Two characters commonly used when dealing with multi-line text (such as emails) are:

- `\n` : Represents the **newline** character (line feed).
- `\r` : Represents the **carriage return** character.

Email headers often contain `\r\n` pairs to mark the end of lines. Depending on the email format, you might see these in the raw headers. In your regular expressions, you can match them explicitly by including `\r`, `\n`, or a combination like `(\r\n|^)` to anchor your pattern at the beginning of a line or match line breaks.

Here's a quick reference of commonly used regex special characters and expressions:

| Character / Expression | Description |
| --- | --- |
| `.` | Matches any character except newline |
| `^` | Start of string/line |
| `$` | End of string/line |
| `*` | 0 or more occurrences |
| `+` | 1 or more occurrences |
| `?` | 0 or 1 occurrence |
| `\w` | Word character \[A-Za-z0-9\_\] |
| `\d` | Digit \[0-9\] |
| `\s` | Whitespace (space, tab, newline) |
| `[abc]` | Character class - matches a, b, or c |
| `[^abc]` | Negated class - matches anything except a, b, or c |
| `(...)` | Capturing group |
| `(?:...)` | Non-capturing group |
| `a{3}` | Exactly 3 occurrences of a |
| `a{3,}` | 3 or more occurrences of a |
| `a{3,6}` | Between 3 and 6 occurrences of a |
| `a|b` | Alternation - matches a or b |

For an interactive regex tester and comprehensive reference, visit [regex101.com](https://regex101.com/). Note that we don't support all regex features supported by them.

### Unsupported Regex [​](https://docs.zk.email/zk-email-sdk/regex\#unsupported-regex "Direct link to Unsupported Regex")

We need our regex matches to be deterministic and able to be calculated one character at a time in order. This means that we don't support the following regex features:

- Regular expressions where the results differ between greedy and lazy matching (e.g., `.+`, `.+?`, `.*`) are not supported.
- The beginning anchor ^ must either appear at the beginning of the regular expression or be in the format `(\r\n|^)`. Additionally, the section containing this ^ must be non-public (is\_public: false). You don't need the `$` at the end of the regex.
- Lookarounds like `(?=...)` are not supported. Lookbehinds like `(?<=...)` are also not supported.
- Regular expressions that, when converted to DFA, have multiple accepting states are not supported. You can think of this as meaning that the regex should end on a known character.
- Decomposed regex definitions must alternate public and private states.

## Decomposed Regex [​](https://docs.zk.email/zk-email-sdk/regex\#decomposed-regex "Direct link to Decomposed Regex")

For extracting specific fields from an email, a **decomposed regex** breaks a single regular expression into smaller, sequential parts. Instead of having one large and complex regex, ZK Email uses an array of parts definitions, each describing a consecutive part of the regex and visibility.

Each part in the decomposed regex includes:

- `isPublic`: a boolean indicating if this part of the match should be public or private in the final proof.
- `regexDef`: the portion of the regex pattern.

When these parts are combined in order, they form a complete pattern for matching. You can also find an example of a parts array from our [ZK Email Registry](https://registry.zk.email/dc963079-fe7d-4bcb-a4ed-c60ad7a93d2b/parameters#:~:text=parts).

info

If multiple matches are found in the email, only the first match will be used. Make sure your regex pattern is specific enough to uniquely identify the desired content.

## Decomposed Regex Examples [​](https://docs.zk.email/zk-email-sdk/regex\#decomposed-regex-examples "Direct link to Decomposed Regex Examples")

Below are some common email fields you might want to extract. If you want to create your own email proof, please refer to our guide to [create a new blueprint](https://docs.zk.email/zk-email-sdk/create-blueprint).

### Recommendations [​](https://docs.zk.email/zk-email-sdk/regex\#recommendations "Direct link to Recommendations")

1. **Always Start with `(\r\n|^)`**

Use `(\r\n|^)` at the beginning of all regexes, especially before fields like `from`, `to`, and `subject`.

**Why?** This prevents potential spoofing or manipulation of field content.

2. **Adopt the `[^x]+x` Pattern**

Use a pattern like `[^x]+x`, which matches one or more characters that are not the target ( `x`), followed by the target character.

**Why?** This strategy avoids the need to precisely define every nuance of a field, reducing the chance of errors.

3. **Avoid Ending a Regex with `?`**

Ending a regex with `?` creates multiple accepting states in the DFA, which can lead to unexpected behavior.

**Tip:** Restructure your regex to handle optional elements without placing `?` at the very end.

4. **Do Not Use `{m,n}` for Size Constraints**

Size constraints using `{m,n}` are not yet supported in our system.

**Note:** This feature is a work in progress, so please avoid using these quantifiers for now.


### Email Sender [​](https://docs.zk.email/zk-email-sdk/regex\#email-sender "Direct link to Email Sender")

Below is a decomposed regex that extracts the **email sender**, capturing the sender email address as public.

```codeBlockLines_e6Vv
[\
  {\
    "isPublic": false,\
    "regexDef": "(\r\n|^)from:"\
  },\
  {\
    "isPublic": false,\
    "regexDef": "([^\r\n]+<)?"\
  },\
  {\
    "isPublic": true,\
    "regexDef": "[A-Za-z0-9!#$%&'\*\+\-/=\?\^_`{\|}~\.]+@[A-Za-z0-9\.-]+"\
  },\
  {\
    "isPublic": false,\
    "regexDef": ">?\r\n"\
  }\
]

```

### Email Recipient [​](https://docs.zk.email/zk-email-sdk/regex\#email-recipient "Direct link to Email Recipient")

Similar approach for the **email recipient**:

```codeBlockLines_e6Vv
[\
  {\
    "isPublic": false,\
    "regexDef": "(\r\n|^)to:"\
  },\
  {\
    "isPublic": false,\
    "regexDef": "([^\r\n]+<)?"\
  },\
  {\
    "isPublic": true,\
    "regexDef": "[a-zA-Z0-9!#$%&'\*\+\-/=\?\^_`{\|}~\.]+@[a-zA-Z0-9_\.-]+"\
  },\
  {\
    "isPublic": false,\
    "regexDef": ">?\r\n"\
  }\
]

```

### Email Subject [​](https://docs.zk.email/zk-email-sdk/regex\#email-subject "Direct link to Email Subject")

Capturing the **subject** line:

```codeBlockLines_e6Vv
[\
  {\
    "isPublic": false,\
    "regexDef": "(\r\n|^)subject:"\
  },\
  {\
    "isPublic": true,\
    "regexDef": "[^\r\n]+"\
  },\
  {\
    "isPublic": false,\
    "regexDef": "\r\n"\
  }\
]

```

### Timestamp (from DKIM-Signature) [​](https://docs.zk.email/zk-email-sdk/regex\#timestamp-from-dkim-signature "Direct link to Timestamp (from DKIM-Signature)")

Capturing a **timestamp** from a DKIM-Signature header (denoted by `t=`):

```codeBlockLines_e6Vv
[\
  {\
    "isPublic": false,\
    "regexDef": "(\r\n|^)dkim-signature:"\
  },\
  {\
    "isPublic": false,\
    "regexDef": "([a-z]+=[^;]+; )+t="\
  },\
  {\
    "isPublic": true,\
    "regexDef": "[0-9]+"\
  },\
  {\
    "isPublic": false,\
    "regexDef": ";"\
  }\
]

```

- [What is Regex?](https://docs.zk.email/zk-email-sdk/regex#what-is-regex)
  - [Special Characters and Expressions](https://docs.zk.email/zk-email-sdk/regex#special-characters-and-expressions)
  - [Unsupported Regex](https://docs.zk.email/zk-email-sdk/regex#unsupported-regex)
- [Decomposed Regex](https://docs.zk.email/zk-email-sdk/regex#decomposed-regex)
- [Decomposed Regex Examples](https://docs.zk.email/zk-email-sdk/regex#decomposed-regex-examples)
  - [Recommendations](https://docs.zk.email/zk-email-sdk/regex#recommendations)
  - [Email Sender](https://docs.zk.email/zk-email-sdk/regex#email-sender)
  - [Email Recipient](https://docs.zk.email/zk-email-sdk/regex#email-recipient)
  - [Email Subject](https://docs.zk.email/zk-email-sdk/regex#email-subject)
  - [Timestamp (from DKIM-Signature)](https://docs.zk.email/zk-email-sdk/regex#timestamp-from-dkim-signature)