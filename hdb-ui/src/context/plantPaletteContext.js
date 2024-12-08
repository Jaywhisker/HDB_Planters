import React, { createContext, useContext, useState } from 'react';

const PlantPaletteContext = createContext();

export const PlantPaletteProvider = ({ children }) => {
  const [plantPalette, setPlantPalette] = useState([]);

  const updatePlantPalette = (filteredPlants) => {
    setPlantPalette(filteredPlants);
  };


  return (
    <PlantPaletteContext.Provider value={{ plantPalette, updatePlantPalette }}>
      {children}
    </PlantPaletteContext.Provider>
  );
};

export const usePlantPalette = () => {
  const context = useContext(PlantPaletteContext);
  if (!context) {
      throw new Error("usePlantPalette must be used within a PlantPaletteProvider");
  }
  return context;
};