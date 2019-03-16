import {
  AddIndent,
  ApplyDrop,
  Create,
  Edit,
  ItemAction,
  MoveInto,
  moveInto,
  MoveNear,
  moveNear,
  Remove
} from "./actions";
import { ID, Item } from "./Item";
import { initTree, ItemMap, normalMode, saveTreeState, Tree } from "./tree"
import {
  ADD_INDENT,
  APPLY_DROP,
  CREATE,
  DRAG_MODE,
  EDIT,
  FETCH_ALL,
  LOADED_STATE,
  MOVE_INTO,
  MOVE_NEAR,
  REDO,
  REMOVE,
  SWITCH_MODE,
  UNDO,
  UPDATE
} from "./constants";
import Timeout = NodeJS.Timeout;


const handleCreate = (map: ItemMap, create: Create): ItemMap => {
  const parentID = create.item.parent;
  if (parentID) {
    let parent = map.get(parentID, null);
    if (parent === null) {
      throw (new Error("Can't found item " + parentID))
    }
    const item = create.item;
    const children = parent.children.unshift(item.id);
    map = map.set(item.id, item);
    map = map.set(parentID, { ...parent, children });
  } else {
    map = map.set(create.item.id, create.item);
  }
  return map;
};


const handleRemove = (map: ItemMap, remove: Remove): ItemMap => {
  const itemID = remove.id;
  const item = map.get(itemID, null);
  if (item === null) {
    return map;
  }
  let idToRemove: ID[] = [];
  let addTreeId = (i: Item | null) => {
    if (i === null) return;
    idToRemove.push(i.id);
    i.children.forEach(child => addTreeId(map.get(child, null)));
  };
  addTreeId(item);
  map = map.deleteAll(idToRemove);
  let parentID = item.parent;
  if (parentID) {
    let parent = map.get(parentID, null);
    if (parent !== null) {
      const children = parent.children.filter(v => v !== itemID);
      map = map.set(parentID, { ...parent, children });
    }
  }
  return map;
};


const resetItemParent = (map: ItemMap, id: ID, parent: ID): ItemMap => {
  const item = map.get(id, null);
  if (item === null) throw Error();
  return map.set(id, { ...item, parent });
};


const handleMove = (state: Tree, action: MoveInto): Tree => {
  let map = state.map;
  const parent = map.get(action.parent) as Item;
  const oldPosition = parent.children.findIndex(id => id === action.id);
  if (oldPosition === -1) throw Error();
  let targetIndex: number;
  // handle append
  if (action.order === 'append') {
    let children = parent.children.remove(oldPosition);
    map = map.set(parent.id, { ...parent, children });
    let nextParent = map.get(action.nextParent, null);
    if (nextParent === null) throw Error();
    children = nextParent.children.push(action.id);
    map = map.set(nextParent.id, { ...nextParent, children });
    map = resetItemParent(map, action.id, nextParent.id);
    return { ...state, map };
  }
  // compute index with relative order
  else if (action.relative) {
    targetIndex = action.order + oldPosition;
  } else {
    targetIndex = action.order;
  }
  if (targetIndex < 0) return state;
  // set placeholder
  let children = parent.children.remove(oldPosition);
  map = map.set(parent.id, { ...parent, children });
  // insert
  const nextParent = map.get(action.nextParent, null);
  if (nextParent === null) throw Error();
  children = nextParent.children.insert(targetIndex, action.id);
  map = map.set(nextParent.id, { ...nextParent, children });
  // reset parent
  map = resetItemParent(map, action.id, nextParent.id);
  return { ...state, map };
};


const handleMoveNear = (state: Tree, action: MoveNear): Tree => {
  const sibling = state.map.get(action.sibling, null);
  if (sibling === null) throw Error();
  if (!sibling.parent) return state;
  const parent = state.map.get(sibling.parent, null);
  if (parent === null) throw Error();
  const position = parent.children.findIndex(id => id === sibling.id);
  if (position === -1) throw Error();
  const moveIntoAction = moveInto(action.id, action.parent, sibling.parent, position + action.offset);
  return handleMove(state, moveIntoAction);
};


