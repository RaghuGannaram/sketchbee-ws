import type { JwtPayload } from "jsonwebtoken";
import type { IAuthUser } from "./auth.types";

export interface ITokenPayload extends JwtPayload {
	profile: IAuthUser;
}
