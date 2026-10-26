# Building Google site: links by hand

Use these rules only when the MCP tools are not connected. They match what the tools and the web app do.

## Query shape

```
site:<domain> <operator>:"<keyword>"
```

- Domain: lower case, no `https://`, no `www.`. A folder keeps its slash: `example.com/blog/`.
- Exact match: wrap the keyword in quotes. For `allintitle:` and the other all- operators, quote each word.
- Several keywords with intitle: or intext: go in one OR group: `(intitle:"a" OR intitle:"b")`.
- Several keywords with inurl: get one query each. Google returns nothing for `inurl:a OR inurl:b`. This was tested in October 2026.
- Exclude a word with a minus: `-jobs`.
- Dates: `after:2026-01-01`, `before:2026-06-30`.
- File types: `filetype:pdf`. OR between file types works: `(filetype:pdf OR filetype:docx)`.
- Folders on one site: OR between site: terms works and also catches subdomains: `(site:example.com/blog OR site:example.com/resources)`.

## Operators

| Operator | Finds pages with the keyword in |
| --- | --- |
| `intitle:` | the title |
| `allintitle:` | the title, every word |
| `inurl:` | the URL |
| `allinurl:` | the URL, every word |
| `intext:` | the body text |
| `allintext:` | the body text, every word |
| none | anywhere on the page |

Do not use `link:`, `info:`, `cache:`, `inanchor:`, `location:` or `daterange:`. They are retired or unreliable.

## Making the link

```
https://www.google.com/search?q=<the query, URL-encoded>
```

Example: `site:example.com intitle:"onboarding checklist"` becomes
`https://www.google.com/search?q=site%3Aexample.com%20intitle%3A%22onboarding%20checklist%22`

Give the user clickable links and say they open in their own browser. Never open or read the results yourself.
