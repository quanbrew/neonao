import * as React from 'react';
import { ID, Item } from "../Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { DraftHandleValue, Editor, EditorState, getDefaultKeyBinding, RichUtils } from 'draft-js';
import { loadItemState, Tree } from "../tree";
import { create, edit, moveIntoPrev, moveUnder, relativeMove, remove, undo, update } from "../actions";
import './ListNode.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faPlusSquare,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { isRedoKey, isUndoKey } from "../keyboard";

// import 'draft-js/dist/Draft.css';


interface Props {
  id: ID;
  item: Item;
  create: () => void;
  remove: () => void;
  up: (item: Item) => void;
  down: (item: Item) => void;
  left: (item: Item) => void;
  right: (item: Item) => void;
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

  up = () => this.props.up(this.props.item);
  down = () => this.props.down(this.props.item);
  left = () => this.props.left(this.props.item);
  right = () => this.props.right(this.props.item);

  toolbar() {
    const { remove, create } = this.props;

    if (this.props.item.parent) {
      return (
        <div className='toolbar'>
          <a className="icon create-item" onClick={ create }><FontAwesomeIcon icon={ faPlusSquare }/></a>
          <a className="icon remove-item" onClick={ remove }><FontAwesomeIcon icon={ faTrash }/></a>
          <a className="icon move-item" onClick={ this.up }><FontAwesomeIcon icon={ faChevronUp }/></a>
          <a className="icon move-item" onClick={ this.down }><FontAwesomeIcon icon={ faChevronDown }/></a>
          <a className="icon move-item" onClick={ this.left }><FontAwesomeIcon icon={ faChevronLeft }/></a>
          <a className="icon move-item" onClick={ this.right }><FontAwesomeIcon icon={ faChevronRight }/></a>
        </div>
      )
    } else {
      return (
        <div className="toolbar">
          <a className="icon create-item" onClick={ create }>
            <FontAwesomeIcon icon={ faPlusSquare }/>
          </a>
        </div>
      )
    }
  }

  render() {

    return (
      <li className="ListNode">
        <Editor editorState={ this.props.item.editor }
                onChange={ this.onChange }
                onFocus={ this.onFocus }
                keyBindingFn={ this.keyBindingFn }
                handleKeyCommand={ this.handleKeyCommand }
                onBlur={ this.onBlur }/>
        { this.toolbar() }
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
  | 'edit'
  | 'left'
  | 'right'
  | 'up'
  | 'down'>;

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
  const up: Props['up'] = item => {
    if (item.parent) dispatch(relativeMove(item.id, item.parent, -1));
  };
  const down: Props['down'] = item => {
    if (item.parent) dispatch(relativeMove(item.id, item.parent, 1));
  };
  const left: Props['left'] = item => {
    if (item.parent) dispatch(moveUnder(item.id, item.parent, item.parent));
  };
  const right: Props['right'] = item => {
    if (item.parent) dispatch(moveIntoPrev(item.id, item.parent));
  };
  return (): DispatchProps => ({
    create: createItem,
    remove: removeItem,
    load, up, down, left, right,
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
