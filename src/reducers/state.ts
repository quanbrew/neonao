import { Action, AddView, GotoNext, GotoPrev } from '../actions';
import { List } from 'immutable';
import { getItem, getNextItemId, getPrevItem, mergeTree, NotFound, saveTreeState, Tree } from '../tree';
import {
  ADD_VIEW,
  FOCUS,
  GOTO_NEXT,
  GOTO_PREV,
  LOADED_STATE,
  PATCH,
  REDO,
  SET_VIEW,
  SWITCH_MODE,
  UNDO,
} from '../constants';
import { treeReducer } from './tree';
import { editMode, Mode, State, View, ViewList } from '../state';

type Timeout = number;
const saveTimeout = 200;

export interface Effect {
  save: boolean;
  record: boolean;
}

let autoSaveTimer: Timeout | null = null;

const handleSetView = (views: ViewList, view: View) => {
  const index = views.findIndex(x => x.id === view.id);
  if (index !== -1) {
    return views.set(index, view);
  } else {
    return views;
  }
};

function handleAddView(views: ViewList, { order, view }: AddView): ViewList {
  if (order) {
    return views.insert(order, view);
  } else {
    return views.push(view);
  }
}

const gotoNext = (tree: Tree, oldMode: Mode, action: GotoNext): Mode => {
  const item = getItem(tree.map, action.id);
  const nextId = getNextItemId(tree.map, item);
  if (nextId !== tree.root) {
    return editMode(nextId, action.view);
  } else {
    return oldMode;
  }
};

const gotoPrev = (tree: Tree, action: GotoPrev): Mode => {
  const item = getItem(tree.map, action.id);
  const prev = getPrevItem(tree.map, item);
  return editMode(prev.id, action.view);
};

export const reducer = (state: State | null, action: Action): State | null => {
  console.log(action);
  if (action.type === LOADED_STATE) {
    state = action.state;
  } else if (state === null) {
    return state;
  }
  const prevTree = state.tree;
  let tree: Tree | null = prevTree;
  let { future, history, mode, views } = state;
  let record = false;
  let save = false;
  switch (action.type) {
    case UNDO:
      const prev = history.last(null);
      if (prev) {
        future = future.push(tree);
        history = history.pop();
        tree = prev;
      }
      save = true;
      record = false;
      break;
    case REDO:
      if (!tree) {
        break;
      }
      const futureState = future.last(null);
      if (futureState) {
        history = history.push(tree);
        future = future.pop();
        tree = futureState;
      }
      save = true;
      record = false;
      break;
    case LOADED_STATE:
      break;
    case PATCH:
      if (!tree) {
        break;
      }
      tree = mergeTree(tree, action.tree);
      break;
    case SWITCH_MODE:
      mode = action.mode;
      break;
    case SET_VIEW:
      views = handleSetView(views, action.view);
      break;
    case ADD_VIEW:
      views = handleAddView(views, action);
      break;
    case FOCUS:
      mode = editMode(action.target, action.view);
      break;
    case GOTO_NEXT:
      mode = gotoNext(tree, mode, action);
      break;
    case GOTO_PREV:
      mode = gotoPrev(tree, action);
      break;
    default:
      try {
        ({ tree, record, save } = treeReducer(tree, action));
      } catch (err) {
        if (err instanceof NotFound) {
          console.warn(`item ${err.id} not found`);
          return state;
        } else {
          throw err;
        }
      }
  }

  if (tree && tree !== prevTree) {
    if (record && prevTree) {
      history = history.push(prevTree);
      future = List();
    }
    if (save) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      autoSaveTimer = window.setTimeout(() => saveTreeState(tree), saveTimeout);
    }
  }
  return { tree, history, future, mode, views };
};
