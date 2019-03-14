import { applyMiddleware, compose, createStore, Middleware } from 'redux';
import { initTree, tree } from './reducers';


// @ts-ignore
const logger: Middleware = () => next => action => {
  console.group(action.type);
  console.info(action);
  let result = next(action);
  console.groupEnd();
  return result
};

// @ts-ignore
const composeEnhancers: typeof compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
  tree,
  initTree,
  composeEnhancers(applyMiddleware()),
);
