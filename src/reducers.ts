import { Create, Edit, ItemAction, Remove } from "./actions";
import { ID, Item } from "./Item";
import { initTree, ItemMap, saveTreeState, Tree } from "./tree"
import { CREATE, EDIT, FETCH_ALL, LOADED_STATE, REDO, REMOVE, UNDO, UPDATE } from "./constants";
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
    default:
      break;
  }
  if (record) {
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
