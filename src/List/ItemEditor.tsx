import React, { useEffect, useRef } from 'react';
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

const keyBindingFn = (e: React.KeyboardEvent): string | null => {
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

const handleKeyCommand = (props: Props) => (command: string, editorState: EditorState): DraftHandleValue => {
  switch (command) {
    case 'backspace':
      if (
        editorState
          .getCurrentContent()
          .getPlainText()
          .trim() === ''
      ) {
        props.remove();
        return 'handled';
      }
      break;
    case 'toggle':
      props.toggle();
      return 'handled';
    case 'left':
      props.left();
      return 'handled';
    case 'right':
      props.right();
      return 'handled';
    case 'swap-up':
      props.up();
      return 'handled';
    case 'swap-down':
      props.down();
      return 'handled';
  }
  return 'not-handled';
};

const handleReturn = (props: Props) => (e: KeyboardEvent): DraftHandleValue => {
  e.preventDefault();
  props.create();
  return 'handled';
};

export const ItemEditor = (props: Props) => {
  const { editor, editing, onChange } = props;
  const classList = ['ItemEditor'];
  const editorRef = useRef<Editor>(null);
  if (editing) {
    classList.push('editing');
  }
  const prevEditing = useRef(false);

  useEffect(() => {
    if (editing !== prevEditing.current) {
      prevEditing.current = editing;
      const hasFocus = editor.getSelection().getHasFocus();
      if (editing && editorRef.current && !hasFocus) {
        editorRef.current.focus();
      }
    }
  });

  return (
    <div className={classList.join(' ')}>
      <Editor
        ref={editorRef}
        editorState={editor}
        onChange={onChange}
        keyBindingFn={keyBindingFn}
        handleKeyCommand={handleKeyCommand(props)}
        stripPastedStyles
        spellCheck={false}
        handleReturn={handleReturn(props)}
      />
    </div>
  );
};
