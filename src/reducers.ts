import { CREATE, Create, FETCH_ALL, ItemAction, Remove, REMOVE, UPDATE } from "./actions";
import { ID, Item } from "./Item";
import ExportedItem = Item.ExportedItem;
import Timer = NodeJS.Timer;


export interface TreeState {
  [id: string]: Item;
}


export const saveTreeState = (state: TreeState) => {
  if (Object.entries(state).length === 0)
    return;
  let exportedObject = [];
  for (let key in state) {
    exportedObject.push(Item.toJSON(state[key]));
  }
  console.info('saved');
  localStorage.setItem('tree', JSON.stringify(exportedObject));
};


export const loadTreeState = (): TreeState => {
  let state = {};
  const exportedData = localStorage.getItem('tree');
  if (exportedData) {
    const loaded: ExportedItem[] = JSON.parse(exportedData);
    for (let item of loaded) {
      state[item.id] = Item.fromJSON(item);
    }
  }
  if (Object.entries(state).length === 0) {
    return initState;
  }
  console.log('loaded');
  return state;
};


const initItem = Item.create('Hello');
const initState = { [initItem.id]: initItem };


const handleCreate = (state: TreeState, create: Create): TreeState => {
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


const handleRemove = (state: TreeState, remove: Remove): TreeState => {
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


export const tree = (state: TreeState = {}, action: ItemAction): TreeState => {
  let next: TreeState;
  switch (action.type) {
    case CREATE:
      next = handleCreate(state, action);
      break;
    case UPDATE:
      next = { ...state, [action.item.id]: action.item };
      break;
    case REMOVE:
      next = handleRemove(state, action);
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
