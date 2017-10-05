'use strict';

const ExclusiveSemaphore = require('../semaphore').ExclusiveSemaphore;
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
;(async () => {
  let {unlock} = await semaphore;
  console.log('start: B');
  await {
    then: f => setTimeout(f, 1000)
  }
  console.log('close: B');
  unlock();
})();
;(async () => {
  let {unlock} = await semaphore;
  console.log('start: C');
  await {
    then: f => setTimeout(f, 1000)
  }
  console.log('close: C');
  unlock();
})();
