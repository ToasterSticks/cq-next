import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	type ApplicationCommandType,
	type APIEmbed,
} from 'discord-api-types/v10';
import { MAPS } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import { bestMatch, getOption, REPORT_BUG_BUTTON_ROW, toTitleCase } from '../../util';

const MAP_NAMES = Object.keys(MAPS) as (keyof typeof MAPS)[];

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'map',
	description: 'Get information about a map',
	options: [
		{
			name: 'map',
			description: 'The map to get information about',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],

	exec: ({ data: { options } }) => {
		const map = getOption<string, true>(options, 'map').toLowerCase();
		const similar = bestMatch(map, MAP_NAMES);

		const { lenStr, objects, clearOutCost, waterComposition, ends, ver } = MAPS[similar];

		const embed: APIEmbed = {
			title: toTitleCase(similar, '_'),
			fields: [
				{
					name: 'Map length (RBS)',
					value: lenStr,
					inline: true,
				},
				{
					name: 'Object count',
					value: objects.toString(),
					inline: true,
				},
				{
					name: 'Complete removal cost',
					value: clearOutCost.toString(),
					inline: true,
				},
				{
					name: 'Water composition',
					value: waterComposition,
					inline: true,
				},
				{
					name: 'Entrances and exits',
					value: ends,
					inline: true,
				},
				{
					name: 'Version added',
					value: ver.toString(),
					inline: true,
				},
			],
		};

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [embed],
				components: [REPORT_BUG_BUTTON_ROW],
			},
		};
	},
};
