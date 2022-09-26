import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
	type APIEmbed,
	type APIApplicationCommandInteractionDataSubcommandOption,
	type APIInteractionResponseCallbackData,
	type APIMessageComponentInteraction,
	ComponentType,
} from 'discord-api-types/v10';
import { Colors } from '../../../constants/bloons';
import type { Command, InteractionHandler } from '../../../http-interactions';
import { States, type TwoTCEntry } from '../../../types';
import { deferUpdate, getOption, getPageButtons } from '../../../util';

const getPageHandler = (movePage: number): InteractionHandler<APIMessageComponentInteraction> => {
	return async ({ user, message: { interaction } }, args: string[]) => {
		if (user!.id !== interaction!.user.id) return deferUpdate();

		const argsWithNewPage = args as [string, string, string, string, string, number];
		argsWithNewPage[5] = +args[5] + movePage;

		const data = await handleFilteredSearch(...argsWithNewPage);
		return {
			type: InteractionResponseType.UpdateMessage,
			data,
		};
	};
};

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: '2tc',
	description: 'Browse completed 2TC Index entries',
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'search',
			description: 'Search for an entry matching specfic criteria',
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'tower-1',
					description: 'The first tower in the combo',
				},
				{
					type: ApplicationCommandOptionType.String,
					name: 'tower-2',
					description: 'The second tower in the combo',
				},
				{
					type: ApplicationCommandOptionType.String,
					name: 'map',
					description: 'The map the entry was on',
				},
				{
					type: ApplicationCommandOptionType.String,
					name: 'player',
					description: 'The player who completed the entry',
				},
				{
					type: ApplicationCommandOptionType.String,
					name: 'version',
					description: 'The version of the game the entry was completed in',
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'view',
			description: 'View a specific 2TC entry',
			options: [
				{
					type: ApplicationCommandOptionType.Integer,
					name: 'number',
					description: 'The number of the entry to view',
					min_value: 1,
					required: true,
				},
			],
		},
	],

	exec: async ({ data: { options } }) => {
		const isSpecific = getOption<APIApplicationCommandInteractionDataSubcommandOption[]>(
			options,
			'view'
		);

		const data = await (isSpecific
			? handleSpecificEntry(getOption<number, true>(isSpecific, 'number'))
			: handleFilteredSearch(
					getOption<string>(options, 'tower-1', true) ?? '',
					getOption<string>(options, 'tower-2', true) ?? '',
					getOption<string>(options, 'map', true) ?? '',
					getOption<string>(options, 'player', true) ?? '',
					getOption<string>(options, 'version', true) ?? ''
			  )
		).catch(
			({ message }: Error): APIInteractionResponseCallbackData => ({
				content: message,
				flags: MessageFlags.Ephemeral,
			})
		);

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data,
		};
	},

	components: {
		1: getPageHandler(-5),
		2: getPageHandler(-1),
		3: getPageHandler(1),
		4: getPageHandler(5),
	},
};

const handleSpecificEntry = async (number: number): Promise<APIInteractionResponseCallbackData> => {
	const entries = await fetch('https://btd-Index-api.hop.sh/index/2tc').then((res) =>
		res.ok ? res.json<TwoTCEntry[]>() : null
	);
	if (!entries) throw new Error('Failed to fetch 2TC Index entries.');

	const entry = entries[number - 1];
	if (!entry) throw new Error(`No 2TC Index entry found for number ${number}.`);

	const embed: APIEmbed = {
		color: Colors.CYBER,
		title: `2TC Index Entry #${number}`,
		fields: [
			{
				name: 'Tower 1',
				value: entry.tower_1.name,
				inline: true,
			},
			{
				name: 'Tower 2',
				value: entry.tower_2.name,
				inline: true,
			},
			{
				name: 'Map',
				value: entry.map,
				inline: true,
			},
			{
				name: 'Version',
				value: entry.version,
				inline: true,
			},
			{
				name: 'Date',
				value: `<t:${Math.ceil(entry.date / 1000)}:d>`,
				inline: true,
			},
			{
				name: 'Player',
				value: entry.player,
				inline: true,
			},
			{
				name: 'Link',
				value: entry.link.text ? `[${entry.link.text}](${entry.link.url})` : entry.link.url,
				inline: true,
			},
			{
				name: 'Current state',
				value:
					entry.state === States.Unknown ? 'Unknown' : entry.state === States.Alive ? '✅' : '❌',
				inline: true,
			},
			{
				name: 'Alternate maps',
				value: entry.notes.map((line) => line.split(':')[0]).join(', ') || 'None',
			},
		],
	};

	return { embeds: [embed] };
};

const handleFilteredSearch = async (
	tower1: string,
	tower2: string,
	map: string,
	player: string,
	version: string,
	page = 1
): Promise<APIInteractionResponseCallbackData> => {
	const query = new URLSearchParams();
	let filterStr = '';

	if (tower1) {
		query.append('tower_1', tower1);
		filterStr += `Tower 1: ${tower1}\n`;
	}
	if (tower2) {
		query.append('tower_2', tower2);
		filterStr += `Tower 2: ${tower2}\n`;
	}
	if (map) {
		query.append('map', map);
		filterStr += `Map: ${map}\n`;
	}
	if (player) {
		query.append('player', player);
		filterStr += `Player: ${player}\n`;
	}
	if (version) {
		query.append('version', version);
		filterStr += `Version: ${version}`;
	}

	const entries = await fetch('https://btd-Index-api.hop.sh/index/2tc?' + query.toString()).then(
		(res) => (res.ok ? res.json<TwoTCEntry[]>() : null)
	);
	if (!entries?.length) throw new Error('Failed to fetch 2TC Index entries.');

	const pages = Math.ceil(entries.length / 10);
	if (page > pages) page = pages;
	if (page < 1) page = 1;

	const endIndex = page * 10;
	const pageOfEntries = entries.slice(endIndex - 10, endIndex);
	const pageButtons = getPageButtons();

	pageButtons[0].disabled = pageButtons[1].disabled = page === 1;
	pageButtons[2].disabled = pageButtons[3].disabled = page === pages;

	for (const button of pageButtons)
		button.custom_id += `:${tower1}:${tower2}:${map}:${player}:${version}:${page}`;

	const embed: APIEmbed = {
		color: Colors.CYBER,
		title: '2TC Index Entries',
		description: filterStr,
		fields: [
			{
				name: 'Number of entries',
				value: `${endIndex - 9}-${endIndex - 10 + pageOfEntries.length} of **${entries.length}**`,
			},
			{
				name: 'Tower 1',
				value: pageOfEntries
					.map(({ tower_1: { name, upgrade } }) => `${name} (${upgrade})`)
					.join('\n'),
				inline: true,
			},
			{
				name: 'Tower 2',
				value: pageOfEntries
					.map(({ tower_2: { name, upgrade } }) => `${name} (${upgrade})`)
					.join('\n'),
				inline: true,
			},
			{
				name: 'Link',
				value: pageOfEntries
					.map(({ link, player }) =>
						link.text ? `[${link.text}](${link.url} "${player}")` : link.url
					)
					.join('\n'),
				inline: true,
			},
		],
	};

	return {
		embeds: [embed],
		components: [{ type: ComponentType.ActionRow, components: pageButtons }],
	};
};