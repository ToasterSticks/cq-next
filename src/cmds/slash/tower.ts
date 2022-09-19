import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type ApplicationCommandType,
	type APIEmbed,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { BLOONOLOGY_TOWER_STATS, Colors, COSTS } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import type { ValidTowerPath } from '../../types';
import {
	addNumberSeparator,
	getOption,
	REPORT_BUG_BUTTON_ROW,
	toTitleCase,
	Towers,
} from '../../util';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'tower',
	description: 'Display information for a tower',
	options: [
		{
			name: 'tower',
			description: 'The tower to display information for',
			type: ApplicationCommandOptionType.String,
			choices: Object.keys(BLOONOLOGY_TOWER_STATS).map((name) => ({
				name: toTitleCase(name, '-'),
				value: name,
			})),
			required: true,
		},
		{
			name: 'path',
			description: 'The path of the tower to display information for',
			min_length: 3,
			max_length: 3,
			type: ApplicationCommandOptionType.String,
		},
	],

	exec: async ({ data: { options } }) => {
		const tower = getOption<keyof typeof BLOONOLOGY_TOWER_STATS, true>(options, 'tower');
		const path = getOption<string>(options, 'path') ?? '000';

		if (!/^\d{3}$/.test(path))
			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: `The path **${path}** is invalid.`,
					flags: MessageFlags.Ephemeral,
				},
			};

		const body = await fetch(BLOONOLOGY_TOWER_STATS[tower]).then((res) =>
			res.ok ? res.text() : null
		);

		if (!body)
			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: 'Something went wrong while fetching the tower data.',
					flags: MessageFlags.Ephemeral,
				},
			};

		const upgradeDescriptions = body.split('\r\n\r\n');
		const pathDescription = cleanDesc(
			upgradeDescriptions
				.find((fullDescription) => fullDescription.slice(0, 3) === path)
				?.slice(3) ?? ''
		);

		if (!pathDescription)
			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: 'Something went wrong while parsing the tower info.',
					flags: MessageFlags.Ephemeral,
				},
			};

		const [mainPath, tier] = Towers.pathTierFromUpgradeSet(path);
		const upgradePathReadable = [...path].join('-');
		const towerNameReadable = toTitleCase(tower, '-');

		let title: string;
		if (tier) {
			const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(tower, mainPath, tier);
			title = `${upgradeName} (${upgradePathReadable} ${towerNameReadable})`;
		} else {
			title = `${towerNameReadable} (${upgradePathReadable})`;
		}

		const easyTotalCost = Towers.totalTowerUpgradeCrosspathCostMult(tower, path, 'EASY');
		const totalCost = Towers.totalTowerUpgradeCrosspathCost(tower, path);
		const hardTotalCost = Towers.totalTowerUpgradeCrosspathCostMult(tower, path, 'HARD');
		const impopTotalCost = Towers.totalTowerUpgradeCrosspathCostMult(tower, path, 'IMPOPPABLE');

		const towerCosts = COSTS[tower];
		const upgradeCost = +path
			? towerCosts.upgrades[mainPath as ValidTowerPath][tier - 1]
			: totalCost;

		const embed: APIEmbed = {
			color: Colors.CYBER,
			title,
			description: pathDescription,
			fields: [
				{
					name: 'Cost ($)',
					value: stripIndents`
						Easy: ${addNumberSeparator(Towers.difficultyPriceMult(upgradeCost, 'EASY'))}
						Normal: ${addNumberSeparator(upgradeCost)}
						Hard: ${addNumberSeparator(Towers.difficultyPriceMult(upgradeCost, 'HARD'))}
						Impoppable: ${addNumberSeparator(Towers.difficultyPriceMult(upgradeCost, 'IMPOPPABLE'))}`,
					inline: true,
				},
				{
					name: 'Total cost ($)',
					value: stripIndents`Easy: ${addNumberSeparator(easyTotalCost)}
						Medium: ${addNumberSeparator(totalCost)}
						Hard: ${addNumberSeparator(hardTotalCost)}
						Impoppable: ${addNumberSeparator(impopTotalCost)}`,
					inline: true,
				},
			],
		};

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [embed],
				components: [REPORT_BUG_BUTTON_ROW],
			},
		};
	},
};

const cleanDesc = (desc: string) =>
	desc
		.toString()
		.replaceAll('\n', '')
		.replaceAll('\r \t', '\n')
		.replaceAll(' \t-', '-    ')
		.replaceAll('\r', '\n');
