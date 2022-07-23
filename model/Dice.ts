


// =Blank, S=Sword, H=Shield, M=Morale, B=Book, V=Venom, F=Fast, L=Bleed, A=Arrow
export enum Suit {
    S = "S",
    H = "H",
    M = "M",
    B = "B",
    A = "A",
    F = "F",
    V = "V",
    L = "L",
    _ = "_",
}
export type SidesString = string;
export enum DiceType {
    DICE = 0,
    BUFF = 1,
}

export type DiceData = DiceDefinition | BuffDefinition;
export type DiceDefinition = {
    icon: Suit,
    type: DiceType.DICE,
    sides: string,
    color: number,
    disabledColor: number,
    desc: string,
};
export type BuffDefinition = {
    icon: Suit,
    type: DiceType.BUFF,
    color: number,
    disabledColor: number,
    desc: string,
};

export type DiceState = {
    diceEnabled: boolean;
    sideId: number;
    diceData: DiceDefinition;
}

export class Dice {
    public symbol: string = '';
    public sides: DiceSide[] = [];
    public diceData: DiceDefinition;
    public diceEnabled = true;

    constructor() {
    }

    loadSide(sideIndex: number) {
        // this.sides.forEach(side => side.weight = 1);
        this.sides[sideIndex].weight += 1;
    }

    roll(): DiceState {
        const weights = Object.entries(this.sides.map(s => s.weight));

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
        return {
            diceData: this.diceData,
            diceEnabled: this.diceEnabled,
            sideId: Number(name),
        };
    }

    static create(symbol: string, diceData: DiceDefinition) {
        const result = new Dice();

        result.symbol = symbol;
        result.sides = diceData.sides.split('').map(sideType => DiceSide.create(sideType as Suit));
        result.diceData = diceData;

        return result;
    }
    static diceDefinitions: { [x: string]: DiceDefinition } = {
        /* cSpell:disable */
        WHITE: { icon: Suit.S, type: DiceType.DICE, sides: 'SSSHHM', color: 0xb1c6c7, disabledColor: 0x4a5959, desc: 'Balanced basic dice' },
        BLUE: { icon: Suit.H, type: DiceType.DICE, sides: 'HHHSSM', color: 0x4257f5, disabledColor: 0x2d367a, desc: 'Defense dice' },
        RED: { icon: Suit.S, type: DiceType.DICE, sides: 'SSSS__', color: 0xd11f19, disabledColor: 0x781d1a, desc: 'Offense dice' },
        GREEN: { icon: Suit.V, type: DiceType.DICE, sides: 'VBSMM_', color: 0x68d647, disabledColor: 0x265e15, desc: 'Poison dice' },
        AQUA: { icon: Suit.F, type: DiceType.DICE, sides: 'FFSSMM', color: 0x5fe8ed, disabledColor: 0x155457, desc: 'Speed dice' },
        YELLOW: { icon: Suit.M, type: DiceType.DICE, sides: 'MMSHH_', color: 0xf5dd53, disabledColor: 0x807222, desc: 'Morale dice' },
        PURPLE: { icon: Suit.B, type: DiceType.DICE, sides: 'BBHMMM', color: 0xc430e6, disabledColor: 0x590d6b, desc: 'Knowledge dice' },
        /* cSpell:enable */
    }

    static buffDefinitions: { [x: string]: BuffDefinition } = {
        SWORD: { icon: Suit.S, type: DiceType.BUFF, color: 0x474747, disabledColor: 0, desc: 'Sword Buff' },
        SHIELD: { icon: Suit.H, type: DiceType.BUFF, color: 0x474747, disabledColor: 0, desc: 'Shield Buff' },
        ARROW: { icon: Suit.A, type: DiceType.BUFF, color: 0x474747, disabledColor: 0, desc: 'Arrow Buff' },
        VENOM: { icon: Suit.V, type: DiceType.BUFF, color: 0x68d647, disabledColor: 0, desc: 'Venom Debuff' },
        BLEED: { icon: Suit.L, type: DiceType.BUFF, color: 0xd32868, disabledColor: 0, desc: 'Bleed Debuff' }, // c91853 or d32868
    };

    static diceDistribution = [
        { WHITE: 5, BLUE: 2, RED: 2, GREEN: 0, AQUA: 0, YELLOW: 1 },
        { WHITE: 1, BLUE: 4, RED: 4, GREEN: 1, AQUA: 2, YELLOW: 1, PURPLE: 1 },
        { WHITE: 0, BLUE: 2, RED: 2, GREEN: 3, AQUA: 3, YELLOW: 2, PURPLE: 3 },
    ];

    static selfTestDefinitions() {
        let fails = Object.entries(Dice.diceDefinitions)
            .filter(([key, diceData]) => {
                return !(
                    diceData.sides.length === 6 &&
                    (diceData.sides.split('')
                        .every(s => Object.values(Suit).includes(s as Suit)))
                );
            }).map(([key, diceData]) => {
                console.error(`Syntax error for DiceDefinition "${key}": Sides "${diceData.sides}"`);
                return true;
            });
        if (fails.length > 0) return false;


        fails = Object.entries(Dice.diceDistribution)
            .filter(([key, row]) => {
                return !(true
                    && Object.keys(row).every(r => Object.keys(Dice.diceDefinitions).includes(r))
                    // && Object.keys(Dice.diceDefinitions).every(r => Object.keys(row).includes(r))
                );
            }).map(([key, row]) => {
                console.error(`Syntax error for Dice Distribution "${key}": Row "${Object.keys(row).join(', ')}" must contain valid Dice Name.`);
                return true;
            });
        if (fails.length > 0) return false;

        return true;
    }

    static getRandomDice(tier: number) {
        const name = Dice.getRandomDiceName(tier);

        const def = Dice.diceDefinitions[name];
        return Dice.create(name[0], def);
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
    public suit: Suit = Suit._;
    public weight: number = 1;

    static spriteKey = {
        "_": '', //  =Blank
        "S": 'sword', // S=Sword
        "H": 'shield', // H=Shield
        "M": 'structure_tower', // M=Morale
        "B": 'book_open', // B=Book
        "V": 'skull', // V=Venom
        "F": 'fastForward', // F=Fast
        "L": 'bleed', // L=Bleed
        "A": 'bow', // A=Arrow
    };

    static suitColor = {
        [DiceType.DICE]: 0x444444,
        [DiceType.BUFF]: 0xffffff,
    };

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
            "_": 0, //  =Blank
            "S": 0, // S=Sword
            "H": 0, // H=Shield
            "M": 0, // M=Morale
            "B": 0, // B=Book
            "V": 0, // V=Venom
            "F": 0, // F=Fast
            "L": 0, // L=Bleed
            "A": 0, // A=Arrow
        };
    }
    static create(rolls: DiceState[]) {
        const result = new RollsStats();

        for (const roll of rolls) {
            const suit = RollsStats.getRollSuit(roll);
            result.suitCount[suit]++;
        }

        return result;
    }

    static getRollSuits(rolls: DiceState[]) {
        return rolls.map(({ sideId, diceData }) => diceData.sides[sideId] as Suit);
    }

    static getRollSuit({ sideId, diceData }: DiceState) {
        return diceData.sides[sideId] as Suit;
    }
}