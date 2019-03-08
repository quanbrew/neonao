import { CREATE, Create, FETCH_ALL, ItemAction, Remove, REMOVE, UPDATE } from "./actions";
import { ID, Item } from "./Item";
import { Map } from "immutable";
import Timer = NodeJS.Timer;


export interface Tree {
  root: ID | null;
  map: Map<ID, Item>;
}


export const initTree: Tree = { root: null, map: Map() };


export const saveTreeState = (state: Tree) => {
  if (!state.root)
    return;
  localStorage.setItem('root', state.root);
  state.map.forEach(
    (item, key) =>
      localStorage.setItem(key, JSON.stringify(Item.toJSON(item)))
  );
  console.info('saved');
};


const getItemByIDFromStorage = (id: ID) => {
  const encoded = localStorage.getItem(id);
  if (!encoded) {
    throw (new Error("Can't found item " + id));
  }
  return Item.fromJSON(JSON.parse(encoded));
};


export const loadTreeState = (): Tree => {
  let map: Map<ID, Item> = Map();
  const rootID = localStorage.getItem('root');
  if (!rootID) {
    const root = Item.create('Hello, this is an empty notebook.');
    return { root: root.id, map: map.set(root.id, root) };
  }

  const loadChildren = (item: Item) => {
    map = map.set(item.id, item);
    item.children.forEach(id => loadChildren(getItemByIDFromStorage(id)));
  };
  const rootItem = getItemByIDFromStorage(rootID);
  loadChildren(rootItem);
  console.log('loaded');
  return { root: rootID, map };
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
      next = loadTreeState();
      break;
    default:
      next = state;
  }

  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => saveTreeState(next), 1000);
  return next;
};
