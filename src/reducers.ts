import {
  AddIndent,
  ApplyDrop,
  Create,
  Edit,
  Expand,
  Fold,
  ItemAction,
  MoveInto,
  moveInto,
  MoveNear,
  moveNear,
  Remove,
  Toggle
} from "./actions";
import {ID, Item} from "./Item";
import {List} from "immutable";
import {initTree, isChildrenOf, ItemMap, normalMode, saveTreeState, Tree} from "./tree"
import {
  ADD_INDENT,
  APPLY_DROP,
  CREATE,
  DRAG_MODE,
  EDIT,
  EXPAND,
  FETCH_ALL,
  FOLD,
  LOADED_STATE,
  MOVE_INTO,
  MOVE_NEAR,
  REDO,
  REMOVE,
  SWITCH_MODE,
  TOGGLE,
  UNDO,
  UPDATE
} from "./constants";

type Timeout = number;

let history: Tree[] = [];
let future: Tree[] = [];
// record node tree travel order
let nodeOrder: ID[] = [];


const handleCreate = (state: Tree, create: Create): Tree => {
  let map = state.map;
  const parentID = create.item.parent;
  if (parentID) {
    let parent = map.get(parentID) || null;
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
  return { ...state, map };
};


const handleRemove = (state: Tree, remove: Remove): Tree => {
  let map = state.map;
  const itemID = remove.id;
  const item = map.get(itemID) || null;
  if (item === null) return state;
  let idToRemove: ID[] = [];
  let addTreeId = (i: Item | null) => {
    if (i === null) return;
    idToRemove.push(i.id);
    i.children.forEach((child: ID) => addTreeId(map.get(child) || null));
  };
  addTreeId(item);
  for (let id of idToRemove) {
    map = map.remove(id);
  }
  let parentID = item.parent;
  if (parentID) {
    let parent = map.get(parentID) || null;
    if (parent !== null) {

      const children = List<ID>(parent.children.filter(v => v !== itemID));
      map = map.set(parentID, { ...parent, children });
    }
  }
  return { ...state, map };
};


const resetItemParent = (map: ItemMap, id: ID, parent: ID): ItemMap => {
  const item = map.get(id) || null;
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
    let nextParent = map.get(action.nextParent) || null;
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
  const nextParent = map.get(action.nextParent) || null;
  if (nextParent === null) throw Error();
  children = nextParent.children.insert(targetIndex, action.id);
  map = map.set(nextParent.id, { ...nextParent, children });
  // reset parent
  map = resetItemParent(map, action.id, nextParent.id);
  return { ...state, map };
};


const handleMoveNear = (state: Tree, action: MoveNear): Tree => {
  const sibling = state.map.get(action.sibling) || null;
  if (sibling === null) throw Error();
  if (!sibling.parent) return state;
  const parent = state.map.get(sibling.parent) || null;
  if (parent === null) throw Error();
  const position = parent.children.findIndex(id => id === sibling.id);
  if (position === -1) throw Error();
  const moveIntoAction = moveInto(action.id, action.parent, sibling.parent, position + action.offset);
  return handleMove(state, moveIntoAction);
};


const handleAddIndent = (state: Tree, action: AddIndent): Tree => {
  const parent = state.map.get(action.parent) || null;
  if (parent === null) throw Error();
  const index = parent.children.findIndex(id => id === action.id);
  if (index < 1) {
    return state
  }
  const nextParent = parent.children.get(index - 1) || null;
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
  const oldItem = oldState.map.get(id) || null;
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
  if (state.mode.type !== DRAG_MODE || !state.mode.dropAt) return state;
  const { id, parent } = action;
  const { position, target } = state.mode.dropAt;
  if (id === target) return state;
  if (isChildrenOf(state.map, target, id)) return state;
  let offset = 0;
  if (position === 'inner') {
    const moveIntoAction = moveInto(id, parent, target, 'append');
    return handleMove(state, moveIntoAction);
  } else if (position === 'above') offset = 0;
  else if (position === 'below') offset = 1;
  const moveNearAction = moveNear(id, parent, target, offset);
  return handleMoveNear(state, moveNearAction);
};


const recordOrder = (itemMap: ItemMap, id: ID) => {
  const item = itemMap.get(id) || null;
  if (item === null) return;
  nodeOrder.push(id);
  if (item.expand) {
    item.children.forEach((id: ID) => recordOrder(itemMap, id));
  }
};


const handleToggle = (state: Tree, action: Toggle | Expand | Fold): Tree => {
  const item = state.map.get(action.id) || null;
  if (item === null) return state;
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
  const map = state.map.set(item.id, { ...item, expand });
  return { ...state, map };
};


export const tree = (state: Tree = initTree, action: ItemAction): Tree => {
  let record = false;
  let save = true;
  let next: typeof state = state;
  switch (action.type) {
    case CREATE:
      next = handleCreate(state, action);
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
      next = handleRemove(state, action);
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
      const prev = history.pop();
      if (prev) {
        future.push(state);
        next = prev;
      }
      break;
    case REDO:
      const futureState = future.pop();
      if (futureState) {
        history.push(state);
        next = futureState;
      }
      break;
    case TOGGLE:
      next = handleToggle(state, action);
      record = false;
      break;
    case FOLD:
      next = handleToggle(state, action);
      record = false;
      break;
    case EXPAND:
      next = handleToggle(state, action);
      record = false;
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
  const isStateChanged = state !== next;
  if (isStateChanged) {
    nodeOrder = [];
    if (next.root)
      recordOrder(next.map, next.root);
  }
  if (record && isStateChanged) {
    history.push(state);
    future = [];
    if (save) {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => saveTreeState(next), 200);
    }
  }
  return next;
};
