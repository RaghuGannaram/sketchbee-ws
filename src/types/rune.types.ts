export interface ISigil {
    start: { x: number; y: number };
    end: { x: number; y: number };
    tip: "etch" | "rub";
    gauge: number;
    pigment: string;
}
