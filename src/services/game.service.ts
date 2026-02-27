import { rawAnimals, rawActions, rawObjects, rawProfessions, rawMovies } from "../game/constants";

type Domain = "Beasts" | "Rituals" | "Artifacts" | "Guilds & Personas" | "Illusions";

type Circle = "Novice" | "Adept" | "Master";

interface IScripture {
	domain: Domain;
	circle: Circle;
	concepts: readonly string[];
}

interface IEnigma {
	readonly enigmaId: string;
	readonly concept: string;
	readonly domain: Domain;
	readonly circle: Circle;
}

type Grimoire = Record<Domain, IEnigma[]>;

function consecrateGrimoire(scriptures: IScripture[]): Grimoire {
	const grimoire: Grimoire = {
		Beasts: [],
		Rituals: [],
		Artifacts: [],
		"Guilds & Personas": [],
		Illusions: [],
	};

	let runeSequence = 1;

	scriptures.forEach((scroll) => {
		const enigmas: IEnigma[] = scroll.concepts.map((rawText) => ({
			enigmaId: `rune_${runeSequence++}`,
			concept: rawText.trim(),
			domain: scroll.domain,
			circle: scroll.circle,
		}));

		if (grimoire[scroll.domain]) {
			grimoire[scroll.domain].push(...enigmas);
		}
	});

	return grimoire;
}

function divineProphecies(grimoire: Grimoire, count: number): string[] {
	const domains = Object.keys(grimoire) as Domain[];

	const selectedDomains: Domain[] = [];

	while (selectedDomains.length < count) {
		const randomDomain = domains[Math.floor(Math.random() * domains.length)];

		if (randomDomain && !selectedDomains.includes(randomDomain)) {
			selectedDomains.push(randomDomain);
		}
	}

	const prophecies = selectedDomains.map((domain) => {
		const list = grimoire[domain];

		const randomEnigmaIndex = Math.floor(Math.random() * list.length);

		return list[randomEnigmaIndex]?.concept as string;
	});

	return prophecies;
}

const ancientScriptures: IScripture[] = [
	{ domain: "Beasts", circle: "Novice", concepts: rawAnimals },
	{ domain: "Rituals", circle: "Novice", concepts: rawActions },
	{ domain: "Artifacts", circle: "Adept", concepts: rawObjects },
	{ domain: "Guilds & Personas", circle: "Adept", concepts: rawProfessions },
	{ domain: "Illusions", circle: "Master", concepts: rawMovies },
];

const PRIMORDIAL_GRIMOIRE = consecrateGrimoire(ancientScriptures);

function summonProphecies(count: number = 3): string[] {
	return divineProphecies(PRIMORDIAL_GRIMOIRE, count);
}

export default {
	summonProphecies,
};
