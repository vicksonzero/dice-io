


// =Blank, S=Sword, H=Shield, M=Morale, B=Book, V=Venom, F=Fast
export type Suit = " " | "S" | "H" | "M" | "B" | "V" | "F";
export type SidesString = string;
export type DiceDefinition = {
    sides: SidesString,
    color: number,
    desc: string,
};

export class Dice {
    public symbol: string = '';
    public sides: DiceSide[] = [];
    public color: number = 0xffffff;
    public desc: string = '';

    constructor() {
    }

    loadSide(sideIndex: number) {
        // this.sides.forEach(side => side.weight = 1);
        this.sides[sideIndex].weight += 1;
    }

    roll() {

        const weights = Object.entries({ 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 });

        const totalWeight = 6;

        const roll = Math.random() * totalWeight;
        let acc = 0;
        let index = -1;
        do {
            ++index;
            const [name, weight] = weights[index];
            acc += weight;
        } while (!(roll < acc) && index + 1 < weights.length);

        // console.log(diceThrow.toFixed(1), totalWeight, index);

        const [name, weight] = weights[index];
        return this.sides[Number(name)];
    }

    static create(symbol: string, sides: string, color: number, desc: string = '') {
        const result = new Dice();

        result.symbol = symbol;
        result.sides = sides.split('').map(sideType => DiceSide.create(sideType as Suit));
        result.color = color;
        result.desc = desc;

        return result;
    }
    static diceDefinitions: { [x: string]: DiceDefinition } = {
        /* cSpell:disable */
        WHITE: { sides: 'SSSHHM', color: 0xb1c6c7, desc: 'Balanced basic dice' },
        BLUE: { sides: 'HHHSSM', color: 0x4257f5, desc: 'Defense dice' },
        RED: { sides: 'SSSS  ', color: 0xd11f19, desc: 'Offense dice' },
        GREEN: { sides: 'VBSMM ', color: 0x68d647, desc: 'Poison dice' },
        AQUA: { sides: 'FFSSMM', color: 0x5fe8ed, desc: 'Speed dice' },
        YELLOW: { sides: 'MMSHH ', color: 0xf5dd53, desc: 'Morale dice' },
        PURPLE: { sides: 'BBHMMM', color: 0xc430e6, desc: 'Knowledge dice' },
        /* cSpell:enable */
    }

    static diceDistribution = [
        { WHITE: 5, BLUE: 2, RED: 2, GREEN: 0, AQUA: 0, YELLOW: 1, PURPLE: 0 },
        { WHITE: 1, BLUE: 4, RED: 4, GREEN: 1, AQUA: 2, YELLOW: 1, PURPLE: 1 },
        { WHITE: 0, BLUE: 2, RED: 2, GREEN: 3, AQUA: 3, YELLOW: 2, PURPLE: 3 },
    ];

    static getRandomDice(tier: number) {
        const name = Dice.getRandomDiceName(tier);

        const def = Dice.diceDefinitions[name];
        return Dice.create(name[0], def.sides, def.color, def.desc)
    }

    static getRandomDiceName(tier: integer) {
        let dist = Dice.diceDistribution[tier] ?? Dice.diceDistribution[Dice.diceDistribution.length - 1];

        const weights = Object.entries(dist);

        const totalWeight = Object.values(dist).reduce((a, b) => a + b, 0);

        const roll = Math.random() * totalWeight;
        let acc = 0;
        let index = -1;
        do {
            ++index;
            const [name, weight] = weights[index];
            acc += weight;
        } while (!(roll < acc) && index + 1 < weights.length);

        // console.log(diceThrow.toFixed(1), totalWeight, index);

        const [name, weight] = weights[index];
        return name;
    }
}

export class DiceSide {
    public suit: Suit = ' ';
    public weight: number = 1;

    constructor() {
    }

    static create(suit: Suit) {
        const result = new DiceSide();

        result.suit = suit;
        return result;
    }
}

export class RollsStats {
    public suitCount: { [x in Suit]: number };

    constructor() {
        this.suitCount = {
            " ": 0, //  =Blank
            "S": 0, // S=Sword
            "H": 0, // H=Shield
            "M": 0, // M=Morale
            "B": 0, // B=Book
            "V": 0, // V=Venom
            "F": 0, // F=Fast
        };
    }
    static create(rolls: DiceSide[]) {
        const result = new RollsStats();

        for (const side of rolls) {
            result.suitCount[side.suit]++;
        }

        return result;
    }
}