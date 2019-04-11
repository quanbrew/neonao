import React, { useCallback, useEffect, useRef } from 'react';
import { DraftHandleValue, Editor, EditorState, getDefaultKeyBinding } from 'draft-js';
import { isRedoKey, isToggleKey, isUndoKey, keyboard } from '../keyboard';
import { EditOperator } from './ListNode';

// import 'draft-js/dist/Draft.css';

interface Props extends EditOperator {
  onChange: (next: EditorState) => void;
  editor: EditorState;
  editing: boolean;
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

export const ItemEditor = ({
  editor,
  editing,
  onChange,
  create,
  toggle,
  left,
  right,
  down,
  up,
  remove,
  edit,
}: Props) => {
  const classList = ['ItemEditor'];

  if (editing) {
    classList.push('editing');
  }

  const editorRef = useRef<Editor>(null);

  // focus, if now editing this node.
  useEffect(() => {
    const hasFocus = editor.getSelection().getHasFocus();
    if (editing && editorRef.current && !hasFocus) {
      editorRef.current.focus();
    }
  }, [editing]);

  const handleReturn = useCallback(
    (e: KeyboardEvent): DraftHandleValue => {
      e.preventDefault();
      create();
      return 'handled';
    },
    [create]
  );

  const handleKeyCommand = useCallback(
    (command: string, editorState: EditorState): DraftHandleValue => {
      const content = editorState.getCurrentContent();
      switch (command) {
        case 'backspace':
          if (content.getPlainText().trim() === '') {
            remove();
            return 'handled';
          }
          break;
        case 'toggle':
          toggle();
          return 'handled';
        case 'left':
          left();
          return 'handled';
        case 'right':
          right();
          return 'handled';
        case 'swap-up':
          up();
          return 'handled';
        case 'swap-down':
          down();
          return 'handled';
      }
      return 'not-handled';
    },
    [up, down, left, right, remove, toggle]
  );

  return (
    <div className={classList.join(' ')}>
      <Editor
        ref={editorRef}
        editorState={editor}
        onChange={onChange}
        keyBindingFn={keyBindingFn}
        handleKeyCommand={handleKeyCommand}
        stripPastedStyles={true}
        spellCheck={false}
        onFocus={edit}
        handleReturn={handleReturn}
      />
    </div>
  );
};
