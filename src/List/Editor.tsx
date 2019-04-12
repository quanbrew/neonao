import React, { useEffect, useRef } from 'react';
import { EditOperator } from './ListNode';
import { isRedoKey, isToggleKey, isUndoKey, keyboard } from '../keyboard';
import { Simulate } from 'react-dom/test-utils';
import input = Simulate.input;

interface Props extends EditOperator {
  onChange: (next: string) => void;
  source: string;
  editing: boolean;
}

type Input = HTMLInputElement;

export const Editor = ({ source, onChange, toggle, left, right, edit, up, down, create, editing }: Props) => {
  const handleChange: React.ChangeEventHandler<Input> = e => {
    onChange(e.currentTarget.value);
  };

  const inputRef = useRef<Input>(null);

  // focus, if now editing this node.
  useEffect(() => {
    if (editing && inputRef.current) {
      if (inputRef.current !== document.activeElement) {
        inputRef.current.focus();
      }
    }
  }, [editing]);

  const handleKeyDown: React.KeyboardEventHandler = e => {
    if (isUndoKey(e) || isRedoKey(e)) {
      e.preventDefault();
    } else if (isToggleKey(e)) {
      e.preventDefault();
      toggle();
    } else if (e.keyCode === keyboard.TAB) {
      e.preventDefault();
      if (e.shiftKey) {
        left();
      } else {
        right();
      }
    } else if (e.keyCode === keyboard.UP_ARROW) {
      e.preventDefault();
      if (e.shiftKey) {
        up();
      }
    } else if (e.keyCode === keyboard.DOWN_ARROW) {
      e.preventDefault();
      if (e.shiftKey) {
        down();
      }
    } else if (e.keyCode === keyboard.ENTER) {
      e.preventDefault();
      create();
    }
  };

  const onFocus: React.FocusEventHandler<Input> = () => {
    if (!editing) {
      edit();
    }
  };

  const onBlur: React.FocusEventHandler<Input> = () => {
    if (editing) {
      // TODO: switch mode
    }
  };
  const classList = ['ItemEditor'];
  if (editing) {
    classList.push('editing');
  }
  return (
    <input
      className={classList.join(' ')}
      ref={inputRef}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      value={source}
      onChange={handleChange}
    />
  );
};
