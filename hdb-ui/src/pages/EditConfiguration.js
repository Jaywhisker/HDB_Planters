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
    const swapPlants = () => {

    }


return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <Canvas
            shadows
            style={{ width: '100%', height: '100%' }} // Ensure Canvas fills its parent
            camera={{
                position: [100, 100, 100], // Set an isometric position
                fov: 50, // Field of view
            }}
        >
            <LandscapeModel 
                index={null}
                plantModels={plantModels}
                gridArray={compositionData['grid']}
                coordinatesObject={editedCompositionCoordinates}
                surroundingContext={compositionData['surrounding_context']}
                layersData={editedCompositionLayerData}
                allowInteraction={true}
                hoveredLayer={hoveredLayeredID}
                updateHoveredLayer={(newID) => setHoveredLayerID(newID)}
                selectedLayer={selectedLayerID}
                updateSelectedLayer={(newID) => setSelectedLayerID(newID)}
                downloadModel={download3DModel}
            /> 
        </Canvas>
    </div>
);

    

    
}

export default EditConfiguration;