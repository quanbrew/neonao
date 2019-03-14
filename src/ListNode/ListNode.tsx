import * as React from 'react';
import { ID, Item } from "../Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { DraftHandleValue, Editor, EditorState, getDefaultKeyBinding, RichUtils } from 'draft-js';
import { Tree } from "../tree";
import { create, edit, loadItemState, remove, undo, update } from "../actions";
import './ListNode.css';
import iconRemove from "./delete.svg";
import iconCreate from "./plus-square.svg";
import { isRedoKey, isUndoKey } from "../keyboard";


export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const IconRemove = (props: ImageProps) => (
  <img src={ iconRemove } alt="Remove" { ...props } />
);

export const IconCreate = (props: ImageProps) => (
  <img src={ iconCreate } alt="Create" { ...props } />
);



interface Props {
  id: ID;
  item: Item;
  create: () => void;
  remove: () => void;
  undo: () => void;
  update: (item: Item, record: boolean) => void;
  edit: (id: ID, editor: EditorState) => void;
  load: (item: Item) => void;
}


interface State {
}


class ListNode extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
  }


  renderChild = (childID: ID) => <ConnectedListNode key={ childID } id={ childID }/>;

  dummyChildren = () => {
    const length = this.props.item.children.size;
    let dummyList = [];
    for (let i = 0; i < length; i++) {
      dummyList.push(<li key={ i }>Loading...</li>);
    }
    return dummyList;
  };

  renderChildren = () => {
    const { item } = this.props;
    if (item.loaded) {
      return <ul>{ item.children.map(this.renderChild) }</ul>
    } else {
      return <ul>{ this.dummyChildren() }</ul>
    }
  };

  onChange = (editor: EditorState) => {
    const { item, edit } = this.props;
    edit(item.id, editor);
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

  handleKeyCommand = (command: string, editorState: EditorState): DraftHandleValue => {
    if (command === 'ignore') {
      return 'handled';
    }
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  componentDidMount() {
    const { item, load } = this.props;
    if (!item.loaded) {
      load(item)
    }
  }

  render() {
    const { remove, create } = this.props;

    return (
      <li className="ListNode">
        <Editor editorState={ this.props.item.editor }
                onChange={ this.onChange }
                onFocus={ this.onFocus }
                keyBindingFn={ this.keyBindingFn }
                handleKeyCommand={ this.handleKeyCommand }
                onBlur={ this.onBlur }/>
        <IconCreate className="icon create-item" onClick={ create }/>
        <IconRemove className="icon remove-item" onClick={ remove }/>
        { this.renderChildren() }
      </li>
    );
  }
}


type StateProps = Pick<Props, 'item'>;

const mapStateToProps = (state: Tree, { id }: Props) => (state: Tree): StateProps => {
  const item = state.map.get(id) as Item;
  return { item };
};


type DispatchProps = Pick<Props,
  | 'create'
  | 'remove'
  | 'load'
  | 'update'
  | 'undo'
  | 'edit'>;

const mapDispatchToProps = (dispatch: Dispatch, props: Pick<Props, 'id'>) => {
  const id = props.id;
  const createItem = () => dispatch(create(Item.create("", id)));
  const removeItem = () => dispatch(remove(id));
  const load: Props['load'] = item => loadItemState(item).then(dispatch);
  const performEdit: Props['edit'] = (id, editor) => {
    dispatch(edit(id, editor))
  };
  const updateItem: Props['update'] = (item, record) => dispatch(update(item, record));
  const performUndo = () => dispatch(undo);
  return (): DispatchProps => ({
    create: createItem,
    remove: removeItem,
    load,
    update: updateItem,
    undo: performUndo,
    edit: performEdit,
  });
};


export const ConnectedListNode = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ListNode);
export default ConnectedListNode;
