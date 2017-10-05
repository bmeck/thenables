'use strict';
const assert = require('assert');

const EventEmitter = require('events').EventEmitter;
const iter = require('../iter');
const fs = require('fs');
const path = require('path');

;(async () => {
  let exit = 1;
  try {
    const ee = fs.createReadStream(path.join(__filename, 'enoent'));
    const stream = iter.fromReadStream(ee);
    try {
      await stream;
    }
    catch (e) {
      assert.strictEqual(e.code, 'ENOTDIR');
      exit = 0;
    }
  }
  catch (e) {
    console.error(e);
  }
  finally {
    process.exit(exit);
  }
})();
