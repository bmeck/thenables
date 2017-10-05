'use strict';

const fs = require('fs');
const iter = require('../iter');
const semaphore = require('../semaphore');

const workers = +process.argv[2] || 1;

const concurrency = new semaphore.ExclusiveSemaphore(workers);

// new data ever 0.5s
const stream = iter.Iter((onvalue, ondone, onerror) => {
  // should produce 5 values 3s time
  const interval = setInterval(()=>onvalue(new Date()), 500);
  setTimeout(() => {
    clearInterval(interval);
    ondone();
  }, 3 * 1000);
});

// simple worker factory loop
for (let i = 0; i < workers; i++) {
  ;(async () => {
    let value, done, unlock;
    while (
      {unlock} = await concurrency,
      {value, done} = await stream,
      !done
    ) {
      try {
        console.log(`start: ${value}`)
        // 2s processing time
        await {
          then: f => setTimeout(f, 2000)
        };
        console.log(`close: ${value}`)
      }
      finally {
        unlock();
      }
    }
    console.log(`CLOSING WORKER ${i}`);
  })();
}