// const { CommandInteraction, MessageEmbed, WebhookClient } = require('discord.js');
// const config = require('../../Structures/config');

// module.exports = {
// 	name: 'warn',
// 	description: 'Send a warning to a member of the guild',
// 	permission: 'MANAGE_MESSAGES',
// 	options: [
// 		{
// 			name: 'target',
// 			description: 'the user you want to timeout',
// 			type: 'USER',
// 			required: true
// 		},
// 		{
// 			name: 'reason',
// 			description: 'reason for sending a warning to the user',
// 			type: 'STRING',
// 			required: true
// 		}
// 	],
	// /**
  //  * @param {CommandInteraction} interaction 
  //  */
// 	async execute(interaction) {
// 		const { options, user } = interaction;

// 		const Target = options.getMember('target');
// 		let reason = options.getString('reason');

// 		try {
// 			await interaction.deferReply();

// 			const logsEmbed = new MessageEmbed()
// 				.setTitle(`${Target.displayName}`)
// 				.addFields([
// 					{
// 						name: 'Command Issuer: ',
// 						value: `\`${user.username}\``,
// 						inline: true
// 					},
// 					{
// 						name: 'Target',
// 						value: `\`${Target.displayName}\``,
// 						inline: true
// 					},
// 					{
// 						name: 'Reason: ',
// 						value: `\`${reason}\``,
// 						inline: true
// 					}
// 				])
// 				.setColor('RED');

// 			const timedoutEmbed = new MessageEmbed()
// 				.setAuthor({ name: `${Target.displayName}` })
// 				.addFields([
// 					{
// 						name: 'Warning For: ',
// 						value: `\`${reason}\``,
// 						inline: true
// 					}
// 				])
// 				.setColor('RED');
// 			interaction.editReply({ content: `${Target}`, embeds: [timedoutEmbed] });
// 			new WebhookClient({ url: 'https://discord.com/api/webhooks/944405199102025790/BUULFqS4comn99ZZwkU71DLyHdPtT3wmIST_47HjqTLd8mJqJcL5Hc9OoO4VNq12acnS'}
// 			).send({ embeds: [logsEmbed]}).catch((err) => {
// 				console.error(err);
// 			});
// 		} catch (error) {
// 			console.error(error);
// 		}
// 	}
// };

const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const db = require("../../Structures/Schemas/WarningDB");

