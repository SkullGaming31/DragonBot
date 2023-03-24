import { ChannelType, Colors, EmbedBuilder, Guild } from 'discord.js';
import { Event } from '../../Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event('guildCreate', async (guild: Guild) => {
	console.log(guild);
	const { channels, name } = guild;

	// const data = await DB.findOne({ Guild: guild.id }).catch((err: any) => { console.error(err); });

	// if (!data) return;
	// if (data.enableLogs === false) return;
	// if (!data) return;

	const logsChannel = '1022963329670586478';
	const Channel = channels.cache.get(logsChannel);
	if (!Channel) return;

	const gOwner = await guild.fetchOwner();
	const welcome = await guild.fetchWelcomeScreen();
	const audit = await guild.fetchAuditLogs({ limit: 50 });
	const integrations = await guild.fetchIntegrations();
	const bans = await guild.bans.fetch({ cache: true, limit: 20 });

	/**
   * Need Help Converting this to text instead of a number!
   */
	// switch (guild.defaultMessageNotifications) {
	//   case '1':
	//     guild.defaultMessageNotifications = 'Only @Mentions';
	//     break;
	//   default:
	//     guild.defaultMessageNotifications = 'All Messages';
	//     break;
	// }

	const embed = new EmbedBuilder()
		.setTitle(guild.name)
		.setAuthor({ name: gOwner.displayName, iconURL: gOwner.displayAvatarURL({ size: 512}) })
		.setImage(guild.bannerURL({ size: 512 }))
		.setColor('Green')
		.setDescription('The bot has joined a guild!')
		.addFields(
			{ 
				name: 'Guild Description',
				value: `${guild.description || 'No Description set'}`,
				inline: false 
			},
			{ 
				name: 'Guild Created',
				value: `<t:${guild.createdTimestamp / 1000}:R>`,
				inline: false
			},
			{
				name: 'MemberCount',
				value: `${guild.memberCount}`,
				inline: false
			},
			{
				name: 'NSFW',
				value: `${guild.explicitContentFilter}`,
				inline: false
			},
			{
				name: 'Ban Count',
				value: `${bans.size || '0'}`,
				inline: false
			},
			{
				name: 'defaultMessageNotifications',
				value: `${guild.defaultMessageNotifications}`,
				inline: false
			},
			{
				name: 'Verification Level',
				value: `${guild.verificationLevel}`,
				inline: false
			}
		).setTimestamp();

	if (Channel.type === ChannelType.GuildText) return Channel.send({ embeds: [embed] });
	/*
    <ref *2> Guild {
  id: '1068285177891131422',
  name: "CanadienDragon's server",
  icon: '980576471e04c27373307d0ae147b656',
  features: [ 'APPLICATION_COMMAND_PERMISSIONS_V2', 'NEWS', 'COMMUNITY' ],
  commands: <ref *1> GuildApplicationCommandManager {
    permissions: ApplicationCommandPermissionsManager {
      manager: [Circular *1],
      guild: [Circular *2],
      guildId: '1068285177891131422',
      commandId: null
    },
    guild: [Circular *2]
  },
  members: GuildMemberManager { guild: [Circular *2] },
  channels: GuildChannelManager { guild: [Circular *2] },
  bans: GuildBanManager { guild: [Circular *2] },
  roles: RoleManager { guild: [Circular *2] },
  presences: PresenceManager {},
  voiceStates: VoiceStateManager { guild: [Circular *2] },
  stageInstances: StageInstanceManager { guild: [Circular *2] },
  invites: GuildInviteManager { guild: [Circular *2] },
  scheduledEvents: GuildScheduledEventManager { guild: [Circular *2] },
  autoModerationRules: AutoModerationRuleManager { guild: [Circular *2] },
  splash: null,
  banner: null,
  description: null,
  verificationLevel: 1,
  vanityURLCode: null,
  nsfwLevel: 0,
  premiumSubscriptionCount: 0,
  available: true,
  discoverySplash: null,
  memberCount: 10,
  large: false,
  premiumProgressBarEnabled: false,
  applicationId: null,
  afkTimeout: 900,
  afkChannelId: '1068285179761786932',
  systemChannelId: '1068285179501744231',
  premiumTier: 0,
  widgetEnabled: null,
  widgetChannelId: null,
  explicitContentFilter: 2,
  mfaLevel: 1,
  joinedTimestamp: 1677717237577,
  defaultMessageNotifications: 1,
  systemChannelFlags: SystemChannelFlagsBitField { bitfield: 13 },
  maximumMembers: 500000,
  maximumPresences: null,
  maxVideoChannelUsers: 25,
  approximateMemberCount: null,
  approximatePresenceCount: null,
  vanityURLUses: null,
  rulesChannelId: '1068285178738376736',
  publicUpdatesChannelId: '1068285179501744231',
  preferredLocale: 'en-US',
  ownerId: '353674019943219204',
  emojis: GuildEmojiManager { guild: [Circular *2] },
  stickers: GuildStickerManager { guild: [Circular *2] },
  shardId: 0
}
    */
});