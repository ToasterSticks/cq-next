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
	round extends boolean = false
>(
	options: APIApplicationCommandInteractionDataOption[] | undefined,
	name: string,
	hoist = false
): round extends true ? T : T | null => {
	let hoisted = options;

	if (hoist && hoisted) {
		if (hoisted[0]?.type === ApplicationCommandOptionType.SubcommandGroup)
			hoisted = hoisted[0].options ?? [];

		if (hoisted[0]?.type === ApplicationCommandOptionType.Subcommand)
			hoisted = hoisted[0].options ?? [];
	}

	const option = hoisted?.find((option) => option.name === name);

	return ((option && ('value' in option ? option.value : option.options)) ??
		null) as round extends true ? T : T | null;
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

export class Enemies {
	static getHealthRamping = (round: number) => {
		let v;

		if (round <= 80) v = 1;
		else if (round <= 100) v = (round - 30) / 50;
		else if (round <= 124) v = (round - 72) / 20;
		else if (round <= 150) v = (3 * round - 320) / 20;
		else if (round <= 250) v = (7 * round - 920) / 20;
		else if (round <= 300) v = round - 208.5;
		else if (round <= 400) v = (3 * round - 717) / 2;
		else if (round <= 500) v = (5 * round - 1517) / 2;
		else v = 5 * round - 2008.5;

		return roundDec(v, 2);
	};

	static getSpeedRamping = (round: number) => {
		let v;

		if (round <= 80) v = 1;
		else if (round <= 100) v = 1 + (round - 80) * 0.02;
		else if (round <= 150) v = 1.6 + (round - 101) * 0.02;
		else if (round <= 200) v = 3.0 + (round - 151) * 0.02;
		else if (round <= 250) v = 4.5 + (round - 201) * 0.02;
		else v = 6.0 + (round - 252) * 0.02;

		return roundDec(v, 2);
	};
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

export const roundDec = (num: number, precision: number) => {
	const factor = 10 ** precision;
	return Math.round((num + Number.EPSILON) * factor) / factor;
};

const mapBigrams = (str: string) => {
	const bigrams: Record<string, number> = {};
	for (let i = 0; i < str.length - 1; i++) {
		const bigram = str.slice(i, i + 2);
		const count = bigrams[bigram] ?? 0;
		bigrams[bigram] = count + 1;
	}
	return bigrams;
};

const countCommonBigrams = (bigrams: Record<string, number>, str: string) => {
	let count = 0;
	for (let i = 0; i < str.length - 1; i++) {
		const bigram = str.substring(i, i + 2);
		if (bigrams[bigram]) count++;
	}
	return count;
};

export const diceCoefficient = (stringA: string, stringB: string) => {
	if (stringA === stringB) return 1;
	else if (stringA.length < 2 || stringB.length < 2) return 0;
	const bigramsA = mapBigrams(stringA);

	const lengthA = stringA.length - 1;
	const lengthB = stringB.length - 1;

	const dice = (2 * countCommonBigrams(bigramsA, stringB)) / (lengthA + lengthB);

	return dice;
};

export const bestMatch = <T extends string>(str: string, arr: T[]): T => {
	const ratings = [];
	let bestMatchIndex = 0;

	for (let i = 0; i < arr.length; i++) {
		const currentTargetString = arr[i];
		const currentRating = diceCoefficient(str, currentTargetString);
		ratings.push(currentRating);

		if (currentRating > ratings[bestMatchIndex]) bestMatchIndex = i;
	}

	return arr[bestMatchIndex];
};
