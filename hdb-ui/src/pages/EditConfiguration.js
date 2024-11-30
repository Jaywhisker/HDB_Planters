import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { usePreload } from '../context/preloadContext';

import LandscapeModel from '../component/LandscapeModel';

const EditConfiguration = () => {

    // compositonData and PlantModels and Layers data from location props
    const location = useLocation();
    const { compositionData, compositionLayerData } = location.state || {};
    const { plantModels } = usePreload()

    // Hovered index
    const [hoveredLayeredID, setHoveredLayerID] = useState(null)
    // Selected index
    const [selectedLayerID, setSelectedLayerID] = useState(null)

    // Deep Copy coordinate & layer data so that we can edit them
    const [editedCompositionCoordinates, setEditedCompositionCoordinates] = useState(JSON.parse(JSON.stringify(compositionData['coordinates'])))
    const [editedCompositionLayerData, setEditedCompositionLayerData] = useState(JSON.parse(JSON.stringify(compositionLayerData)))

    // Determines to download the model
    const [download3DModel, setDownload3DModel] = useState(false)

    // TODO: Function to update the species ID in the composition coordinates & layer data 
    // Utilise the selectedLayerID
    const swapPlants = (newSpeciesID) => {
        if (selectedLayerID !== null) {
            const updatedLayerData = editedCompositionLayerData.map((layer) =>
                layer.layerID === selectedLayerID ? { ...layer, speciesID: newSpeciesID } : layer
            );
            setEditedCompositionLayerData(updatedLayerData);
        }
    };
    

    const handleLayerClick = (layerID) => setSelectedLayerID(layerID);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ width: '20%', overflowY: 'scroll', backgroundColor: '#f4f4f4' }}>
                {editedCompositionLayerData.map((layer) => (
                    <div
                        key={layer.layerID}
                        onClick={() => handleLayerClick(layer.layerID)}
                        style={{
                            padding: '10px',
                            cursor: 'pointer',
                            backgroundColor: selectedLayerID === layer.layerID ? '#d0f0c0' : 'transparent'
                        }}
                    >
                        Layer {layer.layerID}: Species {layer.speciesID}
                    </div>
                ))}
            </div>
            <div style={{ width: '80%', position: 'relative' }}>
            <Canvas
                        shadows
                        style={{ width: '100%', height: '100%' }}
                        camera={{
                            position: [100, 100, 100],
                            fov: 50,
                        }}
                    >
                    <LandscapeModel
                        plantModels={plantModels}
                        gridArray={compositionData['grid']}
                        coordinatesObject={editedCompositionCoordinates}
                        surroundingContext={compositionData['surrounding_context']}
                        layersData={editedCompositionLayerData}
                        allowInteraction={true}
                        hoveredLayer={hoveredLayeredID}
                        updateHoveredLayer={setHoveredLayerID}
                        selectedLayer={selectedLayerID}
                        updateSelectedLayer={(layerID) => setSelectedLayerID(layerID)}
                        downloadModel={download3DModel}
                    />
                </Canvas>
            </div>
        </div>
    );
};

export default EditConfiguration;