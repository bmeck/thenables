# thenables

There is no index/main file. Grab the utilities as needed.

**DO NOT** return thenables from async functions as they will be turned into regular Promises.

# iter

A thenable which is inteded to have multiple values and a done condition.

## iter.Iter

A flexible way to generate an iter.

```js
const fs = require('fs');
const iter = require('./iter');
;(async () => {
  const ee = fs.createReadStream(process.argv[2]);
  const stream = iter.Iter((onvalue, ondone, onerror) => {
    stream.on('data', onvalue);
    stream.on('error', (err) => {
      stream.removeListener('data', onvalue);
      stream.removeListener('done', ondone);
      onerror(err);
    });
    stream.on('close', (value) => {
      stream.removeListener('data', onvalue);
      stream.removeListener('error', onerror);
      ondone(value);
    });
  });
  let value, done;
  let buffered = [];
  while({value, done} = await stream, !done) {
    buffered.push(value);
  }
  const body = require('buffer').Buffer.concat(buffered);
  console.log(body.toString());
})();
```

## iter.fromReadStream

Simplifies read stream consumption.

```js
const fs = require('fs');
const iter = require('./iter');
;(async () => {
  const ee = fs.createReadStream(process.argv[2]);
  const stream = iter.fromReadStream(ee);
  let value, done;
  let buffered = [];
  while({value, done} = await stream, !done) {
    buffered.push(value);
  }
  const body = require('buffer').Buffer.concat(buffered);
  console.log(body.toString());
})();
```

# semaphore

## semaphore.ExclusiveSemaphore

The most general use Semaphore, it expects to stay in the same thread.

```js
const ExclusiveSemaphore = require('./semaphore').ExclusiveSemaphore;
const semaphore = new ExclusiveSemaphore(+process.argv[2] || 1);
;(async () => {
  let {unlock} = await semaphore;
  console.log('start: A');
  await {
    then: f => setTimeout(f, 1000)
  }
  console.log('close: A');
  unlock();
})();
```