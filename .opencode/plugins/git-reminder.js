export default async ({ project, client, $, directory, worktree }) => {
  let hadEditsThisSession = false; // did this session have any edits?
  let sessionsWithEdits = 0;       // increments once per session that had edits
  let isReminding = false;
  let currentModel = "AI";

  const REMIND_EVERY = 3; // fire reminder every Nth session that had edits

  // All built-in opencode tool names. Anything NOT in this set is an MCP/plugin tool.
  const BUILTIN_TOOLS = new Set([
    "read", "write", "edit", "bash", "glob", "grep", "codesearch",
    "webfetch", "websearch", "question", "plan", "plan_exit", "task",
    "todowrite", "skill", "invalid", "lsp", "apply_patch",
  ]);

  const isEditTool = (tool) =>
    tool === "write" ||
    tool === "edit" ||
    !BUILTIN_TOOLS.has(tool); // anything not a built-in = MCP tool

  const buildReminder = (modelName) =>
    "Git check — commit if appropriate:\n" +
    `1. If no repo: \`git init && git add -A && git -c user.name='${modelName}' -c user.email='ai@local' commit -m 'Initial commit'\`\n` +
    `2. Otherwise: \`git add -A && git -c user.name='${modelName}' -c user.email='ai@local' commit -m '<what changed and why>'\`\n` +
    "Commit only complete, functional changes. Skip if you're mid-debug, actively troubleshooting, experimenting, or the current state is broken/half-finished. Don't commit every back-and-forth fiddling step — wait until something meaningful and working is in place.";

  return {
    // Capture current model name from incoming message
    "chat.message": async (input, output) => {
      if (input.model?.modelID) {
        currentModel = input.model.modelID;
      }
    },

    // Flag that this session made changes (file write/edit or any MCP tool call)
    "tool.execute.after": async (input, output) => {
      if (!isReminding && isEditTool(input?.tool)) {
        hadEditsThisSession = true;
      }
    },

    // On session idle: count sessions with edits, fire reminder every REMIND_EVERY
    event: async ({ event }) => {
      if (event.type === "session.idle" && !isReminding) {
        if (hadEditsThisSession) {
          sessionsWithEdits++;
          hadEditsThisSession = false; // reset for next session

          if (sessionsWithEdits % REMIND_EVERY === 0) {
            isReminding = true;
            try {
              await client.session.prompt({
                path: { id: event.properties.sessionID },
                body: {
                  parts: [{ type: "text", text: buildReminder(currentModel) }],
                },
              });
            } catch (err) {
              console.log("[git-reminder] ERROR:", err?.message ?? err);
            } finally {
              isReminding = false;
            }
          }
        }
      }
    },
  };
};
