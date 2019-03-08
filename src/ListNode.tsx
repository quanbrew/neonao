import * as React from 'react';
import { ID, Item } from "./Item";
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { TreeState } from "./reducers";
import { create } from "./actions";


interface Props {
  id: ID;
  item: Item;
  create: (id: ID) => void;
}


class ListNode extends React.Component<Props> {
  handleClick = () => {
    this.props.create(this.props.item.id);
  };

  render() {
    const children = this.props.item.children.map(
      id => <ConnectedListNode key={ id } id={ id }/>
    );

    return (
      <li><span onClick={ this.handleClick }>{ this.props.item.source }</span>
        <ul>{ children }</ul>
      </li>
    );
  }
}


type StateProps = Pick<Props, 'item'>;

const mapStateToProps = (state: TreeState, { id }: Props) => (state: TreeState): StateProps => {
  return { item: state[id] };
};


type DispatchProps = Pick<Props, 'create'>;

const mapDispatchToProps = (dispatch: Dispatch) => {
  const createItem = (id: ID) => dispatch(create(Item.create('New', id)));
  return () => ({ create: createItem });
};


export const ConnectedListNode = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ListNode);
export default ConnectedListNode;
