import * as React from 'react';
import { DraftHandleValue, Editor, EditorState, getDefaultKeyBinding, RichUtils } from "draft-js";
import { isRedoKey, isUndoKey } from "../keyboard";

// import 'draft-js/dist/Draft.css';

interface Props {
  onChange: (next: EditorState) => void;
  editor: EditorState;
}

export class ItemEditor extends React.PureComponent<Props> {
  handleKeyCommand = (command: string, editorState: EditorState): DraftHandleValue => {
    if (command === 'ignore') {
      return 'handled';
    }
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.props.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };
  onFocus = () => {
  };

  onBlur = () => {
  };

  keyBindingFn = (e: React.KeyboardEvent): string | null => {
    if (isUndoKey(e) || isRedoKey(e)) {
      e.preventDefault();
      return null;
    }
    return getDefaultKeyBinding(e);
  };

  render() {
    const { editor, onChange } = this.props;
    return <Editor editorState={ editor }
                   onChange={ onChange }
                   onFocus={ this.onFocus }
                   keyBindingFn={ this.keyBindingFn }
                   handleKeyCommand={ this.handleKeyCommand }
                   onBlur={ this.onBlur }/>
  }
}
