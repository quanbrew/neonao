import { List } from 'immutable';

const uuid1 = require('uuid/v1');

export type Id = string;

export interface Item {
  id: Id;
  parent?: Id;
  children: List<Id>;
  expand: boolean;
  source: string;
  deleted: boolean;
  modified: number;
}

export namespace Item {
  export const create = (source: string, parent?: Id): Item => ({
    id: uuid1(),
    children: List(),
    source,
    expand: true,
    deleted: false,
    parent,
    modified: Date.now(),
  });
}
