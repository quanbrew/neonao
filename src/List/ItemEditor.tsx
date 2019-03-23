import * as React from 'react';
import { DraftHandleValue, Editor, EditorState, getDefaultKeyBinding } from "draft-js";
import { isRedoKey, isToggleKey, isUndoKey } from "../keyboard";

// import 'draft-js/dist/Draft.css';

interface Props {
  onChange: (next: EditorState) => void;
  editor: EditorState;
  editing: boolean;
  up: () => void;
  down: () => void;
  left: () => void;
  right: () => void;
  create: () => void;
  remove: () => void;
  toggle: () => void;
}

type KeyboardEvent = React.KeyboardEvent<{}>;


export class ItemEditor extends React.PureComponent<Props> {
  keyBindingFn = (e: React.KeyboardEvent): string | null => {
    if (isUndoKey(e) || isRedoKey(e)) {
      e.preventDefault();
      return null;
    } else if (isToggleKey(e)) {
      return 'toggle';
    }
    return getDefaultKeyBinding(e);
  };

  handleKeyCommand = (command: string, editorState: EditorState): DraftHandleValue => {
    switch (command) {
      case 'backspace':
        if (editorState.getCurrentContent().getPlainText().trim() === '') {
          this.props.remove();
          return 'handled';
        }
        break;
      case 'toggle':
        this.props.toggle();
        return 'handled';
    }
    return 'not-handled';
  };
  onFocus = () => {
  };

  onBlur = () => {
  };

  onTab = (e: KeyboardEvent) => {
    e.preventDefault();
    if (e.shiftKey) this.props.left();
    else this.props.right();
  };

  onUpArrow = (e: KeyboardEvent) => {
    if (e.metaKey) this.props.up();
  };
  onDownArrow = (e: KeyboardEvent) => {
    if (e.metaKey) this.props.down();
  };
  onEscape = () => {
  };

  handleReturn = (e: KeyboardEvent): DraftHandleValue => {
    e.preventDefault();
    this.props.create();
    return 'handled';
  };

  render() {
    const { editor, onChange, editing } = this.props;
    return (
      <Editor readOnly={ !editing }
              editorState={ editor }
              onChange={ onChange }
              onFocus={ this.onFocus }
              onBlur={ this.onBlur }
              keyBindingFn={ this.keyBindingFn }
              handleKeyCommand={ this.handleKeyCommand }
              stripPastedStyles
              spellCheck={ false }
              handleReturn={ this.handleReturn }
              onUpArrow={ this.onUpArrow }
              onDownArrow={ this.onDownArrow }
              onEscape={ this.onEscape }
              onTab={ this.onTab }
      />
    );
  }
}
