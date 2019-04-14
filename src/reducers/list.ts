import {
  Create,
  Drop,
  Edit,
  Expand,
  Fold,
  GotoNext,
  GotoPrev,
  Indent,
  ListAction,
  Remove,
  Reorder,
  Toggle,
  TreeAction,
  UnIndent,
  Update,
} from '../actions';
import { Id } from '../Item';
import { List } from 'immutable';
import {
  editMode,
  getItem,
  getItemAndParent,
  getItemPosition,
  getNextItemId,
  getPrevItem,
  mergeTree,
  Mode,
  moveInto,
  normalMode,
  NotFound,
  saveTreeState,
  Tree,
} from '../tree';
import {
  CREATE,
  DROP,
  EDIT,
  EXPAND,
  FOLD,
  GOTO_NEXT,
  GOTO_PREV,
  INDENT,
  LOADED_STATE,
  PATCH,
  REDO,
  REMOVE,
  REORDER,
  SWITCH_MODE,
  TOGGLE,
  UN_INDENT,
  UNDO,
  UPDATE,
} from '../constants';

type Timeout = number;
const saveTimeout = 200;

const create = (tree: Tree, create: Create): Tree => {
  const parentId = create.item.parent;
  if (!parentId) throw Error('create note without parent');

  let map = tree.map;
  const parent = getItem(map, parentId);
  const item = create.item;
  let children: List<Id>;
  if (create.above) {
    const abovePosition = parent.children.indexOf(create.above);
    children = parent.children.insert(abovePosition + 1, item.id);
  } else {
    children = parent.children.unshift(item.id);
  }
  map = map.set(item.id, item);
  map = map.set(parentId, { ...parent, children });
  const mode: Mode = editMode(item.id);
  return { ...tree, map, mode };
};

const handleRemove = (tree: Tree, remove: Remove): Tree => {
  let map = tree.map;
  const itemId = remove.id;
  const [item, parent] = getItemAndParent(map, itemId);
  const prev = getPrevItem(map, item);
  const mode = editMode(prev.id);
  const children = List<Id>(parent.children.filter(v => v !== item.id));
  map = map.set(parent.id, { ...parent, children });
  return { ...tree, map, mode };
};

const indent = (tree: Tree, action: Indent): Tree => {
  const parent = getItem(tree.map, action.parent);
  const index = parent.children.findIndex(id => id === action.id);

  // first item can't indent
  if (index < 1) return tree;

  const nextParentId = parent.children.get(index - 1) || null;
  const nextParent = getItem(tree.map, nextParentId);
  const map = moveInto(tree.map, action.id, action.parent, nextParent.id, nextParent.children.size);
  return { ...tree, map };
};

const unIndent = (tree: Tree, action: UnIndent): Tree => {
  const [item, parent] = getItemAndParent(tree.map, action.id);
  if (parent.parent === null) return tree;
  const grandParent = getItem(tree.map, parent.parent);
  const order = grandParent.children.indexOf(parent.id);
  const map = moveInto(tree.map, item.id, parent.id, grandParent.id, order + 1);
  return { ...tree, map };
};

const handleUpdate = (tree: Tree, action: Update): Tree => {
  const map = tree.map.set(action.item.id, action.item);
  return { ...tree, map };
};

const edit = (prevTree: Tree, action: Edit): { state: Tree; record: boolean } => {
  const { id, source } = action;
  const prevItem = getItem(prevTree.map, id);
  const prevSource = prevItem.source;
  if (prevSource === source) return { state: prevTree, record: false };
  const item = { ...prevItem, source, modified: Date.now() };
  const map = prevTree.map.set(id, item);
  const state = { ...prevTree, map };
  return { state, record: true };
};

const reorder = (tree: Tree, action: Reorder): Tree => {
  if (action.delta === 0) return tree;
  const [item, parent] = getItemAndParent(tree.map, action.id);
  const itemIndex = getItemPosition(item.id, parent);
  const order = itemIndex + action.delta;
  if (order < 0 || order > parent.children.size) {
    return tree;
  }
  const map = moveInto(tree.map, item.id, parent.id, parent.id, order);
  return { ...tree, map };
};

