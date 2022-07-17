


// =Blank, S=Sword, H=Shield, M=Morale, B=Book, V=Venom, F=Fast
export type Suit = " " | "S" | "H" | "M" | "B" | "V" | "F";
export type SidesString = string;
export type DiceDefinition = {
    sides: SidesString,
    color: number,
    desc: string,
};

export class Dice {
    public sides: DiceSide[] = [];
    public color: number = 0xffffff;
    public desc: string = '';

    constructor() {
    }

    loadSide(sideIndex: number) {
        // this.sides.forEach(side => side.weight = 1);
        this.sides[sideIndex].weight += 1;
    }

    static create(sides: string, color: number, desc: string = '') {
        const result = new Dice();

        result.sides = sides.split('').map(sideType => DiceSide.create(sideType as Suit));
        result.color = color;
        result.desc = desc;

        return result;
    }
    static diceDefinitions: { [x: string]: DiceDefinition } = {
        /* cSpell:disable */
        WHITE: { sides: 'SSSHHM', color: 0xffffff, desc: 'Balanced basic dice' },
        BLUE: { sides: 'SSHHHM', color: 0xffffff, desc: 'Defense dice' },
        RED: { sides: 'SSSSHH', color: 0xffffff, desc: 'Offense dice' },
        GREEN: { sides: 'VBSMM ', color: 0xffffff, desc: 'Poison dice' },
        AQUA: { sides: 'FFSSMM', color: 0xffffff, desc: 'Speed dice' },
        YELLOW: { sides: 'MMSHH ', color: 0xffffff, desc: 'Morale dice' },
        PURPLE: { sides: 'BBHMMM', color: 0xffffff, desc: 'Knowledge dice' },
        /* cSpell:enable */
    }

    static diceDistribution = [
        { WHITE: 5, BLUE: 2, RED: 2, GREEN: 0, AQUA: 0, YELLOW: 1, PURPLE: 0 },
        { WHITE: 1, BLUE: 4, RED: 4, GREEN: 1, AQUA: 2, YELLOW: 1, PURPLE: 1 },
        { WHITE: 0, BLUE: 2, RED: 2, GREEN: 3, AQUA: 3, YELLOW: 2, PURPLE: 3 },
    ];

    static getRandomDice(tier: number) {
        const name = Dice.getRandomDiceName(tier);
        if (name == null) return null;

        const def = Dice.diceDefinitions[name];
        return Dice.create(def.sides, def.color, def.desc)
    }

    static getRandomDiceName(tier: integer) {
        const dist = Dice.diceDistribution[tier];
        if (dist == null) return null;
        const weights = Object.entries(dist);

        const totalWeight = Object.values(dist).reduce((a, b) => a + b, 0);

        const diceThrow = Math.random() * totalWeight;
        let acc = 0;
        let index = -1;
        do {
            ++index;
            const [name, weight] = weights[index];
            acc += weight;
        } while (acc > diceThrow);

        const [name, weight] = weights[index];
        return name;

    }
}

export class DiceSide {
    public suit: string = '';
    public weight: number = 1;

    constructor() {
    }

    static create(suit: Suit) {
        const result = new DiceSide();

        result.suit = suit;
        return result;
    }
}