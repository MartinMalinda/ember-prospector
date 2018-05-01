
# ember-prospector [WIP]

## Usage

This addon provides an abstraction over ember data store service and adds opinionated caching of `store.query` and tracks the usage of `include`. The main idea is, that what's once included
does not need to be included again.

```js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  prospector: service(),

  model() {
    return this.get('prospector').query('user', {
      include: ['threads', 'roles']
    });
  }
});
```

## Example - prospector.query

There is an application with two routes: `user.comments` and `user.threads`.

```js
// user/threads.js
model() {
  return this.get('prospector').query('user', {
    include: ['threads', 'roles']
});

// user/comments.js
model() {
  return this.get('prospector').query('user', {
    include: ['comments', 'roles']
});

```

Both of these routes query the same model: `user`. They also include the same relationship: `roles`. In this case, when user enters
the `user.threads` route, the prospector will fire `GET /users?include=threads,roles`. After, when transitioning to `user.comments`, prospector
will check that `roles` have already been loaded and therefore it will do just `GET /users?include=comments`.

Moreover, when accessing `user.threads` or `user.comments` again, there won't be any requests anymore, the data will be retrieved from cache.

## Example 2 - prospector.query + prospector.findRecord

There is an application with two routes: `user.index` and `user.detail`.

This feature requires `shouldCreateFindRecordCacheFromQuery` to return true (see configuration below).

```js
// user/index.js
model() {
  return this.get('prospector').query('user', {
    include: ['roles', 'settings']
  });
}

// user/detail.js
model({ id }) {
  return this.get('prospector').findRecord('user', id, {
    include: ['roles', 'settings']
  });
}

// user/comments.js
model({ id }) {
  return this.get('prospector').findRecord('user', id, {
    include: ['comments', 'roles']
  });
}

```

If user will visit `/users/1` directly, prospector will fire `GET /users/1?include=settings,roles. On the other hand, when user visits `/users` first and then transitions to `/users/1`,
no request will be made in the `user.detail` route and the user will be retreived from cache. If the user afterwards transitions to `/users/1/comments` a new request will be made but only for the `comments` relationship because `roles` have already been loaded, prospector will fire `GET /users/1?include=comments`.

## Example 3 - prospector.query with params

There is an application with three routes: `user.comments` and `user.threads`.

```js
// user/threads.js
model() {
  return this.get('prospector').query('user', {
    admin: true,
    include: ['threads', 'roles']
});

// user/comments.js
model() {
  return this.get('prospector').query('user', {
    admin: true,
    include: ['comments', 'roles']
});
```

Similar situation as in Exaple 1. Prospector will recognize that `admin: true` is present in both queries and so that first request will be `GET /users?admin=true&include=threads,roles` and after transition to the second route it will be just `GET /users?admin=true&include=comments`. Optionally, we could configure `shouldCreateFindRecordCacheFromQuery` and `shouldStripQueryFromFindRecordCaching` and the model from this cache could even be used in a third route:

```js
// user/detail.js
model({ id }) {
  return this.get('prospector').findRecord('user', id, {
    include: ['comments', 'roles']
  });
}

By default this is turned off, because prospector does not know what `admin: true` means and whether that param is just used for filtering or if it can have impact on the structure of the model - like it can be with JSONAPI sparse fieldsets for example.


## Configuration

To configure Prospector, create your own prospector service an extend it from the original one

```js
// app/services/prospector.js

import ProspectoService from 'ember-prospector/services/prospector';

export default Service.extend({
  shouldCreateFindRecordCacheFromQuery(/* modelName, query, data */) {
    /*
    This returns false by default

    if (modelName === 'admin') {
      return false;
    }
    
    if (query.someParam) {
      return false;
    }
    */


    return true;
  },

  shouldStripQueryFromFindRecordCaching(/* modelName, query, data */) {
    /*
      This returns false by default

      If this returns true, the cache layer will ignore the query key during save so that
      prospector.query('user', { admin: true, include: ['comments'] });
      prospector.findRecord('user', 1, { include: ['comments'] }); // this might be returned from cache, if the value would be false, the `admin: true` would prevent that cache to be used
    */
    return true;
  },

  // these methods can be used to change the default formats of include, some servers expect string delimited by ',' and some expect an array
  
  deserializeInclude(include) {
    if (isArray(include)) {
      return include;
    }

    return include && include.split(',') || [];
  },

  serializeInclude(include) {
    if (typeof include === 'string') {
      return include;
    }

    return include.join(',');
  },
});
```

## TODO

- [x] add support for `findRecord` with `include`
- [ ] add an extra abstraction that would allow returning already loaded data right away and lazy loading the rest
- [ ] add support for `backgroundReload`
- [ ] add opinionated support for JSONAPI sparse fieldsets

=======


Usage
------------------------------------------------------------------------------

[Longer description of how to use the addon in apps.]


Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd my-addon`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