const applyDrop = (tree: Tree, action: Drop): Tree => {
  const { map } = tree;
  const { id, position } = action;

  const [item, parent] = getItemAndParent(map, id);
  const [target, targetParent] = getItemAndParent(map, action.target);

  let targetIndex = getItemPosition(target.id, targetParent);
  if (position === 'inner') {
    const map = moveInto(tree.map, id, parent.id, target.id, 0);
    return { ...tree, map };
  }
  if (item.parent === target.parent) {
    const itemIndex = getItemPosition(item.id, parent);
    if (itemIndex < targetIndex) targetIndex -= 1;
  }
  if (position === 'below') {
    targetIndex += 1;
  }
  return { ...tree, map: moveInto(tree.map, id, parent.id, targetParent.id, targetIndex), mode: normalMode() };
};

const toggle = (tree: Tree, action: Toggle | Expand | Fold): Tree => {
  const item = getItem(tree.map, action.id);
  let expand = item.expand;
  switch (action.type) {
    case 'TOGGLE':
      expand = !expand;
      break;
    case 'EXPAND':
      expand = true;
      break;
    case 'FOLD':
      expand = false;
      break;
  }
  const map = tree.map.set(item.id, { ...item, expand });
  return { ...tree, map };
};

const gotoNext = (tree: Tree, action: GotoNext): Tree => {
  const item = getItem(tree.map, action.id);
  const nextId = getNextItemId(tree.map, item);
  if (nextId !== tree.root) {
    return { ...tree, mode: editMode(nextId) };
  } else {
    return tree;
  }
};

const gotoPrev = (tree: Tree, action: GotoPrev): Tree => {
  const item = getItem(tree.map, action.id);
  const prev = getPrevItem(tree.map, item);
  if (prev.id === tree.root) return tree;
  const mode = editMode(prev.id);
  return { ...tree, mode };
};

const treeReducer = (state: Tree, action: TreeAction): { next: Tree; record: boolean; save: boolean } => {
  let record = true;
  let save = true;
  let next: typeof state = state;
  switch (action.type) {
    case CREATE:
      next = create(state, action);
      break;
    case UPDATE:
      next = handleUpdate(state, action);
      record = action.record;
      break;
    case EDIT:
      const result = edit(state, action);
      record = result.record;
      next = result.state;
      break;
    case REMOVE:
      next = handleRemove(state, action);
      break;
    case TOGGLE:
      next = toggle(state, action);
      break;
    case FOLD:
      next = toggle(state, action);
      break;
    case EXPAND:
      next = toggle(state, action);
      break;
    case REORDER:
      next = reorder(state, action);
      break;
    case INDENT:
      next = indent(state, action);
      break;
    case UN_INDENT:
      next = unIndent(state, action);
      break;
    case SWITCH_MODE:
      next = { ...state, mode: action.mode };
      record = false;
      save = false;
      break;
    case GOTO_NEXT:
      next = gotoNext(state, action);
      record = false;
      save = false;
      break;
    case GOTO_PREV:
      next = gotoPrev(state, action);
      record = false;
      save = false;
      break;
    case DROP:
      next = applyDrop(state, action);
      break;
    default:
      break;
  }
  return { next, record, save };
};

export interface ListState {
  tree: Tree | null;
  history: List<Tree>;
  future: List<Tree>;
}

export const initListState: ListState = { tree: null, history: List(), future: List() };

let saveTimer: Timeout | null = null;

export const listReducer = (state: ListState, action: ListAction): ListState => {
  console.log(action);
  let { future, history } = state;
  let tree: Tree | null = state.tree;
  let record = false;
  let save = false;
  switch (action.type) {
    case UNDO:
      if (!tree) break;
      const prev = history.last(null);
      if (prev) {
        future = future.push(tree);
        history = history.pop();
        tree = prev;
      }
      save = true;
      break;
    case REDO:
      if (!tree) break;
      const futureState = future.last(null);
      if (futureState) {
        history = history.push(tree);
        future = future.pop();
        tree = futureState;
      }
      save = true;
      break;
    case LOADED_STATE:
      tree = action.tree;
      break;
    case PATCH:
      if (!tree) break;
      tree = mergeTree(tree, action.tree);
      break;
    default:
      if (!tree) break;
      try {
        const result = treeReducer(tree, action);
        tree = result.next;
        record = result.record;
        save = result.save;
      } catch (err) {
        if (err instanceof NotFound) {
          console.warn(`item ${err.id} not found`);
          return state;
        } else {
          throw err;
        }
      }
  }
  const treeChanged = tree !== state.tree;
  if (record && treeChanged && state.tree) {
    history = history.push(state.tree);
    future = List();
  }
  if (save && tree && treeChanged) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => saveTreeState(tree), saveTimeout);
  }
  if (!treeChanged) {
    return state;
  } else {
    return { tree, history, future };
  }
};
