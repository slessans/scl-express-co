# Express Co
Small utility for wrapping express middleware in co so that you can use async/await-like syntax via generators yielding promises.

## Usage

```javascript
const express = require('express');
const router = express.Router();
const expressCo = require('scl-express-co');

// usage as normal middleware (contrived example, dont do db connection like this)
// you can catch errors as if this was a standard/non-async call and rethrow them or 
// handle them or throw new ones. if an error is thrown, next(error) is called with the
// given error passing control over to the express error handling-mechanism. If no error is
// thrown and false is not returned, then next() is called for you.
router.use(expressCo.wrap(function * (req, res) {
  try {
    req.db = yield connectToDb(); // for instance
  } catch (error) {
    if (error.name === 'db-error') {
      throw new Error('could not connect to database');
    }
    throw error;
  }
}));

// usage with param
// if you have some logic that occasionally fills out response, rather than throwing an error
// you can return false to notify expressCo that calling next() is not necessary.
//
// the wrap param function is the same as wrap but sets the nextIndex option according to the position
// of the next function in the param handler (its actually the same index right now, but if it changes
// in the future, you will be happy about the extra layer of abstraction).
router.param('user', expressCo.wrapParam(function * (req, res, userId) {
  if (/^[1-9][0-9]*$/.test(userId)) {
    req.user = yield req.db.getUserWithId(userId); // some function returning a promise for user
  } else {
    res.status(400).json({'message': 'User id must be integer'});
    return false; // don't call next() function
  }
}));

// in some cases you know this is a "terminal" handler. wrapTerminal is the same as wrap except
// it sets options.terminal to true, so that next() will not be called unless an error is thrown
// (in which case it will call next(error))
router.get('/:user', expressCo.wrapTerminal(function * (req, res) {
  const output = {
    user: req.user,
  };
  output['friends'] = yield req.user.getFriends();
  res.status(200).json(output);
}));
```
