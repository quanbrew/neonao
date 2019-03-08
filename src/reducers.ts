import { CREATE, Create, FETCH_ALL, ItemAction, Remove, REMOVE, UPDATE } from "./actions";
import { ID, Item } from "./Item";
import Timer = NodeJS.Timer;


export interface ItemMap {
  [id: string]: Item;
}


export interface Tree {
  root: ID | null;
  map: ItemMap;
}


export const initTree: Tree = { root: null, map: {} };


export const saveTreeState = (state: Tree) => {
  if (!state.root)
    return;
  localStorage.setItem('root', state.root);
  for (let key in state.map) {
    localStorage.setItem(key, JSON.stringify(Item.toJSON(state.map[key])));
  }
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
  let map: ItemMap = {};
  const rootID = localStorage.getItem('root');
  if (!rootID) {
    const root = Item.create('Hello, this is an empty notebook.');
    return { root: root.id, map: { [root.id]: root } };
  }

  const loadChildren = (item: Item) => {
    map[item.id] = item;
    item.children.forEach(id => loadChildren(getItemByIDFromStorage(id)));
  };
  const rootItem = getItemByIDFromStorage(rootID);
  loadChildren(rootItem);
  console.log('loaded');
  return { root: rootID, map };
};


const handleCreate = (state: ItemMap, create: Create): ItemMap => {
  let next = {};
  let parentID_ = create.item.parent;
  if (parentID_) {
    let parent = { ...state[parentID_] };
    const item = create.item;
    const children = parent.children.push(item.id);
    next = { ...state, [item.id]: item, [parent.id]: { ...parent, children } };
  } else {
    next = { ...state, [create.item.id]: create.item };
  }
  return next;
};


const handleRemove = (state: ItemMap, remove: Remove): ItemMap => {
  const itemID = remove.id;
  const item = state[itemID];
  let idToRemove: ID[] = [];
  let addTreeId = (i: Item) => {
    idToRemove.push(i.id);
    i.children.map(childId => addTreeId(state[childId]));
  };
  addTreeId(item);
  let next = { ...state };
  for (let key of idToRemove) {
    delete next[key];
  }
  let parentID = item.parent;
  if (parentID) {
    let parent = next[parentID];
    const children = parent.children.filter(v => v !== itemID);
    next[parentID] = { ...parent, children }
  }
  return next;
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
