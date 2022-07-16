
export class Dice {
    public sides: DiceSide[];

    constructor() {
        /**
         * @type {DiceSide[]}
         */
        this.sides = [];
    }

    loadSide(sideIndex: integer) {
        // this.sides.forEach(side => side.weight = 1);
        this.sides[sideIndex].weight += 1;
    }

    static create(sides: string) {
        const result = new Dice();

        result.sides = sides.split('').map(sideType => DiceSide.create(sideType as Suit));
        return result;
    }
}

export type Suit = "S" | "H" | "L" | "B";

export class DiceSide {
    public suit: string = ''; // S=Sword, H=Shield, L=Love, B=Book
    public weight: number = 1;

    constructor() {
    }

    static create(suit: Suit) {
        const result = new DiceSide();

        result.suit = suit;
        return result;
    }
}