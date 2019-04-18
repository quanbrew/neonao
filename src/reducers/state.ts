import { Action, AddView } from '../actions';
import { List } from 'immutable';
import { mergeTree, NotFound, saveTreeState, Tree } from '../tree';
import { ADD_VIEW, LOADED_STATE, PATCH, REDO, SET_VIEW, SWITCH_MODE, UNDO } from '../constants';
import { treeReducer } from './tree';
import { Mode, State, View, ViewList } from '../state';

type Timeout = number;
const saveTimeout = 200;

export interface Effect {
  save: boolean;
  record: boolean;
  mode?: Mode;
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

export const reducer = (state: State, action: Action): State => {
  console.log(action);
  const prevTree = state.tree;
  let tree: Tree | null = prevTree;
  let { future, history, mode, views } = state;
  let record;
  let save;
  switch (action.type) {
    case UNDO:
      if (!tree) {
        break;
      }
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
      tree = action.tree;
      views = action.views;
      save = false;
      record = false;
      break;
    case PATCH:
      if (!tree) {
        break;
      }
      tree = mergeTree(tree, action.tree);
      save = false;
      record = false;
      break;
    case SWITCH_MODE:
      mode = action.mode;
      record = false;
      save = false;
      break;
    case SET_VIEW:
      views = handleSetView(views, action.view);
      record = false;
      save = false;
      break;
    case ADD_VIEW:
      views = handleAddView(views, action);
      record = false;
      save = false;
      break;
    default:
      if (!tree) {
        break;
      }
      try {
        const treeResult = treeReducer(tree, action);
        ({ tree, record, save } = treeResult);
        if (treeResult.mode) {
          mode = treeResult.mode;
        }
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
