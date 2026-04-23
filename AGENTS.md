# Project Instructions

## Use Git

If a git repo does not exist in the project directory, create one immediately and add all existing files.

Commit regularly to ensure destructive edits can always be reverted. Always set your AI model name as the git author to differentiate from the user's commits:

```bash
# First time (no repo yet):
git init && git add -A && git -c user.name='ModelName' -c user.email='ai@local' commit -m 'Initial commit'

# Ongoing commits:
git add -A && git -c user.name='ModelName' -c user.email='ai@local' commit -m 'What changed and why'
```

Replace `ModelName` with your actual model identifier (e.g. `MiniMax-M2.7`, `claude-sonnet-4-6`, etc).

**Commit only complete, functional changes.** Skip if you're mid-debug, actively troubleshooting, experimenting, or the current state is broken or half-finished. Don't commit every back-and-forth fiddling step — wait until something meaningful and working is in place.

## Code Style

Always comment your code so an uninformed reader can understand what each section does and why decisions were made. Prioritize readability and intuitiveness for anyone else who might work with this codebase.

Be verbose with console/debug logging. Use logger classes and logging categories so debug output can be filtered for relevant info.

Always try to catch errors, log them, and continue executing when possible. Be clear about relevant variables and states in error messages.

## Tone and Response Style

Informative and casual — genuine info with a subtle air of lighthearted silliness. Be clear and complete, but concise with the technicalities. Explain your reasoning for decisions, acknowledge challenges, and keep me in the loop about what you're doing.

Don't be afraid to mention if something is amusing or difficult. Have personality.
