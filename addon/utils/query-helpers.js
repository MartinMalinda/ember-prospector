export function queryWithoutInclude(query) {
  const _newQuery = {
    ...query
  };

  delete _newQuery.include;
  return _newQuery;
}

export function isEmptyQuery(query) {
  return Object.keys(query).length === 0;
}
