import MersenneTwister from 'mersenne-twister';

class RandomGen {
  constructor(seed = 0) {
    this._mt = new MersenneTwister(seed);
  }

  derive() {
    return new RandomGen(
      this.integer(0, 1024)
    );
  }

  bool() {
    return this._mt.bool();
  }

  integer(min, max) {
    const diff = max - min;
    return min + Math.round(diff * this._mt.random());
  }

  random() {
    return this._mt.random();
  }
}

export {
  RandomGen
}