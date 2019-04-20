import { getItem, getItemAndParent, getItemPosition, moveInto, Tree } from '../tree';
import {
  Create,
  Drop,
  Edit,
  Expand,
  Fold,
  Indent,
  Remove,
  Reorder,
  Toggle,
  TreeAction,
  UnIndent,
  Update,
} from '../actions';
import { List } from 'immutable';
import { Id } from '../Item';
import { CREATE, DROP, EDIT, EXPAND, FOLD, INDENT, REMOVE, REORDER, TOGGLE, UN_INDENT, UPDATE } from '../constants';
import { Effect } from './state';

const doNothing: Effect = { save: false, record: false };

const saveAndRecord: Effect = { save: true, record: true };

export type EffectTree = { tree: Tree } & Effect;

const create = (tree: Tree, create: Create): EffectTree => {
  const parentId = create.item.parent;
  if (!parentId) throw Error('create note without parent');

  const item = create.item;

  let map = tree.map;
  const parent = getItem(map, parentId);
  parent.expand = true;

  let children: List<Id>;
  if (create.above) {
    const abovePosition = parent.children.indexOf(create.above);
    children = parent.children.insert(abovePosition + 1, item.id);
  } else {
    children = parent.children.unshift(item.id);
  }
  map = map.set(item.id, item);
  map = map.set(parentId, { ...parent, children });
  return { ...saveAndRecord, tree: { ...tree, map } };
};

const handleRemove = (tree: Tree, remove: Remove): EffectTree => {
  let map = tree.map;
  const itemId = remove.id;
  const [item, parent] = getItemAndParent(map, itemId);
  const children = List<Id>(parent.children.filter(v => v !== item.id));
  map = map.set(parent.id, { ...parent, children });
  map = map.set(item.id, { ...item, deleted: true });
  return { ...saveAndRecord, tree: { ...tree, map } };
};

const indent = (tree: Tree, action: Indent): EffectTree => {
  const parent = getItem(tree.map, action.parent);
  const index = parent.children.findIndex(id => id === action.id);

  // first item can't indent
  if (index < 1) return { ...doNothing, tree };

  parent.expand = true;

  const nextParentId = parent.children.get(index - 1) || null;
  const nextParent = getItem(tree.map, nextParentId);
  const map = moveInto(tree.map, action.id, action.parent, nextParent.id, nextParent.children.size);
  return { ...saveAndRecord, tree: { ...tree, map } };
};

const unIndent = (tree: Tree, action: UnIndent): EffectTree => {
  const [item, parent] = getItemAndParent(tree.map, action.id);
  if (parent.parent === null) return { ...doNothing, tree };
  const grandParent = getItem(tree.map, parent.parent);
  const order = grandParent.children.indexOf(parent.id);
  const map = moveInto(tree.map, item.id, parent.id, grandParent.id, order + 1);
  return { ...saveAndRecord, tree: { ...tree, map } };
};

const handleUpdate = (tree: Tree, { item, record }: Update): EffectTree => {
  const map = tree.map.set(item.id, item);
  return { ...doNothing, record, tree: { ...tree, map } };
};

const edit = (prevTree: Tree, action: Edit): EffectTree => {
  const { id, source } = action;
  const prevItem = getItem(prevTree.map, id);
  const prevSource = prevItem.source;
  if (prevSource === source) return { tree: prevTree, record: false, save: true };
  const item = { ...prevItem, source, modified: Date.now() };
  const map = prevTree.map.set(id, item);
  const tree = { ...prevTree, map };
  return { tree, record: true, save: true };
};

const reorder = (tree: Tree, action: Reorder): EffectTree => {
  if (action.delta === 0) return { ...doNothing, tree };
  const [item, parent] = getItemAndParent(tree.map, action.id);
  const itemIndex = getItemPosition(item.id, parent);
  const order = itemIndex + action.delta;
  if (order < 0 || order > parent.children.size) {
    return { ...saveAndRecord, tree };
  }
  const map = moveInto(tree.map, item.id, parent.id, parent.id, order);
  return { ...saveAndRecord, tree: { ...tree, map } };
};

const applyDrop = (tree: Tree, action: Drop): EffectTree => {
  const { map } = tree;
  const { id, position } = action;

  const [item, parent] = getItemAndParent(map, id);
  const [target, targetParent] = getItemAndParent(map, action.target);

  let targetIndex = getItemPosition(target.id, targetParent);
  if (position === 'inner') {
    const map = moveInto(tree.map, id, parent.id, target.id, 0);
    return { ...saveAndRecord, tree: { ...tree, map } };
  }
  if (item.parent === target.parent) {
    const itemIndex = getItemPosition(item.id, parent);
    if (itemIndex < targetIndex) targetIndex -= 1;
  }
  if (position === 'below') {
    targetIndex += 1;
  }
  const nextMap = moveInto(tree.map, id, parent.id, targetParent.id, targetIndex);
  const nextTree: Tree = { ...tree, map: nextMap };
  return { ...saveAndRecord, tree: nextTree };
};

const toggle = (tree: Tree, action: Toggle | Expand | Fold): EffectTree => {
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
  return { ...doNothing, record: false, tree: { ...tree, map } };
};

export const treeReducer = (tree: Tree, action: TreeAction): EffectTree => {
  switch (action.type) {
    case CREATE:
      return create(tree, action);
    case UPDATE:
      return handleUpdate(tree, action);
    case EDIT:
      return edit(tree, action);
    case REMOVE:
      return handleRemove(tree, action);
    case TOGGLE:
      return toggle(tree, action);
    case FOLD:
      return toggle(tree, action);
    case EXPAND:
      return toggle(tree, action);
    case REORDER:
      return reorder(tree, action);
    case INDENT:
      return indent(tree, action);
    case UN_INDENT:
      return unIndent(tree, action);
    case DROP:
      return applyDrop(tree, action);
    // default:
    //   throw Error(`unimplemented action: ${action.type}`);
  }
};
