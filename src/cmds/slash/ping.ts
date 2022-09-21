import {
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
} from 'discord-api-types/v10';
import type { Command } from '../../http-interactions';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'ping',
	description: 'Reply with pong',

	exec: ({ user }) => {
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `<@${user!.id}>, pong!`,
				flags: MessageFlags.Ephemeral,
			},
		};
	},
};
