# Project Instructions

## Use Git

Commit regularly to ensure destructive edits can always be reverted. Always set your AI model name as the git author to differentiate from the user's commits:

```bash
# First time (no repo yet):
git init && git add -A && git -c user.name='ModelName' -c user.email='ai@local' commit -m 'Initial commit'

# Ongoing commits:
git add -A && git -c user.name='ModelName' -c user.email='ai@local' commit -m 'What changed and why'
```

Replace `ModelName` with your actual model identifier (e.g. `MiniMax-M2.7`, `claude-sonnet-4-6`, etc).

**Commit only complete, functional changes.** Skip if you're mid-debug, actively troubleshooting, experimenting, or the current state is broken or half-finished. Don't commit every back-and-forth fiddling step — wait until something meaningful and working is in place. Wait for the user to verify something works before assuming an implementation is correct and functional.

## Code Style

Always comment your code so an uninformed reader can understand what each section does and why decisions were made. Prioritize readability and intuitiveness for anyone else who might work with this codebase. Match the tone, length, and style of existing comments already present in the codebase.

Be verbose with console/debug logging. Use logger classes and logging categories so debug output can be filtered for relevant info.

Always try to catch errors, log them, and continue executing when possible. Be clear about relevant variables and states in error messages.

## Dependencies and Libraries

Avoid unless requested. Ask before importing anything.

## Tone and Response Style

Informative and casual — genuine info with a subtle air of lighthearted silliness. Be clear and complete, but concise with the technicalities. Explain your reasoning for decisions, acknowledge challenges, and keep me in the loop about what you're doing.

Don't be afraid to mention if something is amusing or difficult. Have personality.

## This Codebase

This is a web and mobile app for PonyvilleFM, the longest-running "Brony" radio station. It is accessible at https://pvfm.deltaryz.com via a Caddy V1 webserver, works as a PWA, as well as a Google Play app which packages the PWA with Bubblewrap. The live Caddy server automatically updates from the master branch of the repo on GitHub.

Caddy config: https://github.com/deltaryz/docker/blob/3b678308d151ad997f67b9ec18368f21e3758b3c/Caddyfile#L41

This player is optimized for both desktop and mobile usage, with full support for OS metadata and media control APIs.

We do not have access to PVFM's actual backend, this is simply a client frontend player. Audio streams and metadata all come from the remote PVFM servers, and we have zero control over how it returns data.

## Target Platforms

- https://pvfm.deltaryz.com/
  - Chrome/Chromium-derivative
  - Firefox
  - Safari/WebKit
- PWA
  - Simply loads from https://pvfm.deltaryz.com
  - aggressive cache-busting
- Google Play Store APK
  - Same as PWA
  - Packaged with Bubblewrap

For the vast majority of tasks and features, the primary HTML/CSS/JS files and assets are the only thing that should need changing.