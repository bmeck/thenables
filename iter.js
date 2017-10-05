'use strict';
/**
 * @callback iterSetupCallback
 * @param {Function} onValue
 * @param {Function} onDone
 * @returns void
 */

/**
 * @description creates a thenable meant for iteration, each iteration retuns a {done,value} object.
 * @param {iterSetupCallback} setup
 * @returns void
 * @example
 *  let ee = new EventEmitter();
 *  let stream = toStream((onvalue, ondone) => {
 *    ee.addListener('data', onvalue);
 *    ee.once('close', value => {
 *      ee.removeListener('data', onvalue);
 *      ondone(value);
 *    });
 *  });
 *  setTimeout(()=>ee.emit('data', 666),10)
 *  setTimeout(()=>ee.emit('close', 777),20)

 *  ;(async () => {
 *    let done, value;
 *    while ({done, value} = await stream, !done) {
 *      console.log(value);
 *    }
 *    console.log('done', value)
 *  })();
 */
const Iter = (setup) => {
  let errored = false;
  let error;
  let done = false;
  let value_queue = [];
  let await_queue = [];
  let error_cb = err => {
    done = true;
    value_queue.length = 0;
    if (await_queue.length) {
      let [f, r] = await_queue.shift();
      r(err);
      while (await_queue.length) {
        value_cb(undefined);
      }
    }
    else {
      errored = true;
      error = err;
    }
  };
  let value_cb = value => {
    if (await_queue.length) {
      let [f] = await_queue.shift();
      f({value, done});
    } else {
      value_queue.push({value, done});
    }
  };
  let done_cb = value => {
    done = true;
    value_cb(value);
  };
  setup(value_cb, done_cb, error_cb);
  return {
    then(f, r) {
      if (errored) {
        errored = false;
        await_queue.push([f, r]);
        error_cb(error);
      } else if (value_queue.length) {
        let value = value_queue.shift();
        f(value);
      } else if (done) {
        f({
          value: undefined,
          done
        });
      } else {
        await_queue.push([f, r]);
      }
    }
  };
};
exports.Iter = Iter;
exports.fromReadStream = stream => {
  return Iter((onvalue, ondone, onerror) => {
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
};
