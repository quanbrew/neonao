import * as React from 'react';
import { DraftHandleValue, Editor, EditorState, getDefaultKeyBinding } from 'draft-js';
import { isRedoKey, isToggleKey, isUndoKey, keyboard } from '../keyboard';

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
    } else if (e.keyCode === keyboard.TAB) {
      e.preventDefault();
      if (e.shiftKey) return 'left';
      else return 'right';
    } else if (e.keyCode === keyboard.UP_ARROW) {
      if (e.shiftKey) return 'swap-up';
      return 'move-up';
    } else if (e.keyCode === keyboard.DOWN_ARROW) {
      if (e.shiftKey) return 'swap-down';
      return 'move-down';
    }
    return getDefaultKeyBinding(e);
  };

  handleKeyCommand = (command: string, editorState: EditorState): DraftHandleValue => {
    switch (command) {
      case 'backspace':
        if (
          editorState
            .getCurrentContent()
            .getPlainText()
            .trim() === ''
        ) {
          this.props.remove();
          return 'handled';
        }
        break;
      case 'toggle':
        this.props.toggle();
        return 'handled';
      case 'left':
        this.props.left();
        return 'handled';
      case 'right':
        this.props.left();
        return 'handled';
      case 'swap-up':
        this.props.up();
        return 'handled';
      case 'swap-down':
        this.props.down();
        return 'handled';
    }
    return 'not-handled';
  };
  onFocus = () => {};

  onBlur = () => {};

  handleReturn = (e: KeyboardEvent): DraftHandleValue => {
    e.preventDefault();
    this.props.create();
    return 'handled';
  };

  render() {
    const { editor, onChange } = this.props;
    return (
      <Editor
        editorState={editor}
        onChange={onChange}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        keyBindingFn={this.keyBindingFn}
        handleKeyCommand={this.handleKeyCommand}
        stripPastedStyles
        spellCheck={false}
        handleReturn={this.handleReturn}
      />
    );
  }
}
