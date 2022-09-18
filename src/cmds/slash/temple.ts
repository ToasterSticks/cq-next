import { stripIndents } from 'common-tags';
import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
	type APIApplicationCommandInteractionDataSubcommandOption,
	type APIEmbed,
} from 'discord-api-types/v10';
import { Colors, Temple, TSG } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import { getOption } from '../../util';

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
		const sacrificeOptions = getOption<APIApplicationCommandInteractionDataSubcommandOption[]>(
			options,
			'from-sacrifice'
		);

		const configurationOptions = getOption<APIApplicationCommandInteractionDataSubcommandOption[]>(
			options,
			'max'
		);

		let embed: APIEmbed;

		try {
			embed = sacrificeOptions
				? handleFromSacrifice(sacrificeOptions)
				: handleMax(configurationOptions!);
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

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { embeds: [embed] },
		};
	},
};

const handleFromSacrifice = (
	options: APIApplicationCommandInteractionDataSubcommandOption[]
): APIEmbed => {
	const primary = getOption<number>(options, 'primary') ?? 0;
	const military = getOption<number>(options, 'military') ?? 0;
	const magic = getOption<number>(options, 'magic') ?? 0;
	const support = getOption<number>(options, 'support') ?? 0;

	const embed: APIEmbed = {
		title: 'Temple Stats',
		color: Colors.YELLOW,
		fields: [
			{
				name: `Primary sacrifice ($${primary})`,
				value: Temple.PRIMARY[0] + '\n' + levelToString(cashToLevel(primary), 'PRIMARY'),
			},
			{
				name: `Military sacrifice ($${military})`,
				value: Temple.MILITARY[0] + '\n' + levelToString(cashToLevel(military), 'MILITARY'),
			},
			{
				name: `Magic sacrifice ($${magic})`,
				value: Temple.MAGIC[0] + '\n' + levelToString(cashToLevel(magic), 'MAGIC'),
			},
			{
				name: `Support sacrifice ($${support})`,
				value: Temple.SUPPORT[0] + '\n' + levelToString(cashToLevel(support), 'SUPPORT'),
			},
		],
	};

	return embed;
};

const handleMax = (options: APIApplicationCommandInteractionDataSubcommandOption[]): APIEmbed => {
	const configuration = getOption<string, true>(options, 'configuration');
	if (!isValidConfiguration(configuration))
		throw new Error(
			stripIndents`Please enter a valid temple set!
            
      This command is for the statistics of a **maxed temple sacrifice**, i.e. the sacrifices **exceed** $50000.
      The **temple configuration** follows a format of \`<primary><military><magic><support>\`. Eg. Primary and magic = \`1010\`

      Although this command accepts the temple config \`1111\`, when sacrificing towers to a Sun Temple, only three categories count. If four categories are sacrificed then the cheapest is ignored.

      The True Sun God, however, can accept sacrifices from all four categories. 
      For example if you had a \`1101\` temple that you've max-sacrificed on all 4 categories, you would get \`1101\` + \`1111\` = \`2212\``
		);

	const embed: APIEmbed = {
		title: `Max temple stats for ${configuration}`,
		color: Colors.YELLOW,
		fields: [],
	};

	const titles = [
		'Primary sacrifice',
		'Military sacrifice',
		'Magic sacrifice',
		'Support sacrifice',
	];

	(['PRIMARY', 'MILITARY', 'MAGIC', 'SUPPORT'] as const).forEach((category, index) => {
		const tier = +configuration[index];
		if (!tier) return;

		let value = Temple[category][0] + '\n' + levelToString(tier > 0 ? 9 : 0, category);
		if (tier === 2) value += `\n**TSG**:\n${TSG[category]}`;

		embed.fields!.push({
			name: `${titles[index]} (tier ${tier})`,
			value,
		});
	});

	return embed;
};

const cashToLevel = (cash: number) => {
	const sacrificeLevels = [300, 1000, 2000, 4000, 7500, 10000, 15000, 25000, 50000];
	return sacrificeLevels.findIndex((level) => cash < level) ?? 9;
};

const levelToString = (level: number, towerType: keyof typeof Temple) => {
	if (!level) return '\u200b';
	return Temple[towerType][level];
};

const isValidConfiguration = (config: string) => {
	if (isNaN(+config)) return false;

	const upgrades = [...config].map((x) => +x);
	const total = upgrades.reduce((a, b) => a + b, 0);
	if (total > 7) return false;

	upgrades.sort();
	if (upgrades[3] > 2) return false;

	return true;
};
