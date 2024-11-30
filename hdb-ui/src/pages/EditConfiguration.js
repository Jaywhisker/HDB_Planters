import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { usePreload } from '../context/preloadContext';
import LandscapeModel from '../component/LandscapeModel';

const EditConfiguration = () => {
    const location = useLocation();
    const { compositionData, compositionLayerData } = location.state || {};
    const { plantModels } = usePreload();

    const [hoveredLayeredID, setHoveredLayerID] = useState(null);
    const [selectedLayerID, setSelectedLayerID] = useState(null);
    const [editedCompositionCoordinates, setEditedCompositionCoordinates] = useState(
        JSON.parse(JSON.stringify(compositionData['coordinates']))
    );
    const [editedCompositionLayerData, setEditedCompositionLayerData] = useState(
        JSON.parse(JSON.stringify(compositionLayerData))
    );

    const [newModelID, setNewModelID] = useState(""); // Track user input
    const [error, setError] = useState(""); // Track validation errors

    const handleLayerHighlight = (layerID) => {
      setSelectedLayerID((prevLayerID) => (prevLayerID === layerID ? null : layerID));
  };
  
    

    const handleModelSwap = () => {
        if (selectedLayerID !== null) {
            const selectedLayerIndex = editedCompositionLayerData.findIndex(
                (layer) => layer.layerID === selectedLayerID
            );

            if (selectedLayerIndex !== -1) {
                const selectedLayer = editedCompositionLayerData[selectedLayerIndex];
                const selectedCoordinateKey = `(${selectedLayer.coordinate[1]}, ${selectedLayer.coordinate[0]})`;

                // Validate model ID
                if (!plantModels[newModelID]) {
                    setError("Invalid model ID. Please provide a valid one.");
                    return;
                }

                // Update coordinates object
                const updatedCoordinates = { ...editedCompositionCoordinates };
                updatedCoordinates[selectedCoordinateKey] = parseInt(newModelID);
                setEditedCompositionCoordinates(updatedCoordinates);

                // Update layer data
                const updatedLayers = [...editedCompositionLayerData];
                updatedLayers[selectedLayerIndex] = {
                    ...selectedLayer,
                    speciesID: parseInt(newModelID),
                };
                setEditedCompositionLayerData(updatedLayers);

                setError(""); // Clear errors
            }
        } else {
            setError("No model is currently selected. Select a layer first.");
        }
    };

    return (
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar for Layers and Model Swap */}
        <div
          style={{
            width: "20%",
            overflowY: "scroll",
            backgroundColor: "#333",
            color: "#fff",
            padding: "10px",
          }}
        >
          {/* Swap Model Input (Now at the Top) */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              value={newModelID}
              onChange={(e) => setNewModelID(e.target.value)}
              placeholder="Enter new model ID"
              style={{
                width: "80%",
                padding: "5px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={handleModelSwap}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Swap Model
            </button>
            {error && (
              <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
            )}
          </div>

          {/* Layers List */}
          {editedCompositionLayerData.map((layer) => (
            <div
              key={layer.layerID}
              onClick={() => setSelectedLayerID(layer.layerID)}
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor:
                  selectedLayerID === layer.layerID ? "#8BBD8B" : "transparent",
                borderRadius: "5px",
                marginBottom: "5px",
              }}
            >
              Layer {layer.layerID}: Species {layer.speciesID}
            </div>
          ))}
        </div>

        {/* 3D Canvas */}
        <div style={{ width: "80%", position: "relative" }}>
          <Canvas
            shadows
            style={{ width: "100%", height: "100%" }}
            camera={{
              position: [100, 100, 100],
              fov: 50,
            }}
          >
            <LandscapeModel
              plantModels={plantModels}
              gridArray={compositionData["grid"]}
              coordinatesObject={editedCompositionCoordinates}
              surroundingContext={compositionData["surrounding_context"]}
              layersData={editedCompositionLayerData}
              allowInteraction={true}
              hoveredLayer={hoveredLayeredID}
              updateHoveredLayer={setHoveredLayerID}
              selectedLayer={selectedLayerID}
              updateSelectedLayer={handleLayerHighlight}
            />
          </Canvas>
        </div>
      </div>
    );
};

export default EditConfiguration;
