import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
} from 'discord-api-types/v10';
import { GAME_VERSION_MAJOR } from '../../../constants/bloons';
import type { Command } from '../../../http-interactions';
import { getOption } from '../../../util';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'tierlist',
	description: 'Return a tierlist for a specific version',
	options: [
		{
			type: ApplicationCommandOptionType.Integer,
			name: 'version',
			description: 'The version of to send the tierlist for',
			min_value: 9,
			max_value: GAME_VERSION_MAJOR,
			required: true,
		},
	],

	exec: ({ data: { options } }) => {
		const version = getOption<number, true>(options, 'version');
		const url = TIERLISTS[version];

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: url ?? 'No tierlist found for this version.',
				flags: url ? 0 : MessageFlags.Ephemeral,
			},
		};
	},
};

const TIERLISTS = [
	...Array<null>(9),
	'https://www.reddit.com/r/btd6/comments/bn7wtu/comprehensive_tier_list_for_chimps_by_path/',
	null,
	'https://www.reddit.com/r/btd6/comments/cv5mdi/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/d9wdk9/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/dq0xee/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/eefaum/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/f1ly0m/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/ffrkze/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/g3kiy2/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/h7iht0/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/huibn2/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/irahad/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/jp0ezq/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/knnwg9/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/lyy5v5/comprehensive_tier_list_for_chimps_by_path/',
	null,
	'https://www.reddit.com/r/btd6/comments/nkn8ct/comprehensive_tier_list_for_chimps_by_path/',
	null,
	'https://www.reddit.com/r/btd6/comments/q6f3vs/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/rc4rkm/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/sig6c0/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/ttdrdg/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/uqjt6l/comprehensive_tier_list_for_chimps_by_path/',
	'https://www.reddit.com/r/btd6/comments/xbyxm9/comprehensive_tier_list_for_chimps_by_path/',
];
