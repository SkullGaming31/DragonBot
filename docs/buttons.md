# Button handlers

This project supports modular button handlers. Button handlers live in `src/Buttons/` and are automatically loaded by the client at startup. Use this guide to add new handlers and to test them locally.

## Handler shape

Each file should default-export an object matching the `ButtonType` typing (see `src/Typings/Button.ts`). Minimal example:

```ts
import { ButtonType } from '../Typings/Button';
import { ButtonStyle } from 'discord.js';

const handler: ButtonType = {
  customId: 'my_button_id',
  defaultLabel: 'Click me',            // optional: used by testbutton command
  defaultStyle: ButtonStyle.Primary,   // optional
  run: async ({ client, interaction }) => {
    // your logic here; use interaction.deferUpdate(), interaction.reply(), etc.
  }
};

export default handler;
```

Notes:
- `customId` must exactly match the `customId` used when the button is created.
- `run` receives an object `{ client, interaction }` where `interaction` is a `ButtonInteraction` instance.

## Creating buttons from the bot (test command)

There's a developer command `/testbutton` that you can use to create a test message with a button:

- `customid` (required) — the `customId` string for the button. If a handler with that `customId` is registered, the command will use the handler's `defaultLabel`/`defaultStyle` when you omit `label` or `style`.
- `label` (optional) — the button label.
- `style` (optional) — one of: Primary, Secondary, Success, Danger.

Example: `/testbutton customid:accept` will create a button whose `customId` is `accept`. If you added `src/Buttons/accept.ts` with that `customId`, clicking the button will call the handler's `run` method.

## Recommended practices

- Keep handlers small and focused. For complex flows, delegate work to other modules.
- Use `interaction.deferUpdate()` if you will edit the message and avoid immediate replies.
- Wrap external calls (DB, network) in try/catch and reply with ephemeral error messages on failure.

## Testing locally

Manual end-to-end:

1. Ensure your `.env` has a valid `DEV_DISCORD_BOT_TOKEN` and `Enviroment=dev` (or use the `prod` token for production).
2. Start the bot in dev mode:
```powershell
npm run dev
```
3. In your dev server, run the slash command `/testbutton customid:your_id` (optionally add label/style).
4. Click the button in Discord and observe the bot's behavior/logs.

Unit test (fast):

You can write Vitest tests that import a handler and call `handler.run({ client: fakeClient, interaction: mockInteraction })`, where `mockInteraction` stubs the methods used by the handler (`deferUpdate`, `editReply`, `reply`, etc.). See `test/events/*` for patterns used in this repo.

## Troubleshooting

- If a button click does nothing, verify:
  - The bot is running and connected.
  - `src/Buttons/<file>.ts` exports a default object with `customId` matching the button.
  - The bot has appropriate channel permissions (Send Messages, Add Reactions as needed).
- If you get `Unknown Interaction` errors, ensure you're using `deferUpdate`/`reply` correctly and not calling both in a conflicting way.

---

If you want, I can:
- Add example unit tests for `accept` and `suggesAccept` handlers.
- Move other inline button logic into their own handler files.
