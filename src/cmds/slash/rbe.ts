import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { ABR_INCOME, Gamemode, NORMAL_INCOME } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import { getOption } from '../../util';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'rbe',
	description: 'Calculate the RBE of a round',
	options: [
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'start-round',
			description: 'The round to start from (can be the only one)',
			min_value: 1,
			max_value: 140,
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'end-round',
			description: 'The round to end at',
			min_value: 1,
			max_value: 140,
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'mode',
			description: 'The game-mode to display information for',
			choices: [
				{ name: 'Normal', value: Gamemode.NORMAL },
				{ name: 'Alternate Bloons Rounds', value: Gamemode.ABR },
			],
		},
	],

	exec: ({ data: { options } }) => {
		const bounds = [
			getOption<number, true>(options, 'start-round'),
			getOption<number>(options, 'end-round'),
		].filter((x): x is number => x !== null);
		const startRound = Math.min(...bounds);
		const endRound = Math.max(...bounds);
		const mode = getOption<Gamemode>(options, 'mode') ?? Gamemode.NORMAL;

		let errorMessage: string | undefined;

		if (mode === Gamemode.ABR) {
			if (startRound < 3) errorMessage = 'There is no support for rounds 1-2 ABR calculation';
			else if (endRound > 100)
				errorMessage = `Round ${endRound} isn't predetermined in ABR; the calculation won't be consistent`;
		} else if (endRound > 140) {
			errorMessage = `Round ${endRound} isn't predetermined; the calculation won't be consistent`;
		}

		if (errorMessage)
			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: errorMessage,
					flags: MessageFlags.Ephemeral,
				},
			};

		const info = mode === Gamemode.ABR ? ABR_INCOME : NORMAL_INCOME;
		const totalPopCount = info[endRound].cumulativeRBE - info[startRound - 1].cumulativeRBE;

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: stripIndents`
					The total RBE is **${totalPopCount.toLocaleString()}** from round(s) ${startRound} to ${endRound}.
					Note: some towers may count pops differently due to bugs`,
			},
		};
	},
};
