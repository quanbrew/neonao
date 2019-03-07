import { CREATE, Create, FETCH_ALL, ItemAction, REMOVE, UPDATE } from "./actions";
import { Item } from "./Item";
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


export const handleCreate = (state: TreeState, create: Create): TreeState => {
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
      const itemID = action.id;
      const item = state[itemID];
      next = { ...state };
      delete next[itemID];
      let parentID = item.parent;
      if (parentID) {
        let parent = next[parentID];
        const children = parent.children.filter(v => v !== itemID);
        next[parentID] = { ...parent, children }
      }
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
