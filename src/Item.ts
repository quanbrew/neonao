import { List } from 'immutable';

const uuid1 = require('uuid/v1');

export type ID = string;

export interface Item {
  id: ID;
  parent?: ID;
  children: List<ID>;
  expand: boolean;
  source: string;
  deleted: boolean;
  loaded: boolean;
  modified: number;
}

export namespace Item {
  export const create = (source: string, parent?: ID): Item => ({
    id: uuid1(),
    children: List(),
    source,
    expand: true,
    deleted: false,
    loaded: true,
    parent,
    modified: Date.now(),
  });
}
