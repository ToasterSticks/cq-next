import {
	ButtonStyle,
	ComponentType,
	InteractionResponseType,
	RouteBases,
	ApplicationCommandOptionType,
	type APIApplicationCommandInteractionDataBasicOption,
	type APIApplicationCommandInteractionDataOption,
	type APIApplicationCommandInteractionDataSubcommandOption,
	type APIInteractionResponse,
	type APIModalSubmission,
	type APIActionRowComponent,
	type APIMessageActionRowComponent,
	type APIApplicationCommandOption,
	type APIApplicationCommandSubcommandOption,
} from 'discord-api-types/v10';
import { COSTS, UPGRADE_NAMES, type BLOONOLOGY_TOWER_STATS } from './constants/bloons';
import type { ValidTowerPath } from './types';

export const mapFiles = <T>(context: __WebpackModuleApi.RequireContext) =>
	context.keys().map<T>((path) => context(path).command);

export const request = (route: string, method: string, body: FormData | unknown) => {
	const requestOptions =
		body instanceof FormData
			? { method, body }
			: {
					method,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
			  };

	fetch(RouteBases.api + route, requestOptions);
};

export const deferUpdate = (): APIInteractionResponse => ({
	type: InteractionResponseType.DeferredMessageUpdate,
});

export const getOption = <
	T extends
		| string
		| number
		| boolean
		| APIApplicationCommandInteractionDataBasicOption[]
		| APIApplicationCommandInteractionDataSubcommandOption[],
	R extends boolean = false
>(
	options: APIApplicationCommandInteractionDataOption[] | undefined,
	name: string,
	hoist = false
): R extends true ? T : T | null => {
	let hoisted = options;

	if (hoist && hoisted) {
		if (hoisted[0]?.type === ApplicationCommandOptionType.SubcommandGroup)
			hoisted = hoisted[0].options ?? [];

		if (hoisted[0]?.type === ApplicationCommandOptionType.Subcommand)
			hoisted = hoisted[0].options ?? [];
	}

	const option = hoisted?.find((option) => option.name === name);

	return ((option && ('value' in option ? option.value : option.options)) ?? null) as R extends true
		? T
		: T | null;
};

export const getModalValue = (data: APIModalSubmission, name: string) => {
	const row = data.components.find(({ components }) => components[0].custom_id === name)!;

	return row.components[0].value;
};

export class Towers {
	static pathTierFromUpgradeSet = (upgradeSet: string): [number, number] => {
		const pathArr = [...upgradeSet];
		const sortedUpgrades = [...pathArr].sort();
		const tier = sortedUpgrades[2];
		const path = pathArr.findIndex((u) => u === tier) + 1;
		return [path, +tier];
	};

	static towerUpgradeFromTowerAndPathAndTier = (
		tower: keyof typeof BLOONOLOGY_TOWER_STATS,
		path: number,
		tier: number
	) => {
		if (isNaN(path)) throw new Error('Second argument `path` must be 1, 2, or 3');

		if (path < 1 || path > 3) throw new Error('Second argument `path` must be 1, 2, or 3');

		if (isNaN(tier))
			throw new Error('Third argument `tier` must be an integer between 0 and 5 inclusive');

		if (tier < 0 || tier > 5)
			throw new Error('Third argument `tier` must be an integer between 0 and 5 inclusive');

		const upgradeInt = tier * Math.pow(10, 3 - path);
		const upgradeStr = tier ? upgradeInt.toString().padStart(3, '0') : '222';

		return toTitleCase(
			UPGRADE_NAMES[tower][upgradeStr as keyof typeof UPGRADE_NAMES[typeof tower]],
			'_'
		);
	};

	static crossPathTierFromUpgradeSet = (upgradeSet: string): [number, number] => {
		const upgrades = upgradeSet.split('');
		const sortedUpgrades = [...upgrades].sort();
		const crossTier = sortedUpgrades[1];
		let crossPath = upgrades.findIndex((u) => u === crossTier) + 1;
		if (sortedUpgrades[1] === sortedUpgrades[2]) {
			upgrades[crossPath - 1] = '0';
			crossPath = upgrades.findIndex((u) => u === crossTier) + 1;
		}

		return [crossPath, +crossTier];
	};

	static totalTowerUpgradeCrosspathCost = (towerName: keyof typeof COSTS, upgrade: string) => {
		const [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
		const [crossPath, crossTier] = Towers.crossPathTierFromUpgradeSet(upgrade);
		const tower = COSTS[towerName];

		let totalCost = tower.cost;

		for (let i = 0; i < tier; i++) totalCost += tower.upgrades[path as ValidTowerPath][i];
		for (let i = 0; i < crossTier; i++) totalCost += tower.upgrades[crossPath as ValidTowerPath][i];

		return totalCost;
	};

	static totalTowerUpgradeCrosspathCostMult = (
		towerName: keyof typeof COSTS,
		upgrade: string,
		difficulty: keyof typeof PRICE_MULTIPLIER
	) => {
		const [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
		const [crossPath, crossTier] = Towers.crossPathTierFromUpgradeSet(upgrade);
		const tower = COSTS[towerName];

		let totalCost = Towers.difficultyPriceMult(tower.cost, difficulty);

		for (let i = 0; i < tier; i++)
			totalCost += Towers.difficultyPriceMult(
				tower.upgrades[path as ValidTowerPath][i],
				difficulty
			);

		for (let i = 0; i < crossTier; i++)
			totalCost += Towers.difficultyPriceMult(
				tower.upgrades[crossPath as ValidTowerPath][i],
				difficulty
			);

		return totalCost;
	};

	static difficultyPriceMult = (price: number, difficulty: keyof typeof PRICE_MULTIPLIER) =>
		Math.round((price * PRICE_MULTIPLIER[difficulty]) / 5) * 5;
}

const PRICE_MULTIPLIER = {
	EASY: 0.85,
	MEDIUM: 1,
	HARD: 1.08,
	IMPOPPABLE: 1.2,
} as const;

export const REPORT_BUG_BUTTON_ROW: APIActionRowComponent<APIMessageActionRowComponent> = {
	type: ComponentType.ActionRow,
	components: [
		{
			type: ComponentType.Button,
			style: ButtonStyle.Link,
			label: 'Report a bug',
			url: 'https://discord.gg/AtCA2ZMNng',
		},
	],
};

export const toTitleCase = (str: string, delim: string) =>
	str.replace(RegExp(`(?:^|${delim})(\\w)`, 'g'), (_, char) => ' ' + char.toUpperCase()).trim();

export const addNumberSeparator = (num: number) => {
	const digits = (Math.log(num) * Math.LOG10E + 1) | 0;
	return digits > 4 ? num.toLocaleString() : num.toString();
};

export const addHideOptions = (
	options: (APIApplicationCommandOption | APIApplicationCommandSubcommandOption)[]
) => {
	const hasSubcommand = options.filter(
		(int): int is APIApplicationCommandSubcommandOption =>
			int.type === ApplicationCommandOptionType.Subcommand ||
			int.type === ApplicationCommandOptionType.SubcommandGroup
	);

	if (hasSubcommand.length)
		hasSubcommand.forEach((option) => ((option.options ??= []), addHideOptions(option.options)));
	else
		options.push({
			name: 'hide',
			description: 'Whether to hide the response',
			choices: [{ name: 'Yes', value: 1 }],
			type: ApplicationCommandOptionType.Integer,
		});
};
