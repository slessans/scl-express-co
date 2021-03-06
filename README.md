# Express Co

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependencies][deps-image]][deps-url]
[![Dev Dependencies][deps-dev-image]][deps-dev-url]

Small, flexible utility for wrapping express middleware in [co](https://github.com/tj/co) so that 
you can use async/await-like syntax via generators yielding promises, and not deal with calling
the `next` function or handling errors directly (unless you want to!).

## Usage
### expressCo.wrap(..)
Wrap is the main function of the library. It accepts a generator and an optional options object. 
It will wrap the generator using `co.wrap(..)` allowing you to use all the same yield-ing semantics
as [co](https://github.com/tj/co). It will extract the `next` function and call it automatically unless
you return false (the check is strict), throw an error (in which case is calls `next(error)`), or pass in 
`options.terminal = true` in the options object.

```javascript
const express = require('express');
const router = express.Router();
const expressCo = require('scl-express-co');

// the simplest usage: run an async function. if promise is rejected, next(error) is called
// otherwise next() is called once promise is reolved
router.use(expressCo.wrap(function * (req, res) {
  req.user = yield parseToken(req); // some function returning a promise
}));

// do something more complex: for instance check user permissions
// here we incorporate custom error handling for one specific case and fall back
// on next(error) for the rest
router.use(expressCo.wrap(function * (req, res) {
  try {
    // some function that returns a promise which resolves if user can view books
    // and rejects if user cannot view books.
    yield canUserViewBooks(req.user);
  } catch (error) {
    // catch errors as if this was a standard/non-async call
    if (error.name === 'user-cannot-view-books') {
      res.status(403).json('error': 'You cannot view books.');
      return false; // dont call next, we already handled the response. end the request here
    }
    // thrown errors will cause next(error) to be called,
    // passing control over to the express error handling-mechanism
    // if you didnt care about outputting the message above, you could just skip
    // the try-catch block altogether and the rejected promise would be passed to next(error)
    throw error; 
  }
}));
```

### expressCo.wrapParam(..)
This is a simple wrapper to the `expressCo.wrap(..)` function that sets `options.nextIndex` according to the position
of the next function in the param handler (its actually the same index right now, but if it changes in the future, 
you will be happy about the extra layer of abstraction).


```javascript
router.param('book', expressCo.wrapParam(function * (req, res, bookId) {
  // next is automatically called, or next(error) is called if promise is rejected.
  req.book = yield req.db.getBookWithId(userId); // some function returning a promise
}));
```

### expressCo.wrapTerminal(..)
In some cases you know this is a "terminal" handler. `expressCo.wrapTerminal` is the same as 
`wrap` except it sets `options.terminal = true`, so that next() will not be called
(unless an error is thrown in which case it will call `next(error)`)

```javascript
router.get('/:book', expressCo.wrapTerminal(function * (req, res) {
  const book = req.book;
  const isFavorite = yield req.user.isBookInFavorites(book);
  
  //  next will not be called
  res.status(200).json({book, isFavorite});
}));
```

[npm-image]: https://img.shields.io/npm/v/scl-express-co.svg?style=flat-square
[npm-url]: https://npmjs.org/package/scl-express-co

[travis-image]: https://img.shields.io/travis/slessans/scl-express-co.svg?style=flat-square
[travis-url]: https://travis-ci.org/slessans/scl-express-co

[coveralls-image]: https://img.shields.io/coveralls/slessans/scl-express-co.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/slessans/scl-express-co

[deps-image]: https://img.shields.io/david/slessans/scl-express-co.svg?style=flat-square
[deps-url]: https://david-dm.org/slessans/scl-express-co

[deps-dev-image]: https://img.shields.io/david/dev/slessans/scl-express-co.svg?style=flat-square
[deps-dev-url]: https://david-dm.org/slessans/scl-express-co#info=devDependencies

