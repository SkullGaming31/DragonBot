# DragonBot

<div id="top"></div>
<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

<!--
https://discord.com/api/oauth2/authorize?client_id=899692688637558857&permissions=1505319185654&redirect_uri=https%3A%2F%2Fdiscord.events.stdlib.com%2Fdiscord%2Fauth%2F&response_type=code&scope=identify%20connections%20messages.read%20bot%20applications.commands%20guilds
Discord Bot Scopes
identify
bot
applications.commands
connections
messages.read
guilds
-->

<!-- https://discord.com/oauth2/authorize?client_id=930882181595807774&permissions=21226735791350&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect&scope=identify+guilds+applications.commands+bot+webhook.incoming+connections -->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url] [![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/skullgaming31/DragonBot">
    <img src="./assets/logo.png" alt="Project Logo" width="100" height="100">
  </a>

<h3 align="center">DragonBot</h3>

<p align="center">
    DragonBot<br>
    ·
    <a href="https://github.com/skullgaming31/DragonBot/issues">Report Bugs</a>
    ·
    <a href="https://github.com/skullgaming31/DragonBot/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <!-- <li><a href="#usage">Usage</a></li> -->
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

<!-- [![Product Name Screen Shot][product-screenshot]](https://example.com) -->

This is the Discord Bot for my personal Discord Server<br />
[SkullGamingHQ Hub](https://discord.com/invite/6TGV75sDjW)

<p align="right">(<a href="#top">back to top</a>)</p>

### Built With

- [Discord.js v14](https://discord.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Mongoose](https://mongodb.com)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

check out <a href="#setup"></a> to learn to get a copy of the project

### Prerequisites

Requirements

- Discord<br /> [Discord.js v14.5.1](https://discord.js.org/)

- Typescript<br /> [Typescript](https://www.typescriptlang.org/)

- node<br /> [Node](https://nodejs.org)

- Code Editor[Optional Choices] <b>NOTE: i do not know how to setup the project
  with Atom so everything is based on VS Code</b><br />
  [VS Code](https://code.visualstudio.com)<br /> [Atom](https://atom.io)<br />

### Installation<a id="setup">

1. Create a Discord Developer Application
   [Discord Developer Application](https://discord.com/developers/applications)
2. Clone the repo
   ```sh
   git clone https://github.com/skullgaming31/dragonbot.git
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Fill out the .env with all nessasary Information, check .env.example for
   whats needed
5. build:

```sh
npm run build
```

## Developer setup (quick)

Clone and install dependencies:

```pwsh
git clone https://github.com/SkullGaming31/DragonBot.git
cd DragonBot
npm ci
```

Run the bot in development mode (hot reload via ts-node):

```pwsh
npm run dev
```

Build for production output (compiled JS in `dist/`):

```pwsh
npm run build
npm start
```

### Environment variables

The repo uses an intentionally misspelled environment variable key: `Enviroment` (values: `dev | prod | debug`). Do not rename it without updating `src/Structures/Client.ts` and other consumers. Check `.env.example` for a full list, but key vars include:

- `Enviroment` — `dev` | `prod` | `debug`
- `DEV_DISCORD_BOT_TOKEN` — token for dev bot login
- `DISCORD_BOT_TOKEN` — token for production bot login
- `DEV_DISCORD_GUILD_ID` — guild id used when registering commands in dev

### Tests & CI

Run the test suite locally with Vitest:

```pwsh
npm test
```

Notes:
- Many tests use `mongodb-memory-server`. To exercise MongoDB transactions the tests start a replica set (`MongoMemoryReplSet`). Keep replica-set tests short (use `count:1`) to save time.
- On CI, runners may lack OpenSSL 1.1 required by MongoDB binaries. The repo's workflow runs the Tests job in the `node:18-bullseye` container so `libcrypto.so.1.1` is available. See `.github/workflows/ci.yml`.

### Coding conventions & tips

- Prefer `unknown` over `any`. Use runtime narrowing (see `src/Utilities/functions.ts`) and add minimal runtime guards if you accept external data.
- Use `safeInteractionReply` (`src/Utilities/functions.ts`) for replies to interactions to avoid duplicate-reply errors and to provide robust fallbacks.
- Commands live in `src/Commands/<Category>/` and export a `CommandType` (`src/Typings/Command.ts`). The `run` function receives `{ client, interaction, args }` where `interaction` is `ExtendedInteraction`.
- Events live in `src/Events/*` and implement the `Event` contract (`src/Structures/Event.ts`). `ExtendedClient.registerModules()` auto-loads commands and events.

If you change command registration behaviour or the `Enviroment` variable, coordinate with the repository owner — these are sensitive to production/dev command registration.


build the docker image to use for docker desktop
```bash
docker build -t dragonbot .
```

create the volume
```sh
docker volume create dragonbot-data
```

run the bot in docker
```bash
docker run -d --name dragonbot-container --mount source=dragonbot-data,target=/app/data dragonbot:latest
```


--all your javascript files will be in a folder called dist host that on your
discord bot host.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
<!-- ## Usage -->

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

- [x] link detect and delete(if not in correct channel)
- [x] Ticket System
- [x] Warning System

See the [open issues](https://github.com/skullgaming31/dragonbot/issues) for a
full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to
learn, inspire, and create. Any contributions you make are **greatly
appreciated**.

If you have a suggestion that would make this better, please fork the repo and
create a pull request. You can also simply open an issue with the tag
"enhancement". Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. checkout LICENSE.md

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Corey - [@skullgaming31](https://twitter.com/skullgaminghq) -
skullgamingg31@gmail.com

Project Link:
[SkullGamingHQ Hub in Typescript](https://github.com/skullgaming31/dragonbot)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- []()
- []()
- []()

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/SkullGaming31/DragonBot.svg?style=for-the-badge
[contributors-url]: https://github.com/SkullGaming31/DragonBot/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/SkullGaming31/DragonBot.svg?style=for-the-badge
[forks-url]: https://github.com/SkullGaming31/DragonBot/network/members
[stars-shield]: https://img.shields.io/github/stars/SkullGaming31/DragonBot.svg?style=for-the-badge
[stars-url]: https://github.com/SkullGaming31/DragonBot/stargazers
[issues-shield]: https://img.shields.io/github/issues/SkullGaming31/DragonBot.svg?style=for-the-badge
[issues-url]: https://github.com/SkullGaming31/DragonBot/issues
[license-shield]: https://img.shields.io/github/license/SkullGaming31/DragonBot.svg?style=for-the-badge
[license-url]: https://github.com/SkullGaming31/DragonBot/blob/main/LICENSE
[product-screenshot]: images/screenshot.png
