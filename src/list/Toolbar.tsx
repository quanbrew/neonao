import * as React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faPlusSquare,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import './Toolbar.css';

interface Props {
  up: () => void;
  down: () => void;
  left: () => void;
  right: () => void;
  create: () => void;
  remove: () => void;
}


export const Toolbar = ({ up, down, left, right, create, remove }: Props) => (
  <div className='Toolbar'>
    <a className="icon create-item" onClick={ create }><FontAwesomeIcon icon={ faPlusSquare }/></a>
    <a className="icon remove-item" onClick={ remove }><FontAwesomeIcon icon={ faTrash }/></a>
    <a className="icon move-item" onClick={ up }><FontAwesomeIcon icon={ faChevronUp }/></a>
    <a className="icon move-item" onClick={ down }><FontAwesomeIcon icon={ faChevronDown }/></a>
    <a className="icon move-item" onClick={ left }><FontAwesomeIcon icon={ faChevronLeft }/></a>
    <a className="icon move-item" onClick={ right }><FontAwesomeIcon icon={ faChevronRight }/></a>
  </div>
);
