export default async ({ project, client, $, directory, worktree }) => {
  let editCount = 0;       // increments each time a session.idle fires with changes
  let isReminding = false;
  let currentModel = "AI"; // updated by chat.message hook

  const REMIND_EVERY = 3;  // fire reminder every Nth session with edits

  const buildReminder = (modelName) =>
    "Git check — commit if appropriate:\n" +
    `1. If no repo: \`git init && git add -A && git -c user.name='${modelName}' -c user.email='ai@local' commit -m 'Initial commit'\`\n` +
    `2. Otherwise: \`git add -A && git -c user.name='${modelName}' -c user.email='ai@local' commit -m '<what changed and why>'\`\n` +
    "Commit only complete, functional changes. Skip if you're mid-debug, actively troubleshooting, experimenting, or the current state is broken/half-finished. Don't commit every back-and-forth fiddling step — wait until something meaningful and working is in place.";

  return {
    "chat.message": async (input) => {
      if (input.model?.modelID) {
        currentModel = input.model.modelID;
      }
    },

    "tool.execute.after": async (input) => {
      if (!isReminding && ["write", "edit", "bash"].includes(input?.tool)) {
        editCount++;
      }
    },

    event: async ({ event }) => {
      if (event.type === "session.idle" && editCount > 0 && !isReminding) {
        if (editCount % REMIND_EVERY === 0) {
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
    },
  };
};
