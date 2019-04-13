import { fromJS, Map } from 'immutable';
import { ID, Item } from './Item';
import { loadedState, LoadedState, patch, Patch } from './actions';
import { DETAIL_MODE, DRAG_MODE, EDIT_MODE, NORMAL_MODE, SELECT_MODE } from './constants';

import(/* webpackChunkName: "localforage" */
'localforage');

export type ItemMap = Map<ID, Item>;

export interface Tree {
  root: ID;
  map: ItemMap;
  mode: Mode;
}

export type Mode = EditMode | SelectMode | DetailMode | DragMode | NormalMode;

export interface NormalMode {
  type: typeof NORMAL_MODE;
}

export const normalMode = (): NormalMode => ({ type: NORMAL_MODE });

export type DropPosition = 'above' | 'below' | 'inner';

export interface DragMode {
  type: typeof DRAG_MODE;
}

export const dragMode = (): DragMode => ({
  type: DRAG_MODE,
});

export interface EditMode {
  type: typeof EDIT_MODE;
  id: ID;
}

export const editMode = (id: ID): EditMode => ({
  type: EDIT_MODE,
  id,
});

export interface SelectMode {
  type: typeof SELECT_MODE;
  selected: ID[];
  cut: boolean;
}

export interface DetailMode {
  type: typeof DETAIL_MODE;
  id: ID;
}

export const saveTreeState = async (state: Tree | null) => {
  if (!state) return;
  const localForage = await import('localforage');
  if (!state.root) return;
  await localForage.setItem('root', state.root);
  const toJSON = ({ id, expand, source, children, parent, modified }: Item): ExportedItem => ({
    id,
    expand,
    parent,
    children: children.toJS(),
    source,
    modified,
  });
  state.map.forEach((item: Item, key: ID) => localForage.setItem(key, toJSON(item)));
  console.debug('saved');
};

const getItemByIDFromStorage = async (id: ID): Promise<Item | null> => {
  const localForage = await import('localforage');
  const raw = await localForage.getItem<ExportedItem>(id);
  const fromJSON = ({ id, expand, source, children, parent, modified }: ExportedItem): Item => ({
    id,
    expand,
    parent,
    modified,
    children: fromJS(children),
    source,
    deleted: false,
    loaded: children.length === 0,
  });
  if (raw) {
    const item = fromJSON(raw);
    item.loaded = true;
    return item;
  } else {
    return null;
  }
};

const loadChildren = async (item: Item | null, maxLevel: number): Promise<ItemMap> => {
  const mapper = async (childID: ID): Promise<ItemMap> => {
    const item = await getItemByIDFromStorage(childID);
    return loadChildren(item, maxLevel - 1);
  };

  let map: ItemMap = Map();
  if (item) {
    map = map.set(item.id, item);
    if (maxLevel > 0) {
      const childrenMaps = await Promise.all(item.children.toArray().map(mapper));
      return await map.merge(...childrenMaps);
    } else if (item.children.size > 0) {
      item.loaded = false;
    }
  }

  return await map;
};

export interface ExportedItem {
  id: ID;
  parent?: ID;
  children: ID[];
  expand: boolean;
  modified: number;
  source: string;
}

const createEmptyState = async (): Promise<LoadedState> => {
  const root = Item.create('root');
  const rootID = root.id;
  const map: ItemMap = Map({ [rootID]: root });
  const state = { root: rootID, map, mode: normalMode() };
  return loadedState(state);
};

export const loadItemState = async (item: Item, maxLevel: number = 2): Promise<Patch> => {
  let map = await loadChildren(item, maxLevel);
  map = map.set(item.id, { ...item, loaded: true });
  return await patch({ map });
};

export const loadTreeState = async (maxLevel: number = 128): Promise<LoadedState> => {
  const localForage = await import('localforage');
  const rootID = await localForage.getItem<ID>('root');
  if (!rootID) return await createEmptyState();
  const root = await getItemByIDFromStorage(rootID);
  const map = await loadChildren(root, maxLevel);
  console.log('loaded');
  return await loadedState({ root: rootID, map, mode: normalMode() });
};

export const isChildrenOf = (map: ItemMap, child: ID, parent: ID): boolean => {
  if (child === parent) return false;
  let now = map.get(child) || null;
  while (now && now.id !== parent && now.parent) {
    now = map.get(now.parent) || null;
  }
  return now ? now.id === parent : false;
};

export class NotFound extends Error {
  id: ID | null;

  constructor(id: ID | null = null) {
    super('Some node not found');
    Object.setPrototypeOf(this, NotFound.prototype);
    this.id = id;
  }
}

export const getItem = (map: ItemMap, id: ID | null | undefined): Item => {
  if (!id) throw new NotFound();
  const item = map.get(id) || null;
  if (!item) throw new NotFound(id);
  return item;
};
export const getItemAndParent = (map: ItemMap, id: ID | null | undefined): [Item, Item] => {
  const item = getItem(map, id);
  const parent = getItem(map, item.parent);
  return [item, parent];
};

export const getItemPosition = (id: ID, parent: Item): number => {
  const index = parent.children.indexOf(id);
  if (index < 0) throw Error("can't get item position in parent");
  return index;
};

export const mergeTree = (old: Tree, next: Partial<Tree>): Tree => {
  const map = next.map ? old.map.merge(next.map) : old.map;
  return { ...old, ...next, map };
};

const resetItemParent = (map: ItemMap, id: ID, parent: ID): ItemMap => {
  const item = getItem(map, id);
  return map.set(id, { ...item, parent });
};

export const moveInto = (map: ItemMap, id: ID, parentId: ID, nextParentId: ID, order: number): ItemMap => {
  if (id === nextParentId || isChildrenOf(map, nextParentId, id) || order < 0) {
    console.warn('self-contained move');
    return map;
  }
  const parent = getItem(map, parentId);
  const oldPosition = getItemPosition(id, parent);

  let children = parent.children.remove(oldPosition);
  map = map.set(parent.id, { ...parent, children });

  // insert
  const nextParent = getItem(map, nextParentId);
  children = nextParent.children.insert(order, id);
  map = map.set(nextParentId, { ...nextParent, children });
  map = resetItemParent(map, id, nextParentId);
  return map;
};

export const getLastNode = (map: ItemMap, item: Item): Item => {
  if (item.children.size === 0) {
    return item;
  } else {
    const lastChild = getItem(map, item.children.last(null));
    return getLastNode(map, lastChild);
  }
};

export const getPrevItem = (map: ItemMap, item: Item, parent?: Item): Item => {
  parent = parent || getItem(map, item.parent);
  const position = getItemPosition(item.id, parent);
  if (position === 0) {
    return parent;
  } else {
    const prev = getItem(map, parent.children.get(position - 1, null));
    return getLastNode(map, prev);
  }
};

const getNextSibling = (map: ItemMap, item: Item): ID => {
  const parent = getItem(map, item.parent);
  const position = getItemPosition(item.id, parent);
  const siblingId = parent.children.get(position + 1, null);
  if (siblingId) {
    return siblingId;
  } else if (parent.parent) {
    return getNextSibling(map, parent);
  } else {
    return parent.id;
  }
};

export const getNextItemID = (map: ItemMap, item: Item): ID => {
  const firstChild = item.children.first(null);
  if (firstChild) {
    return firstChild;
  }
  const parent = getItem(map, item.parent);
  const position = getItemPosition(item.id, parent);
  const next = parent.children.get(position + 1, null);
  if (next) {
    return next;
  } else if (parent.parent) {
    return getNextSibling(map, parent);
  } else {
    return item.id;
  }
};