const handleAddIndent = (state: Tree, action: AddIndent): Tree => {
  const parent = state.map.get(action.parent, null);
  if (parent === null) throw Error();
  const index = parent.children.findIndex(id => id === action.id);
  if (index < 1) {
    return state
  }
  const nextParent = parent.children.get(index - 1, null);
  if (nextParent === null) throw Error();
  const move = moveInto(action.id, action.parent, nextParent, 'append');
  return handleMove(state, move);
};


let saveTimer: Timeout | null = null;


const mergeState = (old: Tree, next: Partial<Tree>): Tree => {
  const map = next.map ? old.map.merge(next.map) : old.map;
  return { ...old, ...next, map };
};


const applyEdit = (oldState: Tree, action: Edit): { state: Tree, record: boolean } => {
  let record = false;
  const { id, editor } = action;
  const oldItem = oldState.map.get(id, null);
  if (oldItem === null || oldItem.editor === editor) return { state: oldState, record };
  const oldEditor = oldItem.editor;
  // TODO: Disable undo and implement record judgement.
  record = oldEditor.getUndoStack() !== editor.getUndoStack();
  const item = { ...oldItem, editor };
  const map = oldState.map.set(id, item);
  const state = { ...oldState, map };
  return { state, record };
};


const handleApplyDrop = (state: Tree, action: ApplyDrop): Tree => {
  if (state.mode.type !== DRAG_MODE || !state.mode.willMoveAt) return state;
  const { id, parent } = action;
  const { position, target } = state.mode.willMoveAt;
  if (id === target) return state;
  let offset = 0;
  if (position === 'above') offset = 0;
  if (position === 'below') offset = 1;
  const moveNearAction = moveNear(id, parent, target, offset);
  return handleMoveNear(state, moveNearAction);
};


let history: Tree[] = [];
let future: Tree[] = [];


export const tree = (state: Tree = initTree, action: ItemAction): Tree => {
  console.group('Tree Reducer', action);
  let record = false;
  let save = true;
  let next: typeof state = state;
  switch (action.type) {
    case CREATE:
      next = { ...state, map: handleCreate(state.map, action) };
      record = true;
      break;
    case UPDATE:
      next = { ...state, map: state.map.set(action.item.id, action.item) };
      record = action.record;
      break;
    case EDIT:
      const result = applyEdit(state, action);
      record = result.record;
      next = result.state;
      break;
    case REMOVE:
      next = { ...state, map: handleRemove(state.map, action) };
      record = true;
      break;
    case FETCH_ALL:
      next = { ...state, loading: true };
      save = false;
      break;
    case LOADED_STATE:
      next = mergeState(state, action.state);
      save = false;
      break;
    case UNDO:
      console.group('UNDO');
      console.debug('BEFORE: history: ', history.length, 'future: ', future.length);
      const prev = history.pop();
      if (prev) {
        future.push(state);
        next = prev;
      }
      console.debug(' AFTER: history: ', history.length, 'future: ', future.length);
      console.groupEnd();
      break;
    case REDO:
      console.group('REDO');
      console.debug('BEFORE: history: ', history.length, 'future: ', future.length);
      const futureState = future.pop();
      if (futureState) {
        history.push(state);
        next = futureState;
      }
      console.debug(' AFTER: history: ', history.length, 'future: ', future.length);
      console.groupEnd();
      break;
    case MOVE_INTO:
      next = handleMove(state, action);
      record = true;
      break;
    case MOVE_NEAR:
      next = handleMoveNear(state, action);
      record = true;
      break;
    case ADD_INDENT:
      next = handleAddIndent(state, action);
      record = true;
      break;
    case SWITCH_MODE:
      next = { ...state, mode: action.mode };
      break;
    case APPLY_DROP:
      record = true;
      next = handleApplyDrop(state, action);
      state.mode = normalMode();
      break;
    default:
      break;
  }
  if (record && state !== next) {
    console.group('RECORD');
    console.debug('BEFORE: history: ', history.length, 'future: ', future.length);
    console.debug(action.type, action);
    history.push(state);
    future = [];
    console.debug(' AFTER: history: ', history.length, 'future: ', future.length);
    console.groupEnd();
  }
  if (save) {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => saveTreeState(next), 200);
  }
  console.groupEnd();
  return next;
};
