import { fromJS, List, Map } from 'immutable';
import { Id, Item } from './Item';
import { loadedState, LoadedState, patch, Patch } from './actions';
import { DETAIL_MODE, DRAG_MODE, EDIT_MODE, NORMAL_MODE, SELECT_MODE } from './constants';

import(
  /* webpackChunkName: "localforage" */
  'localforage'
);

export type ItemMap = Map<Id, Item>;

export interface Tree {
  root: Id;
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
  id: Id;
}

export const editMode = (id: Id): EditMode => ({
  type: EDIT_MODE,
  id,
});

export interface SelectMode {
  type: typeof SELECT_MODE;
  selected: Id[];
  cut: boolean;
}

export interface DetailMode {
  type: typeof DETAIL_MODE;
  id: Id;
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
  state.map.forEach((item: Item, key: Id) => localForage.setItem(key, toJSON(item)));
  console.debug('saved');
};

const getItemByIdFromStorage = async (id: Id): Promise<Item | null> => {
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
    return fromJSON(raw);
  } else {
    return null;
  }
};

const loadChildren = async (item: Item | null, maxLevel: number): Promise<ItemMap> => {
  const mapper = async (childId: Id): Promise<ItemMap> => {
    const item = await getItemByIdFromStorage(childId);
    return loadChildren(item, maxLevel - 1);
  };

  let map: ItemMap = Map();
  if (item) {
    map = map.set(item.id, item);
    if (maxLevel > 0) {
      const childrenMaps = await Promise.all(item.children.map(mapper));
      return await map.merge(...childrenMaps);
    } else if (item.children.size > 0) {
      item.loaded = false;
    }
  }

  return await map;
};

const loadParent = async (item: Item): Promise<ItemMap> => {
  if (!item.parent) {
    return Map({ [item.id]: item });
  }
  const parent = await getItemByIdFromStorage(item.parent);
  if (!parent) {
    throw Error('unable load item');
  }
  const parentMap = await loadParent(parent);
  return parentMap.set(item.id, item);
};

export interface ExportedItem {
  id: Id;
  parent?: Id;
  children: Id[];
  expand: boolean;
  modified: number;
  source: string;
}

const createEmptyState = async (): Promise<LoadedState> => {
  const root = Item.create('root');
  const rootId = root.id;
  const map: ItemMap = Map({ [rootId]: root });
  const state = { root: rootId, map, mode: normalMode() };
  return loadedState(state);
};

export const loadItemState = async (item: Item, maxLevel: number = 2): Promise<Patch> => {
  let map = await loadChildren(item, maxLevel);
  map = map.set(item.id, { ...item, loaded: true });
  return await patch({ map });
};

export const loadListState = async (maxLevel: number = 16, fromId: Id | null): Promise<LoadedState> => {
  const localForage = await import('localforage');
  const root = await localForage.getItem<Id>('root');
  if (!root) {
    return await createEmptyState();
  }
  const start = await getItemByIdFromStorage(fromId || root);
  if (!start) {
    throw Error('unable load item');
  }
  const childMap = await loadChildren(start, maxLevel);
  const parentMap = await loadParent(start);
  const map = childMap.merge(parentMap);
  return await loadedState({ root, map, mode: normalMode() });
};

export const isChildrenOf = (map: ItemMap, child: Id, parent: Id): boolean => {
  if (child === parent) return false;
  let now = map.get(child) || null;
  while (now && now.id !== parent && now.parent) {
    now = map.get(now.parent) || null;
  }
  return now ? now.id === parent : false;
};

export class NotFound extends Error {
  id: Id | null;

  constructor(id: Id | null = null) {
    super('Some node not found');
    Object.setPrototypeOf(this, NotFound.prototype);
    this.id = id;
  }
}

export const getItem = (map: ItemMap, id: Id | null | undefined): Item => {
  if (!id) throw new NotFound();
  const item = map.get(id) || null;
  if (!item) {
    throw new NotFound(id);
  }
  return item;
};
export const getItemAndParent = (map: ItemMap, id: Id | null | undefined): [Item, Item] => {
  const item = getItem(map, id);
  const parent = getItem(map, item.parent);
  return [item, parent];
};

export const getItemPosition = (id: Id, parent: Item): number => {
  const index = parent.children.indexOf(id);
  if (index < 0) throw Error("can't get item position in parent");
  return index;
};

export const mergeTree = (old: Tree, next: Partial<Tree>): Tree => {
  const map = next.map ? old.map.merge(next.map) : old.map;
  return { ...old, ...next, map };
};

const resetItemParent = (map: ItemMap, id: Id, parent: Id): ItemMap => {
  const item = getItem(map, id);
  return map.set(id, { ...item, parent });
};

export const moveInto = (map: ItemMap, id: Id, parentId: Id, nextParentId: Id, order: number): ItemMap => {
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

const getNextSibling = (map: ItemMap, item: Item): Id => {
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

export const getNextItemId = (map: ItemMap, item: Item): Id => {
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

export const getUnloadItemId = (map: ItemMap, children: List<Id>): List<Id> => {
  return children.filter(id => !map.has(id));
};

export const getPath = (map: ItemMap, id?: Id): List<Item> => {
  if (!id) {
    return List();
  } else {
    const item = getItem(map, id);
    return getPath(map, item.parent).push(item);
  }
};
