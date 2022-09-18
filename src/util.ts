import {
	InteractionResponseType,
	RouteBases,
	type APIApplicationCommandInteractionDataBasicOption,
	type APIApplicationCommandInteractionDataOption,
	type APIApplicationCommandInteractionDataSubcommandOption,
	type APIInteractionResponse,
	type APIModalSubmission,
} from 'discord-api-types/v10';

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
		| APIApplicationCommandInteractionDataSubcommandOption[]
>(
	options: APIApplicationCommandInteractionDataOption[] | undefined,
	name: string
): T | undefined => {
	const option = options?.find((option) => option.name === name);

	return option && (('value' in option ? option.value : option.options) as T);
};

export const getModalValue = (data: APIModalSubmission, name: string) => {
	const row = data.components?.find(({ components }) => components[0].custom_id === name);

	return row?.components[0].value;
};
