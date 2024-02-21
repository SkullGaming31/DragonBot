import axios, { AxiosResponse } from 'axios';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

interface Github {
	url: string;
	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	id: number;
	node_id: string;
	number: number;
	title: string;
	user: {
		login: string;
		id: number;
		node_id: string;
		avatar_url: string;
		gravatar_id: string;
		url: string;
		html_url: string;
		followers_url: string;
		following_url: string;
		gists_url: string;
		starred_url: string;
		subscriptions_url: string;
		organizations_url: string;
		repos_url: string;
		events_url: string;
		received_events_url: string;
		type: string;
		site_admin: boolean;
	};
	labels: string[];
	state: string;
	locked: boolean;
	assignee: string | null;
	assignees: string[];
	milestone: string | number | null;
	comments: number;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	author_association: string;
	active_lock_reason: string | null;
	body: string;
	// closed_by: null;
	reactions: {
		url: string;
		total_count: number;
		'+1': number;
		'-1': number;
		laugh: number;
		hooray: number;
		confused: number;
		heart: number;
		rocket: number;
		eyes: number;
	};
	timeline_url: string;
	// performed_via_github_app: null;
	state_reason: string[] | null;
}

enum EmbedColors {
	Green = 'Green',
	Red = 'Red',
}

export default new Command({
	name: 'github',
	description: 'Create a GitHub Issue',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'title',
			description: 'Title of the GitHub issue',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'body',
			description: 'Body of the GitHub issue',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'labels',
			description: 'Labels to assign to the GitHub issue',
			type: ApplicationCommandOptionType.String,
			required: false,
			choices: [
				{ name: 'bug', value: 'bug' },
				{ name: 'enhancement', value: 'enhancement' },
				{ name: 'help wanted', value: 'help-wanted' },
				{ name: 'invalid', value: 'invalid' }
			]
		}
	],
	run: async ({ interaction }) => {
		const { options } = interaction;

		const Title = options.getString('title');
		const Body = options.getString('body');
		const Labels = options.getString('labels') ? [options.getString('labels')] : [];

		// Modify the following variables according to your GitHub repository
		const owner = 'SkullGaming31';
		const repo = 'DragonBot';
		const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

		if (!token) {
			console.error('GitHub token not found');
			return;
		}

		const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
		const headers = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/vnd.github+json'
		};

		const data = {
			title: Title,
			body: Body,
			labels: Labels
		};

		try {
			const response: AxiosResponse<Github> = await axios.post(apiUrl, data, { headers });

			if (response.status === 201) {
				console.log('Github Response: ', response.data);
				const successfulEmbed = new EmbedBuilder()
					.setTitle(`${response.data.title}`)
					.setColor(EmbedColors.Green)
					.setAuthor({ name: `${response.data.user.login}`, iconURL: `${response.data.user.avatar_url}` })
					.setURL(`https://github.com/${owner}/${repo}/issues/${response.data.number}`)
					.setTimestamp();
				await interaction.reply({ embeds: [successfulEmbed], ephemeral: true });
			} else {
				await interaction.reply({ content: 'Failed to create a GitHub issue.', ephemeral: true });
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error('Error creating GitHub issue:', error);
			const errorEmbed = new EmbedBuilder()
				.setTitle('ERROR')
				.setDescription(`${error.response?.data?.message}`)
				.setColor('Red')
				.setTimestamp();
			await interaction.reply({ content: 'An error occurred while creating the GitHub issue.', embeds: [errorEmbed], ephemeral: true });
		}
	}
});