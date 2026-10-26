# Security

## Reporting a problem

Please do not open a public issue for security problems. Send a private message to Albert Adaikkalam on LinkedIn (https://www.linkedin.com/in/albertalbs/) or use GitHub's private vulnerability reporting on this repository. You will get a reply within a week.

## How the server protects you

- It fetches only http and https addresses on the public internet. Local and private network addresses (localhost, 10.x, 192.168.x, cloud metadata addresses and similar) are refused, and so are redirects that lead to them. For testing against a local site, set `SSO_ALLOW_PRIVATE=1` on the local version only.
- It follows robots.txt and spaces out requests to each site.
- Downloads are capped in size and time.
- The local `save-file` tool writes only `.json`, `.csv`, `.md` and `.txt` files, only inside its output folder, and never overwrites a file.
- The hosted version refuses every request without the right `ACCESS_KEY`, and refuses to start with a key shorter than 16 characters.
- Text fetched from websites is returned as data. The tool descriptions tell the AI not to follow instructions found inside it.

## Hosted version

Your MCP address contains your access key. Treat it like a password. To change it, run `npx wrangler secret put ACCESS_KEY` again and update the address in your AI apps.
