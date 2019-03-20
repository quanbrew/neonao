import * as React from 'react';
import { loadTreeState, Tree } from "../tree";
import { connect } from "react-redux";
import { ID, Item } from "../Item";
import { Children } from "./Children";
import { Dispatch } from "redux";
import { create, fetchAll } from "../actions";

interface Props {
  root: Item | null;
  init: () => void;
  createEmpty: (parent: ID) => void;
}


const Loading = () => (
  <div className='page-loading'><p>Loading</p></div>
);

class Root extends React.PureComponent<Props> {
  componentDidMount(): void {
    this.props.init();
  }

  componentDidUpdate(): void {
    const { root, createEmpty } = this.props;
    if (root && root.children.size === 0) {
      createEmpty(root.id)
    }
  }

  render(): React.ReactNode {
    const { root } = this.props;

    if (root === null) return <Loading/>;
    return (
      <Children items={ root.children } loaded={ root.loaded }/>
    );
  }
}


type TStateProps = Pick<Props, 'root'>;

const mapStateToProps = ({ root, map }: Tree): TStateProps => (
  { root: root ? map.get(root, null) : null }
);

type TDispatchProps = Pick<Props, 'init' | 'createEmpty'>;

const mapDispatchToProps = (dispatch: Dispatch): TDispatchProps => {
  const init = () => {
    dispatch(fetchAll());
    loadTreeState(3).then(dispatch);
  };
  const createEmpty = (parent: ID) => dispatch(create(Item.create("", parent)));
  return { init, createEmpty };
};


export default connect<TStateProps, TDispatchProps>(mapStateToProps, mapDispatchToProps)(Root);
