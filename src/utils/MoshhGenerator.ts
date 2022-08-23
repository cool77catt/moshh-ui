export class MoshhGenerator {
  static #instance: MoshhGenerator | undefined;

  static getInstance() {
    return this.#instance;
  }

  static async configure() {
    if (!this.#instance) {
      this.#instance = new MoshhGenerator();
    }

    return this.getInstance();
  }
}
