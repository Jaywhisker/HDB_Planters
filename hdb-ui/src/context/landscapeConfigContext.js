import React, { createContext, useReducer } from 'react';

const initialState = {
  prompt: "",
  maxPlantCount: 6,
  waterPreference: "",
  faunaAttracted: ["None"],
  nativePercentage: 0.5,
  sunlightIntensity: 50,
  droughtTolerance: false,
  style: null,
  surrounding: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload };
    case 'SET_MAX_PLANT_COUNT':
      return { ...state, maxPlantCount: action.payload };
    case 'SET_WATER_PREFERENCE':
      return { ...state, waterPreference: action.payload };
    case 'SET_FAUNA_ATTRACTED':
      return { ...state, faunaAttracted: action.payload };
    case 'SET_NATIVE_PERCENTAGE':
      return { ...state, nativePercentage: action.payload };
    case 'SET_SUNLIGHT_INTENSITY':
      return { ...state, sunlightIntensity: action.payload };
    case 'SET_DROUGHT_TOLERANCE':
      return { ...state, droughtTolerance: action.payload };
    case 'SET_STYLE':
      return { ...state, style: action.payload };
    case 'SET_SURROUNDING':
      return { ...state, surrounding: action.payload };
    case 'RESET_CONFIG':
      return { ...initialState };
    default:
      return state;
  }
}

export const LandscapeConfigContext = createContext();

export const LandscapeConfigProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <LandscapeConfigContext.Provider value={{ state, dispatch }}>
      {children}
    </LandscapeConfigContext.Provider>
  );
};