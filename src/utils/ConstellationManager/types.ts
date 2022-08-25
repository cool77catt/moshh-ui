export type BinValueType = [number, number, number];

export class HorizontalBin {
  #hBin: Map<number, BinValueType[]>;

  constructor() {
    this.#hBin = new Map<number, BinValueType[]>();
  }

  getMap() {
    return this.#hBin;
  }

  has(key: number) {
    return this.#hBin.has(key);
  }

  get(key: number) {
    return this.#hBin.get(key);
  }

  add(key: number, value: BinValueType) {
    if (this.has(key)) {
      this.get(key)!.push(value);
    } else {
      this.#hBin.set(key, [value]);
    }
  }
}

export type VerticalBinKeyType = [number, number];

export class VerticalBin {
  /*
   * Class to handle the vertical bins Because the vertical bin keys are an array,
   * and the map class doesn't handle === with the array well, we must stringify the
   * array so it can be used for comparison
   */
  #vBin: Map<string, BinValueType[]>;
  #origKeys: Map<string, VerticalBinKeyType>;

  constructor() {
    this.#vBin = new Map<string, BinValueType[]>();
    this.#origKeys = new Map<string, VerticalBinKeyType>();
  }

  getMap() {
    let res = new Map<VerticalBinKeyType, BinValueType[]>();
    this.#vBin.forEach((val, key) => {
      res.set(this.#origKeys.get(key)!, val);
    });
    return res;
  }

  has(key: VerticalBinKeyType) {
    return this.#vBin.has(JSON.stringify(key));
  }

  get(key: VerticalBinKeyType) {
    return this.#vBin.get(JSON.stringify(key));
  }

  add(key: VerticalBinKeyType, value: BinValueType) {
    if (this.has(key)) {
      this.get(key)!.push(value);
    } else {
      const keyStr = JSON.stringify(key);
      this.#vBin.set(keyStr, [value]);
      this.#origKeys.set(keyStr, key);
    }
  }
}

export type Constellation = Map<number, number[]>;

export type ConstellationInfo = {
  rate: number;
  constellation: Constellation;
};
