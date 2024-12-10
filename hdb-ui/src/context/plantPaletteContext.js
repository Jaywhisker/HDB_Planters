import React, { createContext, useContext, useState } from 'react';

const PlantPaletteContext = createContext();

export const PlantPaletteProvider = ({ children }) => {
  const [plantPaletteRaw, setPlantPaletteRaw] = useState([]); // Raw backend data for plant_palette
  const [allPlantsRaw, setAllPlantsRaw] = useState([]); // Raw backend data for all_plants
  const [plantPaletteProcessed, setPlantPaletteProcessed] = useState({}); // Processed dictionary format

  // Update the raw data from the backend
  const updateRawData = (plantPalette, allPlants) => {
    setPlantPaletteRaw(plantPalette || []);
    setAllPlantsRaw(allPlants || []);
    console.log('Raw Plant Palette:', plantPalette);
    console.log('Raw All Plants:', allPlants);
  };

  // Process and store the dictionary format
  const updateProcessedData = (filteredPlants) => {
    const paletteDictionary = filteredPlants.reduce((acc, plant) => {
      acc[plant['Species ID']] = plant;
      return acc;
    }, {});
    setPlantPaletteProcessed(paletteDictionary);
    console.log('Processed Plant Palette:', paletteDictionary);
  };

  // Dynamically update plantPaletteRaw with user selection/deselection
  const updatePlantPaletteRaw = (updatedPalette) => {
    setPlantPaletteRaw(updatedPalette);
    console.log('Plant Palette Raw Updated:', updatedPalette);
  };

  return (
    <PlantPaletteContext.Provider
      value={{
        plantPaletteRaw,
        allPlantsRaw,
        plantPaletteProcessed,
        updateRawData,
        updateProcessedData,
        updatePlantPaletteRaw,
      }}
    >
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