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
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const { options, guildId, user, guild } = interaction;
        const Sub = options.getSubcommand(["add", "check", "remove", "clear"]);
        const Target = options.getMember("target");
        const Reason = options.getString("reason");
        const Evidence = options.getString("evidence") || "No evidence provided.";
        const WarnID = options.getNumber("warnid") - 1;
        const WarnDate = new Date(interaction.createdTimestamp).toLocaleDateString();

        if (Sub === "add") {
            db.findOne({ GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag }, async (err, data) => {
                if (err) throw err;
                if (!data) {
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

            interaction.reply({
                embeds: [new MessageEmbed()
                    .setTitle("Warning added")
                    .setColor("BLURPLE")
                    .setDescription(`Warning Added: ${Target.user.tag} \n**Reason**: ${Reason}\n**Evidence**: ${Evidence}`)
                    .setFooter({ text: `ID: ${Target.id}` })

                ]
            });
            try {
                await Target.send({
                    embeds: [new MessageEmbed()
                        .setColor("#00defa")
                        .setTitle("⚠️ WARNING")
                        .setAuthor({ name: `${Target.user.tag}`, iconURL: `${Target.user.avatarURL({ dynamic: true, size: 512 })}` })
                        .setDescription(`You have been warned for: \`\`\`${Reason}\`\`\` \nServer Name: **${guild.name}**`)
                        .setFooter({ text: `ID: ${Target.user.id}` })
                    ]
                });
            } catch (error) {
                console.log('User has DMs turned off\n', error);
            }


        } else if (Sub === "check") {
            db.findOne({ GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag }, async (err, data) => {
                if (err) throw err;
                if (data) {
                    interaction.reply({
                        embeds: [new MessageEmbed()
                            .setTitle("Warnings Check")
                            .setColor("BLURPLE")
                            .setDescription(`${data.Content.map(
                                (w, i) => `**ID**: ${i + 1}\n**By**: ${w.ExecuterTag}\n**Date**: ${w.Date}\n**Reason**: ${w.Reason}\n**Evidence**: ${w.Evidence}\n\n`
                            ).join(" ")}`)]
                    });
                } else {
                    interaction.reply({
                        embeds: [new MessageEmbed()
                            .setTitle("Warnings Check")
                            .setColor("BLURPLE")
                            .setDescription(`${Target.user.tag} has no warnings.`)
                            .setFooter({ text: `ID: ${Target.id}` })
                        ]
                    });

                }
            });

        } else if (Sub === "remove") {

            db.findOne({ GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag }, async (err, data) => {
                if (err) throw err;
                if (data) {
                    data.Content.splice(WarnID, 1)
                    interaction.reply({
                        embeds: [new MessageEmbed()
                            .setTitle("Removed")
                            .setColor("BLURPLE")
                            .setDescription(`${Target.user.tag}'s warning id: ${WarnID + 1} has been removed.`)]
                    });
                    data.save()
                } else {
                    interaction.reply({
                        embeds: [new MessageEmbed()
                            .setTitle("WARNING")
                            .setColor("BLURPLE")
                            .setDescription(`${Target.user.tag} has no warnings.`)
                            .setFooter({ text: `ID: ${Target.id} ` })
                        ]
                    });
                }
            });

        } else if (Sub === "clear") {

            db.findOne({ GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag }, async (err, data) => {
                if (err) throw err;
                if (data) {
                    await db.findOneAndDelete({ GuildID: guildId, UserID: Target.id, UserTag: Target.user.tag })
                    interaction.reply({
                        embeds: [new MessageEmbed()
                            .setTitle("WARNING")
                            .setColor("BLURPLE")
                            .setDescription(`${Target.user.tag}'s warnings have been cleared`)
                            .setFooter({ text: `ID: ${Target.id}` })
                        ]
                    });
                } else {
                    interaction.reply({
                        embeds: [new MessageEmbed()
                            .setTitle("WARNING")
                            .setColor("BLURPLE")
                            .setDescription(`${Target.user.tag} has no warnings.`)
                            .setFooter({ text: `ID: ${Target.id}` })
                        ]
                    });
                }
            })
        }
    }
}