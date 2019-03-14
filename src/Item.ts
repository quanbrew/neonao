import { fromJS, List } from "immutable";
import { ContentState, convertFromRaw, convertToRaw, EditorState, RawDraftContentState } from "draft-js";

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
  const createEditor = (content: ContentState): EditorState => {
    const editor = EditorState.createWithContent(content);
    return EditorState.set(editor, {});
  };

  export const create = (source: string = '', parent?: ID): Item => ({
    id: uuid1(),
    children: List(),
    editor: createEditor(ContentState.createFromText(source)),
    expand: true,
    deleted: false,
    loaded: true,
    parent,
  });

  export interface ExportedItem {
    id: ID;
    parent?: ID;
    children: Array<ID>;
    expand: boolean;
    rawContent: RawDraftContentState;
  }

  export const fromJSON = ({ id, expand, rawContent, children, parent }: ExportedItem): Item => (
    {
      id, expand, parent,
      children: fromJS(children),
      editor: createEditor(convertFromRaw(rawContent)),
      deleted: false,
      loaded: children.length === 0,
    }
  );

  export const toJSON = ({ id, expand, editor, children, parent }: Item): ExportedItem => (
    {
      id, expand, parent,
      children: children.toJS(),
      rawContent: convertToRaw(editor.getCurrentContent()),
    }
  );
}
