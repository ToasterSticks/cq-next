import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
	type APIInteractionResponseCallbackData,
} from 'discord-api-types/v10';
import { Colors } from '../../../constants/bloons';
import { tags } from '../../../constants/tags';
import type { Command } from '../../../http-interactions';
import type { TagData } from '../../../types';
import { getOption } from '../../../util';

const tagCache = new Map<string, TagData>();

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'tag',
	description: 'Display a tag by its name or alias',
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'query',
			description: 'The name or alias of the tag',
			required: true,
		},
	],

	exec: ({ data: { options } }) => {
		const query = getOption<string, true>(options, 'query');
		const tag = tags[query];

		if (!tag)
			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: `Couldn't find a tag with the name **${query}**.`,
					flags: MessageFlags.Ephemeral,
				},
			};

		const replyData: APIInteractionResponseCallbackData = {};

		if ('content' in tag) replyData.content = tag.content;
		if ('embeds' in tag) replyData.embeds = tag.embeds;

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: replyData,
		};
	},
};

for (const [key, value] of Object.entries(tags)) {
	if ('embeds' in value) {
		for (const i in value.embeds) value.embeds[i].color ??= Colors.CYBER;
	}

	if (value.keywords) value.keywords.push(key);
	else value.keywords = [key];

	for (const keyword of value.keywords) tagCache.set(keyword, value);

	tagCache.set(key, value);
}
