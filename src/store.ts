import { createStore } from 'redux';
import { tree } from './reducers';


// const logger: Middleware = store => next => action => {
//   console.group(action.type);
//   console.info(action);
//   let result = next(action);
//   console.groupEnd();
//   return result
// };


export const store = createStore(
  tree,
  // @ts-ignore
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);
