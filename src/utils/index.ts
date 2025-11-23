import crypto from "crypto";

type Data = Record<string, any>;

function hideSensitiveInfo<T extends Data>(data: T, ...sensitiveInfo: (keyof T)[]): Partial<T> {
    let clone: Partial<T> = {};
    for (let key of Object.keys(data) as (keyof T)[]) {
        if (!sensitiveInfo.includes(key)) {
            clone[key] = data[key];
        }
    }
    return clone;
}

export default hideSensitiveInfo;

export function generateRandomName(length: number): string {
    return crypto.randomBytes(length).toString("hex");
}
