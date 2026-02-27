export enum Theme {
	LIGHT = "light",
	DARK = "dark",
	SYSTEM = "system",
}

export interface IRegistration {
	email: string;
	handle: string;
	password: string;
}

export interface ILogin {
	email: string;
	password: string;
}

export interface ISettings {
	theme?: Theme;
}

export interface IUser {
	id: string;
	fullname: string;
	handle: string;
	email: string;
	password: string;
	avatar: string;
	background: string;
	bio: string;
	city: string;
	from: string;
	role: "user" | "moderator" | "admin";
	friends: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface IAuthUser {
	id: string;
	fullname: string;
	handle: string;
	role: string;
}
