import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import LandscapeModel from '../component/LandscapeModel';

const SelectConfiguration = () => {

    // PlantCompositionData and PlantModels from location props
    const location = useLocation();
    const { plantCompositionData, plantModels } = location.state || {};
    console.log(plantCompositionData)    
    console.log(plantModels)

    // LayersData that will be an array of array
    // [ [layers data for composition 1], [layers data for composition 2], [layers data for composition 3] ]
    const [layersData, setLayersData] = useState(
        Array.from({ length: plantCompositionData.length }, () => ([]))
    );

    // Current index to show
    const [currentIndex, setCurrentIndex] = useState(0)

    // Navigate to next page 
    const navigate = useNavigate();
    const handleNavigation = () => {
        navigate('/test-2', { 
            state: { 
                compositionData: plantCompositionData[currentIndex], 
                plantModels, 
                compositionLayerData: layersData[currentIndex] 
                } 
            });
        };

    return (
        <div>
            {
                plantCompositionData.map((compositionData, index) => (
                    currentIndex === index 
                    // Only show LandscapeModel if currentIndex = index
                    ? <LandscapeModel 
                        index = {index}
                        plantModels = {plantModels}
                        gridArray = {compositionData['grid']}
                        coordinatesObject = {compositionData['coordinates']}
                        surroundingContext = {compositionData['surrounding_context']}
                        layersData = {layersData[index]}
                        updateLayersData = {(newData) => setLayersData(newData)}
                        allowInteraction = {false} 
                        /> 
                    : null
                ))
            }
            <button onClick={handleNavigation}>navigate to next page</button>
        </div>
    );
}

export default SelectConfiguration;