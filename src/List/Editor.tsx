import React, { useEffect, useRef, useState } from 'react';
import { EditOperator } from './ListNode';
import { isRedoKey, isToggleKey, isUndoKey, keyboard } from '../keyboard';
import './Editor.scss';

interface Props extends EditOperator {
  onChange: (next: string) => void;
  source: string;
  editing: boolean;
  modified: number;
}

type Input = HTMLTextAreaElement;

const useAutoFocus = (inputRef: React.RefObject<Input>, editing: boolean) => {
  useEffect(() => {
    if (editing && inputRef.current) {
      if (inputRef.current !== document.activeElement) {
        inputRef.current.focus();
      }
    }
  }, [editing]);
};

const useAutoHeight = (text: string, inputRef: React.RefObject<Input>) => {
  const threshold = 4;
  const additionPx = 2;

  const prevText = useRef(text);
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      const isContentReduce = text.length < prevText.current.length;
      let oldHeightStyle = null;
      const height = input.clientHeight;
      if (isContentReduce) {
        oldHeightStyle = input.style.height;
        input.style.height = '5px';
      }
      const scrollHeight = input.scrollHeight;
      if (Math.abs(height - scrollHeight) > threshold) {
        input.style.height = `${scrollHeight + additionPx}px`;
      } else if (isContentReduce) {
        input.style.height = oldHeightStyle;
      }
    }
  }, [text]);
  prevText.current = text;
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

  useAutoHeight(cache, inputRef);

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

  const composition = useRef(false);
  const onCompositionStart: React.CompositionEventHandler = () => {
    composition.current = true;
  };
  const onCompositionEnd: React.CompositionEventHandler<Input> = e => {
    composition.current = false;
    onChange(e.currentTarget.value);
  };

  const delta = 200;
  const handleChange: React.ChangeEventHandler<Input> = e => {
    const text = e.currentTarget.value;
    setCache(text);
    cacheModified.current = Date.now();
    if (!composition.current) {
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

  const classList = ['Editor'];
  if (editing) {
    classList.push('editing');
  }
  return (
    <div className={classList.join(' ')}>
      <textarea
        className="node-input"
        ref={inputRef}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        value={cache}
        onChange={handleChange}
        onCompositionStart={onCompositionStart}
        onCompositionEndCapture={onCompositionEnd}
      />
    </div>
  );
};
