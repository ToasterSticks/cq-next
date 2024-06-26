import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	ComponentType,
	type ApplicationCommandType,
	type APIEmbed,
	type APIApplicationCommandInteractionDataSubcommandOption,
	type APIInteractionResponseCallbackData,
	type APIMessageComponentInteraction,
	type APISelectMenuComponent,
} from 'discord-api-types/v10';
import { Colors } from '../../../constants/bloons';
import type { Command, InteractionHandler } from '../../../http-interactions';
import { States, type LCCEntry } from '../../../types';
import { deferUpdate, getOption, getPageButtons, replyWithError } from '../../../util';

const getPageHandler = (movePage: number): InteractionHandler<APIMessageComponentInteraction> => {
	return async ({ user, message: { interaction } }, args: string[]) => {
		if (user!.id !== interaction!.user.id) return deferUpdate();

		const argsWithNewPage = args as [string, string, number];
		argsWithNewPage[2] = +args[2] + movePage;

		return {
			type: InteractionResponseType.UpdateMessage,
			data: await handleFilteredSearch(...argsWithNewPage).catch(replyWithError),
		};
	};
};

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'lcd',
	description: 'Browse completed LCD Index entries',
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
			description: 'View a specific LCD entry',
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
		).catch(replyWithError);

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
		specific_entry: async ({ user, message: { interaction }, data }) => {
			if (user!.id !== interaction!.user.id || data.component_type !== ComponentType.SelectMenu)
				return deferUpdate();

			return {
				type: InteractionResponseType.UpdateMessage,
				data: await handleSpecificEntry(data.values[0]).catch(replyWithError),
			};
		},
	},
};

const handleSpecificEntry = async (map: string): Promise<APIInteractionResponseCallbackData> => {
	const query = new URLSearchParams({ map });
	const entries = await fetch('https://toastersticks.is-a.dev/index/lcd?' + query.toString()).then(
		(res) => (res.ok ? res.json<LCCEntry[]>() : null)
	);

	const entry = entries?.[0];
	if (!entry) throw new Error(`No LCD Index entry found for on map ${map}.`);

	const embed: APIEmbed = {
		color: Colors.CYBER,
		title: `LCD Index Entry for ${entry.map}`,
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

	return { embeds: [embed], components: [] };
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

	const entries = await fetch('https://toastersticks.is-a.dev/index/lcd?' + query.toString()).then(
		(res) => (res.ok ? res.json<LCCEntry[]>() : null)
	);
	if (!entries?.length) throw new Error('Failed to fetch LCD Index entries.');

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
		title: 'LCD Index Entries',
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

	const selectMenu: APISelectMenuComponent = {
		type: ComponentType.SelectMenu,
		custom_id: 'specific_entry',
		options: pageOfEntries.map(({ map, cost, player }) => ({
			label: `${map}: ${cost}`,
			description: player,
			value: map,
		})),
	};

	return {
		embeds: [embed],
		components: [
			{ type: ComponentType.ActionRow, components: [selectMenu] },
			{ type: ComponentType.ActionRow, components: pageButtons },
		],
	};
};
