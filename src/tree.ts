import { fromJS, List, Map } from 'immutable';
import { Id, Item } from './Item';
import { loadedState, LoadedState, patch, Patch } from './actions';

import(
  /* webpackChunkName: "localforage" */
  'localforage'
);

export type ItemMap = Map<Id, Item>;

export interface Tree {
  root: Id;
  map: ItemMap;
}

export const saveTreeState = async (state: Tree | null) => {
  if (!state) return;
  const localForage = await import('localforage');
  if (!state.root) return;
  await localForage.setItem('root', state.root);
  const toJSON = ({ id, expand, source, children, parent, modified, created }: Item): ExportedItem => ({
    id,
    expand,
    parent,
    children: children.toJS(),
    source,
    modified,
    created,
  });
  state.map.forEach((item: Item, key: Id) => localForage.setItem(key, toJSON(item)));
  console.debug('saved');
};

const getItemByIdFromStorage = async (id: Id): Promise<Item> => {
  const localForage = await import('localforage');
  const raw = await localForage.getItem<ExportedItem>(id);
  const fromJson = (imported: ExportedItem): Item => {
    const { id, children, source, parent, expand } = imported;
    const now = Date.now();
    return {
      id,
      children: fromJS(children),
      source,
      parent,
      deleted: false,
      created: imported.created || now,
      expand: expand || expand === undefined,
      modified: imported.modified || now,
    };
  };
  if (raw) {
    return fromJson(raw);
  } else {
    throw new NotFound(id);
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
    }
  }

  return await map;
};

const loadParent = async (item: Item, map: ItemMap | null = null): Promise<ItemMap> => {
  if (!item.parent) {
    return Map({ [item.id]: item });
  }
  let parent;
  if (map) {
    parent = map.get(item.parent, null);
  }
  if (!parent) {
    parent = await getItemByIdFromStorage(item.parent);
  }
  const parentMap = await loadParent(parent, map);
  return parentMap.set(item.id, item);
};

export interface ExportedItem {
  id: Id;
  parent?: Id;
  children: Id[];
  source: string;
  expand?: boolean;
  modified?: number;
  created?: number;
}

const createEmptyState = async (): Promise<LoadedState> => {
  const root = Item.create('');
  const rootId = root.id;
  const map: ItemMap = Map({ [rootId]: root });
  const state = { root: rootId, map };
  return loadedState(state);
};

export const pathInMap = (map: ItemMap, id: Id | null): boolean => {
  while (id) {
    const item = map.get(id, null);
    if (!item) {
      return false;
    }
    id = item.parent || null;
  }
  return true;
};

export const loadItemState = async (item: Item, maxLevel: number = 2): Promise<Patch> => {
  const map = await loadChildren(item, maxLevel);
  return await patch({ map });
};

export const patchTree = async (map: ItemMap, fromId: Id): Promise<Patch> => {
  const start = await getItemByIdFromStorage(fromId);
  map = map.merge(await loadParent(start, map));
  return await patch({ map });
};

export const loadTree = async (fromId: Id | null): Promise<LoadedState> => {
  const localForage = await import('localforage');
  const root = await localForage.getItem<Id>('root');
  if (!root) {
    return await createEmptyState();
  }
  const start = await getItemByIdFromStorage(fromId || root);
  if (!start) {
    throw Error('unable load item');
  }
  const map = await loadParent(start);
  return await loadedState({ root, map });
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
  if (item.children.size === 0 || !item.expand) {
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
    if (prev.expand && prev.children.size > 0) {
      return getLastNode(map, prev);
    } else {
      return prev;
    }
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
  if (item.expand && firstChild) {
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

export const getUnloadItemId = (map: ItemMap, idList: List<Id>): List<Id> => {
  return idList.filter(id => !map.has(id));
};

export const getPath = (map: ItemMap, id?: Id): List<Item> => {
  if (!id) {
    return List();
  } else {
    const item = getItem(map, id);
    return getPath(map, item.parent).push(item);
  }
};
