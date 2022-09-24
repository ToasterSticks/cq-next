import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	ButtonStyle,
	ComponentType,
	type ApplicationCommandType,
	type APIEmbed,
	type APIMessageActionRowComponent,
	type APIActionRowComponent,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { BLOONOLOGY_TOWER_STATS, Colors, COSTS } from '../../constants/bloons';
import type { Command } from '../../http-interactions';
import type { ValidTowerPath } from '../../types';
import { deferUpdate, getOption, REPORT_BUG_BUTTON_ROW, toTitleCase, Towers } from '../../util';

export const command: Command<ApplicationCommandType.ChatInput> = {
	name: 'tower',
	description: 'Display information for a tower',
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'tower',
			description: 'The tower to display information for',
			choices: Object.keys(BLOONOLOGY_TOWER_STATS).map((name) => ({
				name: toTitleCase(name, '-'),
				value: name,
			})),
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'path',
			description: 'The path of the tower to display information for',
			min_length: 3,
			max_length: 3,
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
						Easy: ${Towers.difficultyPriceMult(upgradeCost, 'EASY').toLocaleString()}
						Normal: ${upgradeCost.toLocaleString()}
						Hard: ${Towers.difficultyPriceMult(upgradeCost, 'HARD').toLocaleString()}
						Impoppable: ${Towers.difficultyPriceMult(upgradeCost, 'IMPOPPABLE').toLocaleString()}`,
					inline: true,
				},
				{
					name: 'Total cost ($)',
					value: stripIndents`Easy: ${easyTotalCost.toLocaleString()}
						Medium: ${totalCost.toLocaleString()}
						Hard: ${hardTotalCost.toLocaleString()}
						Impoppable: ${impopTotalCost.toLocaleString()}`,
					inline: true,
				},
			],
		};

		const row: APIActionRowComponent<APIMessageActionRowComponent> = {
			type: ComponentType.ActionRow,
			components: [
				{
					type: ComponentType.Button,
					style: ButtonStyle.Primary,
					label: 'Full upgrade summary',
					custom_id: 'summary:' + tower,
				},
				REPORT_BUG_BUTTON_ROW.components[0],
			],
		};

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [embed],
				components: [row],
			},
		};
	},

	components: {
		summary: async ({ user, message: { interaction, components } }, [tower]) => {
			if (user!.id !== interaction!.user.id) return deferUpdate();

			const towerCasted = tower as keyof typeof BLOONOLOGY_TOWER_STATS;
			const body = await fetch(BLOONOLOGY_TOWER_STATS[towerCasted]).then((res) =>
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

			const tierUpgrades = [];

			for (let tier = 1; tier <= 5; tier++)
				for (let i = 0; i < 3; i++)
					tierUpgrades.push('000'.slice(0, i) + tier + '000'.slice(i + 1));

			const pathDescriptions = tierUpgrades.map((u) =>
				cleanDesc(upgradeDescriptions.find((desc) => desc.slice(0, 3) === u) ?? '')
			);

			const splitTexts = [
				'__Changes from 0-0-0__',
				'Changes from 000:',
				'__Changes from Previous Tier__',
				'Changes from previous tier:',
				'__Crosspath Benefits__',
				'Crosspath Benefits:',
			];

			const pathBenefits = pathDescriptions.map((desc) => {
				const benefitsGroup: string | undefined = desc
					.split(new RegExp(splitTexts.join('|'), 'i'))[1]
					?.trim();

				return (
					benefitsGroup
						?.split('\n')
						.map((n) => `<:_:875985515357282316> ${n}`)
						.join('\n') ?? 'No benefits'
				);
			});

			const headers = tierUpgrades.map((u) => {
				const [path, tier] = Towers.pathTierFromUpgradeSet(u);
				const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerCasted, path, tier);
				return `${upgradeName} (${u})`;
			});

			const embed: APIEmbed = {
				color: Colors.CYBER,
				title: `${toTitleCase(towerCasted, '-')} (full upgrade summary)`,
				description: cleanDesc(upgradeDescriptions[0]).slice(3),
				fields: headers.map((h, i) => ({ name: h, value: pathBenefits[i], inline: true })),
			};

			components![0].components[0].disabled = true;

			return {
				type: InteractionResponseType.UpdateMessage,
				data: {
					embeds: [embed],
					components: components ?? [REPORT_BUG_BUTTON_ROW],
				},
			};
		},
	},
};

const cleanDesc = (desc: string) =>
	desc
		.replaceAll('\n', '')
		.replaceAll('\r \t', '\n')
		.replaceAll(' \t-', '-    ')
		.replaceAll('\r', '\n');
