// @ts-check

import MersenneTwister from 'mersenne-twister';

class NormalDistribution {
  /**
   * @param {RandomGen} random 
   * @param {number} mean 
   * @param {number} deviation 
   */
  constructor(random, mean, deviation = 1) {
    this._random = random;
    this._mean = mean;
    this._deviation = deviation;

    this._spare = null;
  }

  /**
   * @returns {number}
   */
  value() {
    let x = this._spare;
    this._spare = null;

    if (x === null) {
      // The Marsaglia Polar method
      let u, v, s;

      do {
        // U and V are from the uniform distribution on (-1, 1)
        u = this._random.random() * 2 - 1;
        v = this._random.random() * 2 - 1;
    
        s = u * u + v * v;
      } while (s >= 1 || s == 0);

      s = Math.sqrt(-2 * Math.log(s) / s);

      this._spare = v * s;
      x = u * s;
    }
  
    // Shape and scale
    return this._deviation * x + this._mean;
  }  
}

class RandomGen {
  constructor(seed = 0) {
    this._mt = new MersenneTwister(seed);
  }

  derive() {
    return new RandomGen(
      this.integer(0, 1024)
    );
  }

  normalDistribution(mean, deviation = 1) {
    return new NormalDistribution(this, mean, deviation);
  }

  bool() {
    return Math.round(this._mt.random()) === 1;
  }

  /**
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  integer(min, max) {
    const diff = max - min;
    return min + Math.round(diff * this._mt.random());
  }

  /**
   * @returns {number}
   */
  random() {
    return this._mt.random();
  }
}

export {
  RandomGen
}