export default function( server ) {

  /*
    Seed your development database using your factories.
    This data will not be loaded in your tests.
  */

  // server.createList('post', 10);

  server.createList('user', 3).forEach(user => {
    server.createList('comment', 3, { user });
    server.createList('role', 3, { user });
    server.createList('thread', 3, { user });
  }); 
}
