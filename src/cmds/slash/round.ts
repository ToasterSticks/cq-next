import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	type ApplicationCommandType,
	type APIEmbed,
	type APIEmbedField,
} from 'discord-api-types/v10';
import {
	ABR_INCOME,
	ABR_ROUND_CONTENTS,
	BloonLength,
	Colors,
	FREEPLAY,
	Gamemode,
	NORMAL_INCOME,
	ROUND_CONTENTS,
} from '../../constants/bloons';
import { stripIndents } from 'common-tags';
import type { Command } from '../../http-interactions';
import { Enemies, getOption, roundDec } from '../../util';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'round',
	description: 'Display information for a round',
	options: [
		{
			name: 'round',
			description: 'The round to display information for',
			type: ApplicationCommandOptionType.Integer,
			min_value: 1,
			max_value: 1288555,
			required: true,
		},
		{
			name: 'mode',
			description: 'The game-mode to display information for',
			type: ApplicationCommandOptionType.Integer,
			choices: [
				{ name: 'Normal', value: Gamemode.NORMAL },
				{ name: 'Alternate Bloons Rounds', value: Gamemode.ABR },
			],
		},
	],

	exec: async ({ data: { options } }) => {
		const round = getOption<number, true>(options, 'round');
		const mode = getOption<number>(options, 'mode') ?? Gamemode.NORMAL;

		if (round > 140 || (mode && round > 100)) {
			const embed = generateFreeplayEmbed(round, mode);

			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: { embeds: [embed] },
			};
		}

		const embed = generateRegularEmbed(round, mode);

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { embeds: [embed] },
		};
	},
};

const generateFreeplayEmbed = (round: number, mode: Gamemode) => {
	const { xp, totalXp } = calcXp(round);

	const healthRampFactor = Enemies.getHealthRamping(round);
	const speedRampFactor = Enemies.getSpeedRamping(round);
	const bloonSets = getBloonSets(round);

	const embed: APIEmbed = {
		color: Colors.CYBER,
		title: `Round ${round} ${mode === Gamemode.ABR ? 'ABR' : ''}`,
		description: `All **possible** bloon sets\n\n${bloonSets.join('\n')}`,
		fields: [
			{
				name: 'Ramping',
				value: stripIndents`
					Health: ${healthRampFactor}x
					Speed: ${speedRampFactor}x`,
			},
			{
				name: 'XP earned',
				value: `${(xp * 0.1).toLocaleString()}`,
				inline: true,
			},
			{
				name: 'Total XP from R1',
				value: `${(totalXp * 0.1).toLocaleString()}`,
				inline: true,
			},
			{
				name: 'Note',
				value: '• Map XP multipliers: { intermediate 1.1, advanced 1.2, expert 1.3 }',
			},
		],
	};

	return embed;
};

const generateRegularEmbed = (round: number, mode: Gamemode) => {
	const { xp, totalXp } = calcXp(round);

	const isABR = mode === Gamemode.ABR;

	const roundLength = getLength(round, mode);
	const roundContent = (isABR ? ABR_ROUND_CONTENTS : ROUND_CONTENTS)[round].split(',').join('\n');
	const roundRBE = isABR ? ABR_INCOME[round].rbe : NORMAL_INCOME[round].rbe;
	const roundCash = isABR
		? round > 2
			? ABR_INCOME[round].cashThisRound
			: 'ABR cash data not available for round 1-2'
		: NORMAL_INCOME[round].cashThisRound;

	const embed: APIEmbed & { fields: APIEmbedField[] } = {
		color: Colors.CYBER,
		title: `Round ${round} ${isABR ? 'ABR' : ''}`,
		description: roundContent,
		fields: [
			{ name: 'Round length (seconds)', value: roundLength.toString(), inline: true },
			{ name: 'RBE', value: roundRBE.toLocaleString(), inline: true },
			{
				name: 'Cash earned',
				value: '$' + roundCash.toLocaleString(),
				inline: true,
			},
			{ name: 'XP earned', value: xp.toLocaleString(), inline: true },
			{ name: 'Total XP from R1', value: totalXp.toLocaleString() },
			{
				name: 'Notes',
				value: stripIndents`
					• Freeplay (e.g. round 41 on easy mode): XP is 0.3 of displayed
					• Map XP multipliers: { intermediate 1.1, advanced 1.2, expert 1.3 }`,
			},
		],
	};

	if (round > 80) {
		const healthRampFactor = Enemies.getHealthRamping(round);
		const speedRampFactor = Enemies.getSpeedRamping(round);

		embed.fields.splice(3, 0, {
			name: 'Ramping',
			value: stripIndents`
				Health: ${healthRampFactor}x
				Speed: ${speedRampFactor}x`,
		});
	}

	return embed;
};

const getLength = (round: number, mode: Gamemode) => {
	const roundArray = BloonLength[mode][round.toString() as keyof typeof BloonLength[typeof round]];
	let longest = 0;
	let end = 0;

	for (const group of roundArray) {
		end = group.length[2];
		if (end > longest) longest = end;
	}

	return roundDec(longest / 60, 2);
};

const getBloonSets = (round: number) => {
	const bloonSets: string[] = [];

	for (const bloonGroup of FREEPLAY)
		for (const bounds of bloonGroup.bounds)
			if (bounds[0] <= round && bounds[1] >= round) {
				bloonSets.push(`${bloonGroup.number} ${bloonGroup.bloon}`);
				break;
			}

	return bloonSets;
};

const calcXp = (round: number) => {
	let xp = 0;
	let totalXp = 0;

	if (round < 21) {
		xp = 20 * round + 20;
		totalXp = 40 + 50 * (round - 1) + 10 * Math.pow(round - 1, 2);
	} else if (round > 20 && round < 51) {
		xp = 40 * (round - 20) + 420;
		totalXp = 4600 + 440 * (round - 20) + 20 * Math.pow(round - 20, 2);
	} else {
		xp = (round - 50) * 90 + 1620;
		totalXp = 35800 + 1665 * (round - 50) + 45 * Math.pow(round - 50, 2);
	}

	return { xp, totalXp };
};
