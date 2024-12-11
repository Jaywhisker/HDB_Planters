import React, { createContext, useReducer } from 'react';

const initialState = {
  compositions: [],       // Array of the 3 generated compositions
  selectedComposition: null, // The user's chosen composition object
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_COMPOSITIONS':
      return { ...state, compositions: action.payload };
    case 'SET_SELECTED_COMPOSITION':
      return { ...state, selectedComposition: action.payload };
    case 'RESET_COMPOSITIONS':
      return { ...initialState };
    default:
      return state;
  }
}

export const CompositionContext = createContext();

export const CompositionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <CompositionContext.Provider value={{ state, dispatch }}>
      {children}
    </CompositionContext.Provider>
  );
};