module.exports = {
    name: "warnings",
    description: "Shows user warnings",
    permission: "KICK_MEMBERS",
    options: [
        {
            name: "add",
            description: "Adds a warning.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: "USER",
                    required: true
                },
                {
                    name: "reason",
                    description: "Provide a reason",
                    type: "STRING",
                    required: true
                },
                {
                    name: "evidence",
                    description: "Provide an evidence",
                    type: "STRING",
                    required: false
                },
            ]
        },
        {
            name: "check",
            description: "Checks the warnings.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: "USER",
                    required: true
                },
            ]
        },
        {
            name: "remove",
            description: "Removes a warning.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: "USER",
                    required: true
                },
                {
                    name: "warnid",
                    description: "Provide the warning ID",
                    type: "NUMBER",
                    required: true
                },
            ]
        },
        {
            name: "clear",
            description: "Clears all warnings.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "target",
                    description: "Select a target",
                    type: "USER",
                    required: true
                },
            ]
        },
    ],
    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction, client) {
        const { options, guildId, user, guild } = interaction;
        const Sub = options.getSubcommand(["add", "check", "remove", "clear"]);
        const Target = options.getMember("target");
        const Reason = options.getString("reason");
        const Evidence = options.getString("evidence") || "No evidence provided.";
        const WarnID = options.getNumber("warnid") - 1;
        const WarnDate = new Date(interaction.createdTimestamp).toLocaleDateString();

        if(Sub === "add"){
            db.findOne({ GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag}, async (err, data) => {
                if(err) throw err;
                if(!data){
                    data = new db({
                        GuildID: guildId, 
                        UserID: Target.id, 
                        UserTag: Target.user.tag,
                        Content: [
                            {
                                ExecuterID: user.id,
                                ExecuterTag: user.tag,
                                Reason: Reason,
                                Evidence: Evidence,
                                Date: WarnDate
                            }
                        ],
                    })
                } else {
                    const obj = {
                        ExecuterID: user.id,
                        ExecuterTag: user.tag,
                        Reason: Reason,
                        Evidence: Evidence,
                        Date: WarnDate
                    }
                    data.Content.push(obj)
                }
                data.save()
            });

            interaction.reply({embeds: [new MessageEmbed()
            .setTitle("Warning added")
            .setColor("BLURPLE")
            .setDescription(`Warning Added: ${Target.user.tag} \n**Reason**: ${Reason}\n**Evidence**: ${Evidence}`)
            .setFooter({ text: `ID: ${Target.id}` })
            
        ]});
				try {
					await Target.send({embeds: [new MessageEmbed()
						.setColor("#00defa")
						.setTitle("⚠️ WARNING")
						.setAuthor({ name: `${Target.user.tag}`, iconURL: `${Target.user.avatarURL({dynamic: true, size: 512})}` })
						.setDescription(`You have been warned for: \`\`\`${Reason}\`\`\` \nServer Name: **${guild.name}**`)
						.setFooter({ text: `ID: ${Target.user.id}` })
					]});	
				} catch (error) {
					console.log('User has DMs turned off\n', error);
				}


        } else if(Sub === "check"){
        db.findOne({GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag}, async (err, data) => {
            if(err) throw err;
            if(data) {
                interaction.reply({embeds: [new MessageEmbed()
                .setTitle("Warnings Check")
                .setColor("BLURPLE")
                .setDescription(`${data.Content.map(
                    (w, i) => `**ID**: ${i + 1}\n**By**: ${w.ExecuterTag}\n**Date**: ${w.Date}\n**Reason**: ${w.Reason}\n**Evidence**: ${w.Evidence}\n\n`
                ).join(" ")}`)]});
            } else {
                interaction.reply({embeds: [new MessageEmbed()
                .setTitle("Warnings Check")
                .setColor("BLURPLE")
                .setDescription(`${Target.user.tag} has no warnings.`)
                .setFooter({ text: `ID: ${Target.id}` })
            ]});
                
            }
        });

        } else if (Sub === "remove"){

        db.findOne({GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag}, async (err, data) => {
            if(err) throw err;
            if(data) {
                data.Content.splice(WarnID, 1)
                interaction.reply({embeds: [new MessageEmbed()
                    .setTitle("Removed")
                    .setColor("BLURPLE")
                    .setDescription(`${Target.user.tag}'s warning id: ${WarnID + 1} has been removed.`)] });
                    data.save()
            } else {
                interaction.reply({embeds: [new MessageEmbed()
                    .setTitle("WARNING")
                    .setColor("BLURPLE")
                    .setDescription(`${Target.user.tag} has no warnings.`)
                    .setFooter({ text: `ID: ${Target.id} `})
                ]});
            }
        });

        } else if (Sub === "clear"){

        db.findOne({GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag}, async (err, data) => {
            if(err) throw err;
            if(data) {
                await db.findOneAndDelete({ GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag })
                interaction.reply({embeds: [new MessageEmbed()
                    .setTitle("WARNING")
                    .setColor("BLURPLE")
                    .setDescription(`${Target.user.tag}'s warnings have been cleared`)
                    .setFooter({ text: `ID: ${Target.id}` })
                ]});
            } else {
                interaction.reply({embeds: [new MessageEmbed()
                    .setTitle("WARNING")
                    .setColor("BLURPLE")
                    .setDescription(`${Target.user.tag} has no warnings.`)
                    .setFooter({ text: `ID: ${Target.id}` })
                ]});
            }
        })
        }
    }
}