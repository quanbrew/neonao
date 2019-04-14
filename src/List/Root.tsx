import React, { useEffect } from 'react';
import { Item } from '../Item';
import { Children } from './Children';
import * as actions from '../actions';
import { gotoNext } from '../actions';
import { useDispatch } from './List';
import { Editor } from './Editor';
import { editMode, Mode, normalMode } from '../tree';
import { EDIT_MODE } from '../constants';

interface Props {
  root: Item;
  mode: Mode;
}

const useAutoCreate = (root: Item) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (root.children.size === 0) {
      dispatch(actions.create(Item.create('Ctrl/Command + . : toggle item', root.id)));
      dispatch(actions.create(Item.create('Ctrl/Command + ↑/↓ : swap item', root.id)));
    }
  }, [root]);
};

const empty = () => {
  // empty function
};

const Root = ({ root, mode }: Props) => {
  useAutoCreate(root);
  const dispatch = useDispatch();
  const handleChange = (text: string) => {
    dispatch(actions.edit(root.id, text));
  };
  const editing = mode.type === EDIT_MODE && mode.id === root.id;
  const edit = () => {
    dispatch(actions.switchMode(editMode(root.id)));
  };
  const exitEdit = () => {
    dispatch(actions.switchMode(normalMode()));
  };
  const create = () => {
    const newItem = Item.create('', root.id);
    dispatch(actions.create(newItem));
  };
  const goNext = () => {
    dispatch(gotoNext(root.id));
  };

  return (
    <div>
      <Editor
        onChange={handleChange}
        source={root.source}
        editing={editing}
        modified={root.modified}
        swapUp={empty}
        swapDown={empty}
        unIndent={empty}
        indent={empty}
        create={create}
        remove={empty}
        toggle={empty}
        edit={edit}
        gotoNext={goNext}
        gotoPrev={empty}
        exitEdit={exitEdit}
      />
      <Children item={root} parentDragging={false} />
    </div>
  );
};

export default Root;
