'use strict';
/*eslint require-yield: 0 */
/*eslint-env mocha */

const assert = require('chai').assert;
const expressCo = require('./index');

describe('scl-express-co', () => {

    const defaultNext = (error) => {
        if (error) {
            throw error;
        }
    };

    describe('wrap', () => {

        it('should allow the generator to yield promises', () => {

            const ASYNC_RESULT = 'yolo';

            const executeSomethingAsync = () => {
                return Promise.resolve(ASYNC_RESULT);
            };

            const fnc = expressCo.wrap(function * () {
                const result = yield executeSomethingAsync();
                assert.strictEqual(result, ASYNC_RESULT);
            }, {returnPromise: true});

            return fnc('req', 'res', defaultNext);
        });

        it('should extract the argument at options.nextIndex', () => {
            const HELLO_VAL = 'hello';
            const HI_VAL = 'hi';

            const options = {
                nextIndex: 1,
                defaultNext: true,
            };

            const fnc = expressCo.wrap(function * (hello, hi) {
                // noop
                assert.strictEqual(arguments.length, 2);
                assert.strictEqual(hello, HELLO_VAL);
                assert.strictEqual(hi, HI_VAL);
            }, options);

            return fnc(HELLO_VAL, defaultNext, HI_VAL);
        });

        it('should use options.nextIndex = 2 by default', () => {
            const HELLO_VAL = 'hello';
            const HI_VAL = 'hi';

            const fnc = expressCo.wrap(function * (hello, hi) {
                // noop
                assert.strictEqual(arguments.length, 2);
                assert.strictEqual(hello, HELLO_VAL);
                assert.strictEqual(hi, HI_VAL);
            }, {returnPromise: true});

            return fnc(HELLO_VAL, HI_VAL, defaultNext);
        });

        it('should call next with the promise from any rejected errors', () => {
            const ERROR = new Error('i m n air'); // inspired by cdb

            const next = (error) => {
                assert.strictEqual(error, ERROR);
            };

            const executeSomethingAsync = () => {
                return Promise.reject(ERROR);
            };

            const fnc = expressCo.wrap(function * () {
                yield executeSomethingAsync();
            }, {returnPromise: true});

            return fnc('req', 'res', next);
        });

        it('should not call next again, if error is thrown in first call of next function itself', () => {
            const ERROR = new Error('this should happen');
            const next = (error) => {
                // this should only be called after success so no error passed in
                assert.isUndefined(error);
                throw ERROR;
            };

            const fnc = expressCo.wrap(function * () {}, {returnPromise: true});

            return fnc('req', 'res', next).catch(function (error) {
                if (error !== ERROR) {
                    throw error;
                }
            });
        });

        it('should call next on success by default', () => {
            const next = (error) => {
                assert.isUndefined(error);
            };
            const fnc = expressCo.wrap(function * () {}, {returnPromise: true});
            return fnc('req', 'res', next);
        });

        it('should return nothing by default', () => {
            const fnc = expressCo.wrap(function * () {});
            const result = fnc('req', 'res', defaultNext);
            assert.isUndefined(result);
        });

        it('should return promise if specified by options.returnPromise', () => {
            const fnc = expressCo.wrap(function * () {}, {returnPromise: true});
            const result = fnc('req', 'res', defaultNext);
            assert.instanceOf(result, Promise);
        });

        it('should not call next if options.terminal is true', () => {
            let didCallNext = false;
            const next = () => {
                didCallNext = true;
            };

            const fnc = expressCo.wrap(function * () {}, {terminal: true, returnPromise: true});

            return fnc('req', 'res', next).then(() => {
                assert.strictEqual(didCallNext, false);
            });
        });

        it('should not call next if return strict false', () => {
            let didCallNext = false;
            const next = () => {
                didCallNext = true;
            };

            const fnc = expressCo.wrap(function * () {
                return false;
            }, {returnPromise: true});

            return fnc('req', 'res', next).then(() => {
                assert.strictEqual(didCallNext, false);
            });
        });

    });

    describe('wrapTerminal', () => {
        it('can be called with no options object', (done) => {
            const fnc = expressCo.wrapTerminal(function * () {
                done();
            });

            fnc('req', 'res', defaultNext);
        });

        it('should set terminal = true automatically', () => {
            let didCallNext = false;
            const next = () => {
                didCallNext = true;
            };

            const fnc = expressCo.wrapTerminal(function * () {
            }, {returnPromise: true});

            return fnc('req', 'res', next).then(() => {
                assert.strictEqual(didCallNext, false);
            });
        });
    });

});

