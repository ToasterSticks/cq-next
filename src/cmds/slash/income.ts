import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
} from 'discord-api-types/v10';
import { ABR_INCOME, Gamemode, NORMAL_INCOME } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import { getOption } from '../../util';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'income',
	description: 'Calculate the income of a round',
	options: [
		{
			name: 'start-round',
			description: 'The round to start from (can be the only one)',
			type: ApplicationCommandOptionType.Integer,
			min_value: 1,
			max_value: 140,
			required: true,
		},
		{
			name: 'end-round',
			description: 'The round to end at',
			type: ApplicationCommandOptionType.Integer,
			min_value: 1,
			max_value: 140,
		},
		{
			name: 'mode',
			description: 'The game-mode to display information for',
			type: ApplicationCommandOptionType.Integer,
			choices: [
				{ name: 'Normal', value: Gamemode.NORMAL },
				{ name: 'Alternate Bloons Rounds', value: Gamemode.ABR },
				{ name: 'Half Cash', value: Gamemode.HALF_CASH },
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
		let cashEarned = info[endRound].cumulativeCash - info[startRound - 1].cumulativeCash;

		if (mode === Gamemode.HALF_CASH) cashEarned /= 2;

		const gamemodeStr = ['CHIMPS', 'Alternate Bloons Rounds', 'Half Cash'][mode];

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `**${cashEarned.toLocaleString()}** is made in ${gamemodeStr} from round(s) ${startRound} to ${endRound}.`,
			},
		};
	},
};
