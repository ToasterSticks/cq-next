import {
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
} from 'discord-api-types/v10';
import type { Command } from '../../http-interactions';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'github',
	description: 'Links the CQ GitHub repo',

	exec: () => {
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `https://github.com/hemisemidemipresent/cyberquincy - CyberQuincy's GitHub repo. This clone is maintained by Toast#6601, running on http interactions.`,
				flags: MessageFlags.Ephemeral,
			},
		};
	},
};
