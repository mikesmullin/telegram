# Telegram CLI Skill

This document captures **verified working usage patterns** for this project’s `telegram` CLI.

## Quick command surface

### Input
```bash
telegram --help
```

### Output (verified shape)
```text
Telegram CLI - User/Self-bot Client

Usage: telegram <command> [options]

Global options:
  -v, --verbose                  Show gram.js INFO/WARN logs

Commands:
  login                          Authenticate with Telegram
  send <recipient> <message>     Send a message
  read <chat> [limit]            Read messages (default: 10)
  list [limit]                   List open chats (default: 50)
```

## List open chats (aligned table)

### Input
```bash
telegram list 3
```

### Output (verified format, anonymized)
```text
Name            Phone         Username  Unread  Mentions
Contact Alpha   +15551232715  -         0       0
Telegram        +42777         -         0       0
Contact Beta    +15559870735  -         0       0
```

## Recipient resolver behavior (send/read)

Resolver is dialogs-first and supports:
- Name fragment (e.g. `alpha`)
- Full display name (e.g. `Contact Alpha`)
- Full phone (e.g. `+15551232715`)
- Phone suffix (e.g. `2715`)

### Input
```bash
telegram send alpha "check-in message"
telegram send +15551232715 "check-in message"
telegram send 2715 "check-in message"
telegram send "Contact Alpha" "check-in message"
```

### Output (verified shape, anonymized)
```text
sent id=48291 to Contact Alpha
sent id=48292 to Contact Alpha
sent id=48293 to Contact Alpha
sent id=48294 to Contact Alpha
```

## Read conversation (telegram-style terminal layout)

### Input
```bash
telegram read 2715 2
```

### Output (verified format, anonymized)
```text
Conversation with Contact Alpha +15551232715
                           --- Wed, Feb 25, 2026 ---
 Sure thing.
 05:38PM
 Sounds good.
 05:38PM
Showing 2 messages
```

Notes on rendering (verified):
- Width target: 80 chars
- Day separator is centered and gray, bookended by `---`
- Own messages are right-aligned, white-on-purple bubble
- Other messages are left-aligned, white-on-charcoal bubble
- Timestamp format is short (`hh:mmAM/PM`)

## Verbose logging toggle

### Input
```bash
telegram -v read 2715 1
```

### Output (verified behavior, anonymized)
```text
[2026-02-25T18:20:00.676] [INFO] - [Running gramJS version 2.26.21]
[2026-02-25T18:20:00.679] [INFO] - [Connecting to ...]
Conversation with Contact Alpha +15551232715
                           --- Wed, Feb 25, 2026 ---
                                                          check-in message
                                                                        06:20PM
Showing 1 messages
[2026-02-25T18:20:01.126] [WARN] - [Disconnecting...]
```

Without `-v`, INFO/WARN gram.js logs are suppressed.

## Common usage patterns

### 1) Find recent chats, then read one
```bash
telegram list 20
telegram read 2715 10
```

### 2) Read by fuzzy identity and reply
```bash
telegram read alpha 5
telegram send alpha "On it — I’ll follow up shortly."
```

### 3) Debug connectivity/session issues
```bash
telegram -v read alpha 1
```
