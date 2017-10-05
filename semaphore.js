'use strict';
'use exports {Semaphore, ExclusiveSemaphore, SharedSemaphor}';

const ERR_LOCKED = `Semaphore is already fully locked`;
class Semaphore {
  constructor() {}
  /**
   * Creates a controller to manually control locking & unlocking
   * the Semaphore.
   * 
   * @throws {Error} If the Semaphore is already fully locked.
   * 
   * @returns {{unlock:()=>void}
   */
  controller() {
    if (!this._lock()) {
      throw Error(ERR_LOCKED);
    }
    return Object.create(null, {
      unlock: {
        value: this._unlock.bind(this)
      }
    });
  }
  /**
   * Runs a block synchronously while locking the Semaphore.
   * 
   * @throws {Error} If the Semaphore is already fully locked.
   * @param {()=>any} block
   * @returns {any} the result of the block
   */
  sync(block) {
    if (!this._lock()) {
      throw Error(ERR_LOCKED);
    }
    try {
      return block();
    }
    finally {
      this._unlock(this);
    }
  }
  /**
   * Runs a block asynchronously while locking the Semaphore.
   * This always locks synchronously but unlocks asynchronously.
   * If the Semaphore cannot lock it queuest the block to execute
   * when the Semaphore has space to lock again.
   *
   * @param {()=>any} block
   * @returns {Promise<any>} the result of the block
   */
  async async(block) {
    if (!this._lock()) {
      await {
        then: (f, r) => {
          this._queue(f, r);
        }
      };
    }
    try {
      return await block();
    }
    finally {
      this._unlock(this);
    }
  }
}
class ExclusiveSemaphore extends Semaphore {
  constructor(limit = 1) {
    super();
    this._locked = 0;
    this._waiting = [];
    this._limit = limit;
  }
  _lock() {
    if (this._locked >= this._limit) {
      return false;
    }
    this._locked++;
    return true;
  }
  _unlock() {
    this._locked--;
    if (semaphore._waiting.length) {
      const next = semaphore._waiting.shift();
      next();
    }
  }
  _queue(f, r) {
    this._waiting.push(f);
  }
}
class SharedSemaphore extends Semaphore {
  // TODO: should limit be stored/validated in the SharedArrayBuffer?
  // Without write locks on the buffer I think not.
  constructor(
    sab = new Int32Array(new SharedArrayBuffer(4), 0, 1),
    limit = 1,
    waitTimeout = 16,
    pollTimeout = 16
  ) {
    super();
    this._sab = sab;
    this._limit = limit;
    this._wait = waitTimeout;
    this._poll = pollTimeout;
  }
  _lock() {
    while (true ) {
      const used = Atomics.load(this._sab, 0);
      if (used >= this._limit) {
        return false;
      }
      const beforeSwap = Atomics.compareExchange(this._sab, 0, used, used + 1);
      if (beforeSwap !== used) continue;
      else break;
    }
    return true;
  }
  _unlock() {
    while (true ) {
      const used = Atomics.load(this._sab, 0);
      if (used <= 0) {
        return false;
      }
      const beforeSwap = Atomics.compareExchange(this._sab, 0, used, used - 1);
      if (beforeSwap != used) continue;
      else break;
    }
    Atomics.wake(this._sab, 0, 1);
    return true;
  }
  _queue(f, r) {
    switch (Atomics.wait(this._sab, 0, this._limit, this._wait)) {
      default: break;
      case 'not-equal':
        if (this._lock()) {
          f();
          return;
        }
        break;
    }
    setTimeout(() => {
      this._queue(f, r);
    }, this._poll);
  }
}
Object.setPrototypeOf(Semaphore.prototype, null);
Object.freeze(Semaphore.prototype);
Object.freeze(Semaphore);
// Object.setPrototypeOf(ExclusiveSemaphore.prototype, null);
Object.freeze(ExclusiveSemaphore.prototype);
Object.freeze(ExclusiveSemaphore);
// Object.setPrototypeOf(SharedSemaphore.prototype, null);
Object.freeze(SharedSemaphore.prototype);
Object.freeze(SharedSemaphore);

exports.Semaphore = Semaphore;
exports.ExclusiveSemaphore = ExclusiveSemaphore;
exports.SharedSemaphore = SharedSemaphore;
// Object.freeze(module);
Object.freeze(exports);
