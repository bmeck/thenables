'use strict';

const fs = require('fs');
const iter = require('../iter');
;(async () => {
  const ee = fs.createReadStream(process.argv[2] || __filename);
  const stream = iter.fromReadStream(ee);
  let value, done;
  let buffered = [];
  while({value, done} = await stream, !done) {
    buffered.push(value);
  }
  const body = require('buffer').Buffer.concat(buffered);
  console.log(body.toString());
})();
