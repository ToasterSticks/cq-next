import type { TagData } from '../../types';

export const tags: Record<string, TagData> = {
	vtsg: {
		keywords: ['vengeful', 'dark temple'],
		content:
			'555 super monkey has the following buffs compared to a TSG (use q!temple):\n• sunblast buffed: +25d\nall other attacks (including subtowers) buffed: ×2d (applied after additive buffs)\n',
	},

	woor: {
		keywords: ['wiggle'],
		content:
			"**woor** (short for _wiggle out of range_) is an ace micro technique discovered by e_to_the_pi_i. it basically makes your ace fly away from the pad in a straight line as far as more than twice the radius of figure circle without the need of centered path. https://youtu.be/o5muYjZRAsc is an example of a woor. more interestingly, the woor works in every single direction as long as the user errorn't controls it correctly.\nhow it works: by alternating between tab and reverse tab in a consistent rhythm, you make the ace turn left and right and repeat, allowing it to move forward\n",
	},

	'golden-bloon': {
		keywords: ['golden', 'gbloon'],
		content:
			'This bloon does not have a certain HP value, but is popped after a certain number of hits. After each hit, it will enter a grace period, where it gets flown to a spot closer or further from the exit, and it speeds up. It is immune to all attacks during this period.\nGolden bloons start spawning on round 21 - 30, and in one round per block of 10 rounds. it always spawns at the start of the round.\nGolden bloons cannot spawn after you reach the victory screen. As the rounds get higher, the golden bloon will evolve, gaining more immunities and properties:\n```\nR21 - 30: Normal\nR31 - 40: Camo\nR41 - 50: Lead\nR51 - 60: Camo Lead\nR61 - 70: Camo Lead Fortified\nR71 - 80: Camo Lead Purple Fortified\nR81 -100: Camo Lead Purple Zebra Fortified\n```\n\nWhen popped, you gain extra Monkey Money based on the map difficulty:\n```\n             | normal | fortified\n    Beginner |      2 |         4\nIntermediate |      3 |         6\n    Advanced |      4 |         8\n      Expert |      5 |        10```\n',
	},

	feet: {
		keywords: ['foot'],
		content: 'https://youtu.be/vmjeHHm1pD4',
	},

	vrej: {
		keywords: ['bruh'],
		content: 'https://www.youtube.com/watch?v=PWkgMCtbnkM&',
	},

	aqoa: {
		keywords: ['annulling quantum ouroboric annulet', 'ace lock in place'],
		content:
			'**aqoa** (short for _annulling quantum ouroboric annulet_) is an ace micro technique made by `無名#1337` that essentially locks your plane in place.\nA demonstration can be shown at: https://youtu.be/0S0933s3m1s?t=63\n',
	},

	'cave-monkey': {
		keywords: ['cave'],
		embeds: [
			{
				title: 'Cave Monkey',
				description:
					'24r\n  _bonk_- 1d, 5p, 1.1s, normal\n  - stuns bloons for 1s\n  - stuns moabs for 0.25s\n\nFrozen Over map only\nrequires 30 mortar shots (no matter the damage) to be freed from the ice\nreceives tier 0 overclock benefits\n',
				footer: { text: '{credits}' },
			},
		],
	},
};
