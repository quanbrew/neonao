import { List } from 'immutable';
import { EditorState } from 'draft-js';

const uuid1 = require('uuid/v1');

export type ID = string;

export interface Item {
  id: ID;
  parent?: ID;
  children: List<ID>;
  expand: boolean;
  editor: EditorState;
  deleted: boolean;
  loaded: boolean;
}

export namespace Item {
  export const create = (editor: EditorState, source: string = '', parent?: ID): Item => ({
    id: uuid1(),
    children: List(),
    editor,
    expand: true,
    deleted: false,
    loaded: true,
    parent,
  });
}
