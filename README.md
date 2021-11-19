# overlayExpertDiscordBot
  **_Check out the .env.example to find out what needs to be added to the .env file_**

## DONE:
* [x] fix deploying commands
* [x] add link detection/deletion if not twitch/instagram/tiktok/twitter etc and not in NOW-LIVE channel.
   * [x] send {deleted message} and {message author name} to a logs channel!
* [x] detect all discord links/discord nitro scam links and delete

## Bugs


## Features
* [x] link detect and delete(if not in correct channel)
* [x] discord nitro .gift scam links automatically removed
* [x] all discord invite links deleted when posted
* [ ] Ticket System
* [ ] Warning System
* [ ] Github Integration

run:<br>
npm run start 'starts the bot'<br>
npm run dev 'starts the bot but will restart the bot any time any saving is done or a file is added/removed'
npm run deploy 'to register commands' to the guild<br>