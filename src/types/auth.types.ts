export enum Theme {
	LIGHT = "light",
	DARK = "dark",
	SYSTEM = "system",
}

export interface IRegistration {
	email: string;
	username: string;
	password: string;
}

export interface ILogin {
	email: string;
	password: string;
}

export interface ISettings {
	autoplay?: boolean;
	theme?: Theme;
}

export interface IAuthUser {
	id: string;
	email: string;
	username: string;
	authProvider: string;
	avatarUrl: string;
	verified: boolean;
	premium: boolean;
	role: string;
	settings: ISettings;
	createdAt: string;
	lastLoginAt?: string;
}
