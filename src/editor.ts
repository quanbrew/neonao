import { ContentState, convertFromRaw, convertToRaw, EditorState, RawDraftContentState } from 'draft-js';

export const createEditor = (content: ContentState): EditorState => {
  const editor = EditorState.createWithContent(content);
  return EditorState.set(editor, {});
};

export const createEditorWithText = (text: string = ''): EditorState => {
  const content = ContentState.createFromText(text);
  return createEditor(content);
};

export const emptyEditor: EditorState = createEditor(ContentState.createFromText(''));

export const editorFromRaw = (raw: RawDraftContentState): EditorState =>
  EditorState.createWithContent(convertFromRaw(raw));

export const editorToRow = (editor: EditorState): RawDraftContentState => convertToRaw(editor.getCurrentContent());
