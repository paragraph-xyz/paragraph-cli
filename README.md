# @paragraph-com/cli

Command-line interface for [Paragraph](https://paragraph.com). Designed for both human and programmatic (agent) usage.

## Installation

```bash
yarn install
yarn build
yarn link

paragraph --help
```

## Authentication

Get your API key from **paragraph.com/settings → Publication → Developer**.

```bash
# Interactive login (opens browser or prompts for key)
paragraph login

# Provide token directly
paragraph login --token <your-api-key>

# Pipe token from stdin (useful for CI/agents)
echo "<your-api-key>" | paragraph login --with-token

# Environment variable (no login needed)
export PARAGRAPH_API_KEY=<your-api-key>

# Verify
paragraph whoami

# Remove stored credentials
paragraph logout
```

Credentials are stored in `~/.paragraph/config.json` (mode 0600).

## Commands

### Posts

```bash
# List your posts (requires auth)
paragraph post list
paragraph post list --status draft
paragraph post list --limit 50 --cursor <cursor>

# List posts from any publication (public)
paragraph post list --publication <id-or-slug>

# Get a post — accepts ID, URL, or @publication/slug
paragraph post get <post-id>
paragraph post get @yearn/some-post-slug
paragraph post get https://paragraph.com/@yearn/some-post-slug

# Extract a single field (outputs raw value to stdout, pipeable)
paragraph post get <id> --field markdown > post.md
paragraph post get <id> --field title

# Browse posts
paragraph post by-tag defi --limit 20
paragraph post feed --limit 10

# Create a post (defaults to draft)
paragraph post create --title "My Post" --text "# Hello World"
paragraph post create --title "My Post" --file ./draft.md
cat draft.md | paragraph post create --title "From Stdin"
paragraph post create --title "Post" --text "Content" --subtitle "Summary" --tags "web3,defi"

# Update a post
paragraph post update <id-or-slug> --title "New Title"
paragraph post update <id-or-slug> --file ./updated.md --tags "new,tags"

# Lifecycle
paragraph post publish <id-or-slug>                  # publish a draft
paragraph post publish <id-or-slug> --newsletter     # publish + send email to subscribers
paragraph post draft <id-or-slug>                    # revert to draft
paragraph post archive <id-or-slug>                  # archive

# Send test newsletter email (draft only)
paragraph post test-email <id>

# Delete a post
paragraph post delete <id-or-slug>
paragraph post delete <id-or-slug> --yes             # skip confirmation (required for agents/CI)
```

Top-level shortcuts:

```bash
paragraph create --title "Quick Post" --text "Content"
paragraph update my-post-slug --title "Updated"
paragraph delete my-post-slug --yes
```

### Publications

```bash
# Get publication — accepts ID, slug, or custom domain
paragraph publication get @variantwriting
paragraph publication get blog.variant.fund
paragraph publication get <publication-id>
```

### Search

```bash
paragraph search post --query "ethereum"
paragraph search blog --query "web3"
```

### Subscribers

```bash
paragraph subscriber list --limit 100
paragraph subscriber count <publication-id>
paragraph subscriber add --email user@example.com
paragraph subscriber import --csv subscribers.csv
```

### Coins

```bash
paragraph coin get <id-or-address>
paragraph coin popular --limit 10
paragraph coin search --query "test"
paragraph coin holders <id-or-address> --limit 50
paragraph coin quote <id-or-address> --amount <wei>
paragraph coin buy-args <id-or-address> --wallet <addr> --amount <wei>
paragraph coin sell-args <id-or-address> --wallet <addr> --amount <wei>
```

### Users

```bash
paragraph user get <user-id>
paragraph user get 0x1234...    # by wallet address
```

## Agent / Programmatic Usage

The CLI is designed for use by AI agents and scripts. Key features:

### JSON output

All commands support `--json`. Data goes to **stdout**, status messages to **stderr**, so you can pipe cleanly:

```bash
paragraph --json post list | jq '.[0].title'
paragraph --json post get <id> | jq '.markdown'
paragraph --json search post --query "web3" | jq 'length'
```

### Structured errors

In `--json` mode, errors are structured JSON on stdout with a non-zero exit code:

```json
{"error": "Not found. Request failed with status code 404", "status": 404}
{"error": "No API key found. Run `paragraph login` or set PARAGRAPH_API_KEY."}
```

### Field extraction

Use `--field` to extract a single value from any `post get` result — outputs raw content to stdout with no formatting:

```bash
# Download post content as markdown
paragraph post get <id> --field markdown > post.md

# Get just the title
title=$(paragraph post get <id> --field title)
```

### Pagination

List commands support `--limit` and `--cursor` for pagination:

```bash
# First page
paragraph --json post list --publication yearn --limit 10

# Subsequent pages (cursor printed to stderr)
paragraph --json post list --publication yearn --limit 10 --cursor <cursor>
```

### Non-interactive safety

- `delete` requires `--yes` in non-TTY environments (exits with error otherwise)
- `login` supports `--with-token` for stdin piping and `--token` for direct input
- Set `PARAGRAPH_NON_INTERACTIVE=1` or `CI=true` to force CLI mode (no TUI)

### Environment variables

| Variable | Purpose |
|----------|---------|
| `PARAGRAPH_API_KEY` | API key (alternative to `login`) |
| `PARAGRAPH_API_URL` | Custom API base URL |
| `PARAGRAPH_NON_INTERACTIVE` | Set to `1` to disable TUI |
| `CI` | Set to `true` to disable TUI |

## Development

```bash
yarn build          # build once
yarn dev            # watch mode
```
