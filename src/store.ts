import { applyMiddleware, compose, createStore, Middleware } from 'redux';
import { tree } from './reducers';


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
  {},
  composeEnhancers(applyMiddleware(logger)),
);
