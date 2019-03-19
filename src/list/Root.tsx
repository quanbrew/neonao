import * as React from 'react';
import { Tree } from "../tree";
import { connect } from "react-redux";
import { Item } from "../Item";
import { Children } from "./Children";

interface Props {
  root: Item | null;
}


const Root = ({ root }: Props) => {
  if (root === null) {
    return (
      <div className='page-loading'><p>Loading</p></div>
    )
  } else {
    return (
      <div className='root-item'>
        <div className='items'><Children items={ root.children } loaded={ root.loaded }/></div>
      </div>
    );
  }
};

const mapStateToProps = ({ root, map }: Tree): Pick<Props, 'root'> => (
  { root: root ? map.get(root, null) : null }
);

export default connect<Props>(mapStateToProps)(Root);
