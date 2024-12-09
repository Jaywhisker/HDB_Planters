import React, { createContext, useContext, useState } from 'react';

const PlantPaletteContext = createContext();

export const PlantPaletteProvider = ({ children }) => {
  const [plantPalette, setPlantPalette] = useState({});

  // Update plantPalette with a dictionary structure
  const updatePlantPalette = (filteredPlants) => {
    const paletteDictionary = filteredPlants.reduce((acc, plant) => {
      acc[plant['Species ID']] = plant;
      return acc;
    }, {});

    // Set the new dictionary to the state
    setPlantPalette(paletteDictionary);

    // Console log to verify the format
    console.log('Updated Global Plant Palette:', paletteDictionary);
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