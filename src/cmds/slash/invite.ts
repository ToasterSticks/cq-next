import {
	InteractionResponseType,
	MessageFlags,
	OAuth2Routes,
	type ApplicationCommandType,
} from 'discord-api-types/v10';
import type { Command } from '../../http-interactions';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'invite',
	description: 'Invite Sober Quinze to your server',

	exec: () => {
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `Invite to Sober Quinze: [Click me](${OAuth2Routes.authorizationURL}?client_id=${CLIENT_ID}&scope=bot)`,
				flags: MessageFlags.Ephemeral,
			},
		};
	},
};
