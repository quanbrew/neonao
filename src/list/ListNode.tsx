import * as React from 'react';

import { ID, Item } from "../Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import {
  ConnectDragSource,
  ConnectDropTarget,
  DragSource,
  DragSourceCollector,
  DragSourceSpec,
  DropTarget,
  DropTargetCollector,
  DropTargetSpec
} from "react-dnd";
import { DraftHandleValue, Editor, EditorState, getDefaultKeyBinding, RichUtils } from 'draft-js';
import { dragMode, loadItemState, normalMode, Tree, willMoveAt } from "../tree";
import {
  addIndent,
  applyDrop,
  create,
  edit,
  ItemAction,
  moveNear,
  relativeMove,
  remove,
  switchMode,
  undo,
  update
} from "../actions";
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
import { DRAG_MODE, ITEM } from "../constants";
import { findDOMNode } from "react-dom";
import { Children } from "./Children";

// import 'draft-js/dist/Draft.css';


export interface Props {
  id: ID;
  item: Item;
  create: () => void;
  remove: () => void;
  up: (item: Item) => void;
  down: (item: Item) => void;
  right: (item: Item) => void;
  undo: () => void;
  update: (item: Item, record: boolean) => void;
  edit: (id: ID, editor: EditorState) => void;
  load: (item: Item) => void;
  moveBelow: (item: Item, over: ID) => void;
  moveAbove: (item: Item, under: ID) => void;
  dispatch: (action: ItemAction) => void;
  movePosition: 'above' | 'below' | null;
}


interface State {
  hoverPosition: 'above' | 'below' | null;
}


interface SourceProps {
  isDragging: boolean;
  connectDragSource: ConnectDragSource;
}


interface TargetProps {
  connectDropTarget: ConnectDropTarget;
  canDrop: boolean;
  isOver: boolean;
}


const nodeSource: DragSourceSpec<Props, Item> = {
  beginDrag: ({ item, dispatch }) => {
    dispatch(switchMode(dragMode()));
    return item;
  },
  canDrag: ({ item }) => item.parent !== undefined,
  endDrag: (props, monitor) => {
    const draggingItem: Item = monitor.getItem();
    const { id, parent } = draggingItem;
    if (parent) props.dispatch(applyDrop(id, parent));
    props.dispatch(switchMode(normalMode()));
  },
};


const nodeTarget: DropTargetSpec<Props> = {
  hover: (props, monitor, component: RawListNode | null) => {
    if (!component || !props.item.parent) return;
    if (!monitor.isOver({ shallow: true })) return;

    const draggingItem: Item = monitor.getItem();
    if (draggingItem.id === props.item.id) return;

    // Determine rectangle on screen
    const hoverBoundingRect = (findDOMNode(component) as Element).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    if (!clientOffset) return;

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;
    const position = hoverClientY > hoverMiddleY ? 'below' : 'above';
    if (position === props.movePosition) return;
    console.log(position, props.movePosition);
    const mode = dragMode(willMoveAt(props.item.id, position));
    props.dispatch(switchMode(mode));
  },
};


const sourceCollect: DragSourceCollector<SourceProps> = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};


const targetCollect: DropTargetCollector<TargetProps> = (connect, monitor) => {
  const isOver = monitor.isOver({ shallow: true });
  return {
    connectDropTarget: connect.dropTarget(),
    isOver,
    canDrop: monitor.canDrop(),
  };
};


type RawListNodeProps = Props & SourceProps & TargetProps;

export class RawListNode extends React.Component<RawListNodeProps, State> {
  nodeRef: React.RefObject<HTMLDivElement>;

  constructor(props: RawListNodeProps) {
    super(props);
    this.nodeRef = React.createRef();
    this.state = { hoverPosition: null };
  }

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
    if (!item.loaded) load(item);
  }

  up = () => this.props.up(this.props.item);
  down = () => this.props.down(this.props.item);
  left = () => {
    const { moveBelow, item } = this.props;
    if (item.parent) moveBelow(item, item.parent);
  };
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
    let classNames = ['ListNode'];
    const { isDragging, isOver, connectDragSource, movePosition, connectDropTarget, item } = this.props;
    const bullet = connectDragSource(<div className='bullet'>•</div>);

    if (isDragging) {
      classNames.push('dragging');
    }
    if (isOver && !isDragging) classNames.push('is-over');
    const above = movePosition === 'above' ? <div className='hover'/> : null;
    const below = movePosition === 'below' ? <div className='hover'/> : null;
    return connectDropTarget(
      <div className={ classNames.join(' ') } ref={ this.nodeRef }>
        { bullet }
        { above }
        { connectDragSource(<div className='bullet'>•</div>) }
        <Editor editorState={ this.props.item.editor }
                onChange={ this.onChange }
                onFocus={ this.onFocus }
                keyBindingFn={ this.keyBindingFn }
                handleKeyCommand={ this.handleKeyCommand }
                onBlur={ this.onBlur }/>
        { this.toolbar() }
        <Children items={ item.children } loaded={ item.loaded }/>
        { below }
      </div>
    );
  }
}


type StateProps = Pick<Props, 'item' | 'movePosition'>;

const mapStateToProps = (state: Tree, { id }: Props) => (state: Tree): StateProps => {
  const item = state.map.get(id) as Item;
  let movePosition: Props['movePosition'] = null;
  if (state.mode.type === DRAG_MODE && state.mode.willMoveAt && state.mode.willMoveAt.target === id)
    movePosition = state.mode.willMoveAt.position;
  return { item, movePosition };
};


type DispatchProps = Pick<Props,
  | 'moveBelow'
  | 'moveAbove'
  | 'create'
  | 'remove'
  | 'load'
  | 'update'
  | 'undo'
  | 'edit'
  | 'right'
  | 'up'
  | 'dispatch'
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
  const right: Props['right'] = item => {
    if (item.parent) dispatch(addIndent(item.id, item.parent));
  };
  const moveBelow = (item: Item, over: ID) => {
    if (item.parent) dispatch(moveNear(item.id, item.parent, over, 1));
  };
  const moveAbove = (item: Item, under: ID) => {
    if (item.parent) dispatch(moveNear(item.id, item.parent, under, 0));
  };
  return (): DispatchProps => ({
    create: createItem,
    remove: removeItem,
    load, up, down, right, moveBelow, moveAbove, dispatch,
    update: updateItem,
    undo: performUndo,
    edit: performEdit,
  });
};

const DragSourceListNode = DragSource<Props, SourceProps>(ITEM, nodeSource, sourceCollect)(RawListNode);
const DropTargetListNode = DropTarget<Props, TargetProps>(ITEM, nodeTarget, targetCollect)(DragSourceListNode);
const ListNode = connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(DropTargetListNode);
export default ListNode;
