import React, { createContext, useContext, useState } from 'react';

// Create the context
const PreloadContext = createContext();

// Create a provider component
export const PreloadProvider = ({ children }) => {
  const [plantModels, setPreloadModels] = useState({}); // Object to store models

  const updateModels = (modelDict) => {
    setPreloadModels(modelDict);
  };

  const removeAllModels = () => {
    setPreloadModels({});
  };

  return (
    <PreloadContext.Provider value={{ plantModels, updateModels, removeAllModels }}>
      {children}
    </PreloadContext.Provider>
  );
};

// Custom hook for easier access
export const usePreload = () => {
  return useContext(PreloadContext);
};
