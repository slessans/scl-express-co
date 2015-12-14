'use strict';

const co = require('co');
const _ = require('lodash');

const DEFAULT_OPTIONS = {
    nextIndex: 2,
    terminal: false,
    returnPromise: false,
};

module.exports = {};

/**
 * Wrap a generator using express-co: this will intercept the arguments and extract the "next" argument
 * which will be omitted when calling the original generator. The generator will be wrapped using co so
 * that it is free to yield promises. Once the generator returns, the intercepted next function will
 * be called unless options.terminal is true, or the return value is strictly equal to false. If the
 * generator yield an error, next will be called with the thrown error as its input.
 *
 * I recommend not using negative offsets for options.nextIndex as express often adds unexpected args.
 *
 * @param {GeneratorFunction} gen a middleware generator function that takes everything but next param.
 * @param {object} [options] options
 * @param {boolean} [options.terminal] if true, do not call 'next' function (default = false)
 * @param {int} [options.nextIndex] index of next function in args, negative denotes offset from last (default = 2)
 * @param {boolean} [options.returnPromise] true if function should return promise (default = false)
 * @returns {Function} middleware function suitable for use in express
 */
module.exports.wrap = (gen, options) => {
    options = _.extend({}, DEFAULT_OPTIONS, options || {});
    const fnc = co.wrap(gen);

    // important to use function () { ... } instead of () => { ... } due to arguments object.
    return function () {
        // pop off last argument, it is the next function
        const args = Array.prototype.slice.call(arguments, 0); // copy args into real array
        const next = args.splice(options.nextIndex, 1)[0]; // remove next function from args

        const promise = fnc
            .apply(null, args)  // TODO: fnc(...args) when supported by node
            .then(
                (callNext) => {
                    // successful execution, call next
                    if (!options.terminal && callNext !== false) {
                        next();
                    }
                },
                (error) => {
                    next(error);
                }
            );

        if (options.returnPromise) {
            return promise;
        }
    };
};


/**
 * See `wrap` .. this is for router.param middleware, and sets the default options.nextIndex
 * accordingly. For now this is actually the same index as normal wrap, but this is here for abstraction.
 */
module.exports.wrapParam = module.exports.wrap;

/**
 * A wrapper function for wrap, that sets options.terminal to true. Shortcut so you don't have to specify options
 * object when wrapping terminal functions. See wrap docs for more details.
 *
 * @param {GeneratorFunction} gen see wrap
 * @param {object} [options] options see wrap
 * @returns {Function} see wrap
 */
module.exports.wrapTerminal = function (gen, options) {
    if (!options) {
        options = {};
    }
    options.terminal = true;
    return module.exports.wrap(gen, options);
};
