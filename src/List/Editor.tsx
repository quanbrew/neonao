import React, { useEffect, useRef, useState } from 'react';
import { EditOperator } from './ListNode';
import { isRedoKey, isToggleKey, isUndoKey, keyboard } from '../keyboard';
import { Simulate } from 'react-dom/test-utils';
import input = Simulate.input;

interface Props extends EditOperator {
  onChange: (next: string) => void;
  source: string;
  editing: boolean;
  modified: number;
}

type Input = HTMLInputElement;

const useAutoFocus = (inputRef: React.RefObject<Input>, editing: boolean) => {
  useEffect(() => {
    if (editing && inputRef.current) {
      if (inputRef.current !== document.activeElement) {
        inputRef.current.focus();
      }
    }
  }, [editing]);
};

export const Editor = ({ source, onChange, toggle, left, right, edit, up, down, create, editing, modified }: Props) => {
  const submitTimer = useRef<number | null>(null);
  const cacheModified = useRef<number>(Date.now());

  const [cache, setCache] = useState(source);

  // synchronize source and cache
  useEffect(() => {
    if (source !== cache) {
      setCache(source);
    }
  }, [modified, source]);

  const inputRef = useRef<Input>(null);

  useAutoFocus(inputRef, editing);

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

  const [composition, setComposition] = useState(false);
  const onCompositionStart: React.CompositionEventHandler = () => {
    if (!composition) {
      setComposition(true);
    }
  };
  const onCompositionEnd: React.CompositionEventHandler<Input> = e => {
    if (composition) {
      setComposition(false);
      onChange(e.currentTarget.value);
    }
  };

  const delta = 200;
  const handleChange: React.ChangeEventHandler<Input> = e => {
    const text = e.currentTarget.value;
    setCache(text);
    cacheModified.current = Date.now();
    if (!composition) {
      if (submitTimer.current) {
        clearTimeout(submitTimer.current);
      }
      submitTimer.current = window.setTimeout(() => {
        if (text !== source) {
          onChange(text);
        }
      }, delta);
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
      value={cache}
      onChange={handleChange}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
    />
  );
};
