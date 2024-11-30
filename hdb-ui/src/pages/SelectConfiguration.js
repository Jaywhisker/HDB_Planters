import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import LandscapeModel from '../component/LandscapeModel';
import { usePreload } from '../context/preloadContext';

const SelectConfiguration = () => {
    const location = useLocation();
    const { plantCompositionData } = location.state || {};
    const { plantModels } = usePreload();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [layersData, setLayersData] = useState(
        plantCompositionData?.length > 0
            ? Array.from({ length: plantCompositionData.length }, () => ([]))
            : []
    );
    const navigate = useNavigate();
    

    const handleNavigation = () => {
        if (plantCompositionData[currentIndex]) {
            navigate('/test-2', {
                state: {
                    compositionData: plantCompositionData[currentIndex],
                    compositionLayerData: layersData[currentIndex],
                },
            });
        }
    };

    // If no composition data, render an error message
    if (!plantCompositionData || !plantCompositionData.length) {
        return <p>No composition data available. Please return to the previous step.</p>;
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {plantCompositionData.map((compositionData, index) =>
                currentIndex === index ? (
                    <Canvas
                        shadows
                        style={{ width: '100%', height: '100%' }}
                        camera={{
                            position: [100, 100, 100],
                            fov: 50,
                        }}
                        key={index}
                    >
                        <LandscapeModel
                            index={index}
                            plantModels={plantModels}
                            gridArray={compositionData['grid']}
                            coordinatesObject={compositionData['coordinates']}
                            surroundingContext={compositionData['surrounding_context']}
                            layersData={layersData[index]}
                            updateLayersData={(newData) => {
                                const updatedLayers = [...layersData];
                                updatedLayers[index] = newData;
                                setLayersData(updatedLayers);
                            }}
                            allowInteraction={false}
                        />
                    </Canvas>
                ) : null
            )}

            <button
                style={{ position: 'absolute', bottom: '10px', left: '50%' }}
                onClick={handleNavigation}
            >
                Navigate to next page
            </button>
        </div>
    );
};

export default SelectConfiguration;
