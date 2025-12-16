import { Rites, type IChamber } from "@src/types/chamber.types";

export interface IOracle {
    ok: boolean;
    message: string;
    rite: Rites;
    chamber: IChamber;
    terminus?: number;
    timer?: {
        duration: number;
        callback: () => void;
    };
}
