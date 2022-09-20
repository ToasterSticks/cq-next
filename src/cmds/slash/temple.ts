import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
	type APIApplicationCommandInteractionDataSubcommandOption,
	type APIEmbed,
	type APIApplicationCommandInteractionDataOption,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { Colors, Temple, TSG, TowerType } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import { getOption } from '../../util';
import type { WithRequiredProp } from '../../types';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'temple',
	description: 'Display temple stats',
	options: [
		{
			name: 'from-sacrifice',
			description: 'Get temple stats from the amount of money sacrificed to each category',
			type: ApplicationCommandOptionType.Subcommand,
			options: ['primary', 'military', 'magic', 'support'].map((category) => ({
				name: category,
				description: `Amount of money sacrificed to the ${category} category`,
				min_value: 0,
				type: ApplicationCommandOptionType.Integer,
			})),
		},
		{
			name: 'max',
			description: 'Get max temple stats based on category configuration',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'configuration',
					description: 'The configuration of temple sacrifices (eg. 1011)',
					type: ApplicationCommandOptionType.String,
					min_length: 4,
					max_length: 4,
					required: true,
				},
			],
		},
	],

	exec: ({ data: { options } }) => {
		const isSacSubcommand = getOption<APIApplicationCommandInteractionDataSubcommandOption[]>(
			options,
			'from-sacrifice'
		);

		try {
			const embed = isSacSubcommand ? handleFromSacrifice(options!) : handleMax(options!);

			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: { embeds: [embed] },
			};
		} catch (error) {
			const { message } = error as Error;

			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: message,
					flags: MessageFlags.Ephemeral,
				},
			};
		}
	},
};

const handleFromSacrifice = (options: APIApplicationCommandInteractionDataOption[]): APIEmbed => {
	const primary = getOption<number>(options, 'primary', true) ?? 0;
	const military = getOption<number>(options, 'military', true) ?? 0;
	const magic = getOption<number>(options, 'magic', true) ?? 0;
	const support = getOption<number>(options, 'support', true) ?? 0;

	const embed: WithRequiredProp<APIEmbed, 'fields'> = {
		color: Colors.YELLOW,
		title: 'Temple Stats',
		fields: [
			{
				name: `Primary sacrifice ($${primary})`,
				value:
					Temple[TowerType.PRIMARY][0] +
					'\n' +
					levelToString(cashToLevel(primary), TowerType.PRIMARY),
			},
			{
				name: `Military sacrifice ($${military})`,
				value:
					Temple[TowerType.MILITARY][0] +
					'\n' +
					levelToString(cashToLevel(military), TowerType.MILITARY),
			},
			{
				name: `Magic sacrifice ($${magic})`,
				value:
					Temple[TowerType.MAGIC][0] + '\n' + levelToString(cashToLevel(magic), TowerType.MAGIC),
			},
			{
				name: `Support sacrifice ($${support})`,
				value:
					Temple[TowerType.SUPPORT][0] +
					'\n' +
					levelToString(cashToLevel(support), TowerType.SUPPORT),
			},
		],
	};

	for (const field of embed.fields) field.value = field.value.replace('\u200b', '');

	return embed;
};

const handleMax = (options: APIApplicationCommandInteractionDataOption[]): APIEmbed => {
	const configuration = getOption<string, true>(options, 'configuration', true);
	if (!isValidConfiguration(configuration))
		throw new Error(
			stripIndents`Please enter a valid temple set!
            
      This command is for the statistics of a **maxed temple sacrifice**, i.e. the sacrifices **exceed** $50000.
      The **temple configuration** follows a format of \`<primary><military><magic><support>\`. Eg. Primary and magic = \`1010\`

      Although this command accepts the temple config \`1111\`, when sacrificing towers to a Sun Temple, only three categories count. If four categories are sacrificed then the cheapest is ignored.

      The True Sun God, however, can accept sacrifices from all four categories. 
      For example if you had a \`1101\` temple that you've max-sacrificed on all 4 categories, you would get \`1101\` + \`1111\` = \`2212\``
		);

	const embed: WithRequiredProp<APIEmbed, 'fields'> = {
		color: Colors.YELLOW,
		title: `Max temple stats for ${configuration}`,
		fields: [],
	};

	const titles = [
		'Primary sacrifice',
		'Military sacrifice',
		'Magic sacrifice',
		'Support sacrifice',
	] as const;

	titles.forEach((title, index) => {
		const tier = +configuration[index];
		if (!tier) return;

		let value = Temple[index][0] + '\n' + levelToString(tier > 0 ? 9 : 0, index);
		if (tier === 2) value += `\n**TSG**:\n${TSG[index]}`;

		embed.fields.push({
			name: `${title} (tier ${tier})`,
			value,
		});
	});

	return embed;
};

const cashToLevel = (cash: number) => {
	const sacrificeLevels = [300, 1000, 2000, 4000, 7500, 10000, 15000, 25000, 50000];
	const idx = sacrificeLevels.findIndex((level) => cash < level);
	return idx !== 1 ? idx : 9;
};

const levelToString = (level: number, towerType: TowerType) => {
	if (!level) return '\u200b';
	return Temple[towerType][level];
};

const isValidConfiguration = (config: string) => {
	if (!/^\d{4}$/.test(config)) return false;

	const upgrades = [...config].map((x) => +x);
	const total = upgrades.reduce((a, b) => a + b, 0);
	if (total > 7) return false;

	upgrades.sort();
	if (upgrades[3] > 2) return false;

	return true;
};
