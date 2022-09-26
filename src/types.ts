import type { APIEmbed } from 'discord-api-types/v10';

declare global {
	const CLIENT_ID: string;
	const CLIENT_SECRET: string;
	const PUBLIC_KEY: string;
}

interface FullTagData {
	keywords?: string[];
	content: string;
	embeds: APIEmbed[];
}

export type TagData = FullTagData | Omit<FullTagData, 'embeds'> | Omit<FullTagData, 'content'>;

export type ValidTowerPath = 1 | 2 | 3;

export type WithRequiredProp<T, P extends keyof T> = T & Required<Pick<T, P>>;

export type SetType<T> = T extends Set<infer G> ? G : never;

interface Tower {
	name: string;
	upgrade: string;
}

interface Hyperlink {
	text: string;
	url: string;
}

export enum States {
	Unknown,
	Alive,
	Dead,
}

export interface TwoTCEntry {
	tower_1: Tower;
	tower_2: Tower;
	map: string;
	version: string;
	date: number;
	player: string;
	link: Hyperlink;
	notes: string[];
	state: States;
}

export interface TwoMPCEntry {
	tower: Tower;
	map: string;
	version: string;
	date: number;
	player: string;
	link: Hyperlink;
	notes: string[];
}

export interface LCCEntry {
	map: string;
	cost: string;
	version: string;
	date: number;
	player: string;
	link: Hyperlink;
	state: States;
}
