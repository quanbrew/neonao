import { fromJS, List } from "immutable";
import { EditorState } from "draft-js";

const uuid1 = require('uuid/v1');


export type ID = string;


export interface Item {
  id: ID;
  parent?: ID;
  children: List<ID>;
  expand: boolean;
  editor: EditorState | null;
  source: string;
  deleted: boolean;
}

export namespace Item {
  export const create = (source: string = '', parent?: ID): Item => ({
    id: uuid1(),
    children: List(),
    editor: null,
    expand: true,
    deleted: false,
    parent,
    source,
  });

  export interface ExportedItem {
    id: ID;
    parent?: ID;
    children: Array<ID>;
    expand: boolean;
    source: string;
  }

  export const fromJSON = ({ id, expand, source, children, parent }: ExportedItem): Item => (
    {
      id, expand, source, parent,
      children: fromJS(children),
      editor: null,
      deleted: false,
    }
  );

  export const toJSON = ({ id, expand, source, children, parent }: Item): ExportedItem => (
    {
      id, expand, source, parent, children: children.toJS()
    }
  );
}
