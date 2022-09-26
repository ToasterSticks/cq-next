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
import { States, type LCCEntry } from '../../../types';
import { deferUpdate, getOption, getPageButtons } from '../../../util';

const getPageHandler = (movePage: number): InteractionHandler<APIMessageComponentInteraction> => {
	return async ({ user, message: { interaction } }, args: string[]) => {
		if (user!.id !== interaction!.user.id) return deferUpdate();

		const argsWithNewPage = args as [string, string, number];
		argsWithNewPage[2] = +args[2] + movePage;

		const data = await handleFilteredSearch(...argsWithNewPage);
		return {
			type: InteractionResponseType.UpdateMessage,
			data,
		};
	};
};

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'lcc',
	description: 'Browse completed LCC Index entries',
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'search',
			description: 'Search for an entry matching specfic criteria',
			options: [
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
			description: 'View a specific LCC entry',
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'map',
					description: 'The map the entry is on',
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
			? handleSpecificEntry(getOption<string, true>(isSpecific, 'map'))
			: handleFilteredSearch(
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

const handleSpecificEntry = async (map: string): Promise<APIInteractionResponseCallbackData> => {
	const query = new URLSearchParams({ map });
	const entries = await fetch('https://btd-Index-api.hop.sh/index/lcc?' + query.toString()).then(
		(res) => (res.ok ? res.json<LCCEntry[]>() : null)
	);

	const entry = entries?.[0];
	if (!entry) throw new Error(`No LCC Index entry found for on map ${map}.`);

	const embed: APIEmbed = {
		color: Colors.CYBER,
		title: `LCC Index Entry for ${entry.map}`,
		fields: [
			{
				name: 'Map',
				value: entry.map,
				inline: true,
			},
			{
				name: 'Cost',
				value: entry.cost,
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
			},
		],
	};

	return { embeds: [embed] };
};

const handleFilteredSearch = async (
	player: string,
	version: string,
	page = 1
): Promise<APIInteractionResponseCallbackData> => {
	const query = new URLSearchParams();
	let filterStr = '';

	if (player) {
		query.append('player', player);
		filterStr += `Player: ${player}\n`;
	}
	if (version) {
		query.append('version', version);
		filterStr += `Version: ${version}`;
	}

	const entries = await fetch('https://btd-Index-api.hop.sh/index/lcc?' + query.toString()).then(
		(res) => (res.ok ? res.json<LCCEntry[]>() : null)
	);
	if (!entries?.length) throw new Error('Failed to fetch LCC Index entries.');

	const pages = Math.ceil(entries.length / 10);
	if (page > pages) page = pages;
	if (page < 1) page = 1;

	const endIndex = page * 10;
	const pageOfEntries = entries.slice(endIndex - 10, endIndex);
	const pageButtons = getPageButtons();

	pageButtons[0].disabled = pageButtons[1].disabled = page === 1;
	pageButtons[2].disabled = pageButtons[3].disabled = page === pages;

	for (const button of pageButtons) button.custom_id += `:${player}:${version}:${page}`;

	const embed: APIEmbed = {
		color: Colors.CYBER,
		title: 'LCC Index Entries',
		description: filterStr,
		fields: [
			{
				name: 'Number of entries',
				value: `${endIndex - 9}-${endIndex - 10 + pageOfEntries.length} of **${entries.length}**`,
			},
			{
				name: 'Map',
				value: pageOfEntries.map(({ map }) => map).join('\n'),
				inline: true,
			},
			{
				name: 'Cost',
				value: pageOfEntries.map(({ cost }) => cost).join('\n'),
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
