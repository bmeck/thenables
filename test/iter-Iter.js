'use strict';
const assert = require('assert');

const EventEmitter = require('events').EventEmitter;
const iter = require('../iter');

;(async () => {
  let exit = 1;
  try {
    const ee = new EventEmitter;
    const stream = iter.Iter((onvalue, ondone) => {
      ee.on('value', onvalue);
      ee.once('done', (value) => {
        ee.removeListener('value', onvalue);
        ondone(value);
      });
    });
    ee.emit('value', 1);
    ee.emit('value', 2);
    ee.emit('done', 4);
    assert.deepStrictEqual(await stream, {done: false, value: 1});
    assert.deepStrictEqual(await stream, {done: false, value: 2});
    assert.deepStrictEqual(await stream, {done: true,  value: 4});
    exit = 0;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    process.exit(exit);
  }
})();
