import { applyMiddleware, compose, createStore } from 'redux';
import { tree } from './reducers';
import { initTree } from './tree';

// @ts-ignore
const composeEnhancers: typeof compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(tree, initTree, composeEnhancers(applyMiddleware()));
