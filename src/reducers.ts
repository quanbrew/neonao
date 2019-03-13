import {
  CREATE,
  Create,
  FETCH_ALL,
  ItemAction,
  ItemMap,
  LOADED_STATE,
  REDO,
  Remove,
  REMOVE,
  UNDO,
  UPDATE
} from "./actions";
import { ID, Item } from "./Item";
import { Tree } from "./tree"
import { Map } from "immutable";
import localForage from "localforage";
import Timeout = NodeJS.Timeout;


export const initTree: Tree = { root: null, map: Map(), loading: true };


export const saveTreeState = (state: Tree) => {
  if (!state.root)
    return;
  localForage.setItem('root', state.root).then(() => {
    state.map.forEach(
      (item, key) =>
        localForage.setItem(key, Item.toJSON(item))
    );
    // console.info('saved');
  });
};


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


let history: Tree[] = [];
let future: Tree[] = [];


export const tree = (state: Tree = initTree, action: ItemAction): Tree => {
  let record = false;
  switch (action.type) {
    case CREATE:
      state = { ...state, map: handleCreate(state.map, action) };
      record = true;
      break;
    case UPDATE:
      state = { ...state, map: state.map.set(action.item.id, action.item) };
      record = action.record;
      break;
    case REMOVE:
      state = { ...state, map: handleRemove(state.map, action) };
      record = true;
      break;
    case FETCH_ALL:
      return { ...state, loading: true };
    case LOADED_STATE:
      return mergeState(state, action.state);
    case UNDO:
      console.log('UNDO: history: ', history.length, 'future: ', future.length);
      const prev = history.pop();
      if (prev) {
        future.push(state);
        state = prev;
      }
      break;
    case REDO:
      console.log('REDO: history: ', history.length, 'future: ', future.length);
      const next = future.pop();
      if (next) {
        history.push(state);
        state = next;
      }
      break;
    default:
      break;
  }
  if (record) {
    history.push(state);
    console.log('recorded: history: ', history.length, 'future: ', future.length);
    future = [];
  }

  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => saveTreeState(state), 400);
  return state;
};
