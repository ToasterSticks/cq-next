import {
	ButtonStyle,
	InteractionResponseType,
	ComponentType,
	type ApplicationCommandType,
	type APIMessageActionRowComponent,
	Routes,
	MessageFlags,
} from 'discord-api-types/v10';
import { TRIVIA } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import { deferUpdate, request } from '../../util';

const LETTER_CHOICES = ['A', 'B', 'C', 'D'];

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'quiz',
	description: 'Test your knowledge of the Bloonsverse',

	exec: () => {
		const { question, choices, ans } = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
		const shuffledIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
		const correctButtonIndex = shuffledIndices.indexOf(ans);
		const buttons = LETTER_CHOICES.map(
			(letter, i): APIMessageActionRowComponent => ({
				type: ComponentType.Button,
				style: ButtonStyle.Primary,
				label: letter,
				custom_id: `answer:${correctButtonIndex}:${i}`,
			})
		);

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `**${question}**\n\n>>> ${shuffledIndices
					.map(
						(questionIndex, i) =>
							`:regional_indicator_${LETTER_CHOICES[i].toLowerCase()}: ${choices[questionIndex]}`
					)
					.join('\n')}`,
				components: [{ type: ComponentType.ActionRow, components: buttons }],
			},
		};
	},

	components: {
		answer: ({ user, message: { interaction, components }, token }, [answer, response]) => {
			if (user!.id !== interaction!.user.id) return deferUpdate();

			components![0].components.forEach((button, i) => {
				if (button.type !== ComponentType.Button) return;

				button.disabled = true;
				button.style =
					i === +answer
						? ButtonStyle.Success
						: i === +response
						? ButtonStyle.Danger
						: ButtonStyle.Secondary;
			});

			const correctChoiceStr = `The answer was **${LETTER_CHOICES[+answer]}**.`;

			request(Routes.webhook(CLIENT_ID, token), 'POST', {
				content:
					answer === response
						? `Correct! ${correctChoiceStr}`
						: `Incorrect! ${correctChoiceStr} Better luck next time.`,
				flags: MessageFlags.Ephemeral,
			});

			return {
				type: InteractionResponseType.UpdateMessage,
				data: { components },
			};
		},
	},
};
