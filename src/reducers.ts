import {
  CREATE,
  Create,
  FETCH_ALL,
  ItemAction,
  LOADED_STATE,
  loadedState,
  LoadedState,
  Remove,
  REMOVE,
  UPDATE
} from "./actions";
import { ID, Item } from "./Item";
import { Map } from "immutable";
import localForage from "localforage";
import Timer = NodeJS.Timer;
import ExportedItem = Item.ExportedItem;


export interface Tree {
  root: ID | null;
  map: Map<ID, Item>;
  loading: boolean;
}


export const initTree: Tree = { root: null, map: Map(), loading: true };


export const saveTreeState = (state: Tree) => {
  if (!state.root)
    return;
  localForage.setItem('root', state.root).then(() => {
    state.map.forEach(
      (item, key) =>
        localForage.setItem(key, Item.toJSON(item))
    );
    console.info('saved');
  });
};


const getItemByIDFromStorage = async (id: ID): Promise<Item | null> => {
  const raw = await localForage.getItem<ExportedItem>(id);
  return raw ? Item.fromJSON(raw) : null;
};


const loadChildren = async (item: Item | null): Promise<Map<ID, Item>> => {
  let map: Map<ID, Item> = Map();
  if (item) {
    map = map.set(item.id, item);
    const childrenMap: Map<ID, Item> [] = await Promise.all(
      item.children.map(
        childID =>
          getItemByIDFromStorage(childID).then(loadChildren)
      )
    );
    map = map.merge(...childrenMap);
  }
  return await map;
};


export const loadTreeState = async (): Promise<LoadedState> => {
  const loading = false;
  const rootID = await localForage.getItem<ID>('root');
  if (!rootID) {
    const root = Item.create('Hello, this is an empty notebook.');
    const rootID = root.id;
    const map: Map<ID, Item> = Map({ [rootID]: root });
    const state = { root: rootID, map, loading };
    return await loadedState(state);
  }
  const map = await loadChildren(await getItemByIDFromStorage(rootID));
  console.log('loaded');
  return await loadedState({ root: rootID, map, loading });
};


const handleCreate = (map: Map<ID, Item>, create: Create): Map<ID, Item> => {
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


const handleRemove = (map: Map<ID, Item>, remove: Remove): Map<ID, Item> => {
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


let saveTimer: Timer | null = null;


export const tree = (state: Tree = initTree, action: ItemAction): Tree => {
  let next: Tree;
  switch (action.type) {
    case CREATE:
      next = { ...state, map: handleCreate(state.map, action) };
      break;
    case UPDATE:
      next = { ...state, [action.item.id]: action.item };
      break;
    case REMOVE:
      next = { ...state, map: handleRemove(state.map, action) };
      break;
    case FETCH_ALL:
      return { ...state, loading: true };
    case LOADED_STATE:
      return action.state;
    default:
      next = state;
  }

  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => saveTreeState(next), 1000);
  return next;
};
