# ember-prospector [WIP]

## Installation

```sh

```

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

## Example

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

## TODO

- [ ] add support for `findRecord` with `include`
- [ ] add tests
- [ ] add an extra abstraction that would allow returning already loaded data right away and lazy loading the rest
- [ ] add support for `backgroundReload`
