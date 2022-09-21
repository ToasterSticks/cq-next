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
