import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { usePreload } from "../context/preloadContext";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; // Import GLTFLoader

import LandscapeModel from "../component/LandscapeModel";
import download2DPlantingGrid from "../functions/download2DImage";

const EditConfiguration = () => {

  // Preload Composition Data and Composition Layer Data
  const location = useLocation();
  const { compositionData, compositionLayerData } = location.state || {};
  const { plantModels, updateModels } = usePreload();

  // TODO: Load PlantPalette details for layer data and download2D
  const plantPaletteDetails = null

  // Use States for triggering download
  const [downloadModel, setDownloadModel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hoveredLayerID, setHoveredLayerID] = useState(null); //Hovering over layers tab
  const [selectedLayerID, setSelectedLayerID] = useState(null);

  // Duplicate edited Composition Coordinates to prevent corrupting the original data
  const [editedCompositionCoordinates, setEditedCompositionCoordinates] = useState(JSON.parse(JSON.stringify(compositionData["coordinates"])));
  const [editedCompositionLayerData, setEditedCompositionLayerData] = useState(JSON.parse(JSON.stringify(compositionLayerData)))

  // Swap Plants Variables
  const [newModelID, setNewModelID] = useState("");
  const [error, setError] = useState("");

  // Download 2D Variables
  const treeCanvasRef = useRef(null)
  const shrubCanvasRef = useRef(null)

  // Deselect or reselect layer 
  const handleLayerHighlight = (layerID) => {
    setSelectedLayerID((prevLayerID) =>
      prevLayerID === layerID ? null : layerID
    );
  };

  // Handle Model Swap
  // In this code, we ALLOW you to swap outside of the plant palette (AKA we will preload a model that is not inside the plant palette and let you swap)
  // DO NOT show this in the UI, this is an additional feature that shouldn't be used (too complex)
  // Just let users swap within the plant palette and the preloading portion should never be called
  const handleModelSwap = async () => {
    if (selectedLayerID !== null) {
      // Retrieve layer Index
      const selectedLayerIndex = editedCompositionLayerData.findIndex(
        (layer) => layer.layerID === selectedLayerID
      );

      if (selectedLayerIndex !== -1) {
        // Retrieve layer and coords value
        const selectedLayer = editedCompositionLayerData[selectedLayerIndex];
        const selectedCoordinateKey = `(${selectedLayer.coordinate[1]}, ${selectedLayer.coordinate[0]})`;

        // Preloading additional models were not already preloaded
        // SHOULD not be called in normal circumstances, all plant palette shld be preloaded and they shouldnt call any other plants outside of plant palette
        if (!plantModels[newModelID]) {
          try {
            const loader = new GLTFLoader();
            const modelPath = `/models/${newModelID}.glb`;

            const newModel = await new Promise((resolve, reject) => {
              loader.load(
                modelPath,
                (gltf) => resolve(gltf.scene),
                undefined,
                (error) => reject(error)
              );
            });

            // Update preloadedmodels dynamically using updateModels
            updateModels({ ...plantModels, [newModelID]: newModel });
          } catch (error) {
            setError(`Failed to load model ${newModelID}. Check if the file exists.`);
            return;
          }
        }

        // Update the composition and layer data with the new model ID
        // Landscape model will dyanmically update accordingly
        const updatedCoordinates = { ...editedCompositionCoordinates };
        updatedCoordinates[selectedCoordinateKey] = parseInt(newModelID);
        setEditedCompositionCoordinates(updatedCoordinates);

        const updatedLayers = [...editedCompositionLayerData];
        updatedLayers[selectedLayerIndex] = {
          ...selectedLayer,
          speciesID: parseInt(newModelID),
        };
        setEditedCompositionLayerData(updatedLayers);

        setError("");
      }
      else {
        setError("Invalid layer selected.")
      }
    } 
    else {
      setError("No model is currently selected. Select a layer first.");
    }
  };

  // 3D Download, start loading page
  const start3DDownload = () => {
    setDownloadModel(true);
    setLoading(true);
  };

  // Remove download trigger and remove loading state upon completion of 3D download
  const handleDownloadComplete = () => {
    setDownloadModel(false); // Reset download trigger
    setLoading(false); // Reset loading state
  };

  // TODO: 2D Download
  const start2DDownload = () => {
    download2DPlantingGrid(treeCanvasRef, shrubCanvasRef, compositionData['grid'], editedCompositionCoordinates, plantPaletteDetails)
  }


  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Left side Bar (Can be edited) */}
      <div
        style={{
          width: "20%",
          overflowY: "scroll",
          backgroundColor: "#333",
          color: "#fff",
          padding: "10px",
        }}
      >
      
      {/* 3d download */}
      <button
          onClick={start3DDownload}
          disabled={loading}
          style={{
            padding: "10px",
            backgroundColor: loading ? "#aaaaaa" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "20px",
          }}
        >
          {loading ? "Downloading..." : "Download 3D Model"}
        </button>

        <div style={{ marginBottom: "20px" }}>
          {/* Input to change plant species ID */}
          <input
            type="text"
            value={newModelID}
            onChange={(e) => setNewModelID(e.target.value)}
            placeholder="Enter new model ID"
            onMouseDown={(e) => e.stopPropagation()} // Use onMouseDown for consistent behavior
            style={{
              width: "80%",
              padding: "5px",
              marginBottom: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onMouseDown={(e) => e.stopPropagation()} // Use onMouseDown to avoid triggering parent
            onClick={(e) => {
              e.stopPropagation();
              handleModelSwap();
            }}
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
          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </div>

        {/* Layers data */}
        {editedCompositionLayerData.map((layer) => (
          <div
            key={layer.layerID}
            onMouseEnter={() => setHoveredLayerID(layer.layerID)}
            onMouseLeave={() => setHoveredLayerID(null)}
            onClick={() => handleLayerHighlight(layer.layerID)} // Call the highlight handler
            style={{
              padding: "10px",
              cursor: "pointer",
              backgroundColor:
                selectedLayerID === layer.layerID
                  ? "#8BBD8B" // Highlight color for selected layer
                  : hoveredLayerID === layer.layerID
                  ? "#BBBBBB" // Highlight color for hovered layer
                  : "transparent",
              borderRadius: "5px",
              marginBottom: "5px",
            }}
          >
            Layer {layer.layerID}: Species {layer.speciesID}
          </div>
        ))}
      </div>
      
      {/* 3D Rendering, DO NOT REMOVE Canvas */}
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
            hoveredLayer={hoveredLayerID}
            updateHoveredLayer={setHoveredLayerID}
            selectedLayer={selectedLayerID}
            updateSelectedLayer={handleLayerHighlight}
            downloadModel={downloadModel}
            onDownloadComplete={handleDownloadComplete}
          />
        </Canvas>
      </div>

      {/* For 2D Downloading, DO NOT REMOVE, it is hidden from the UI, but necessary for the creation of the diagrams */}
      <canvas ref={treeCanvasRef} style={{display:'none'}}></canvas>
      <canvas ref={shrubCanvasRef} style={{display:'none'}}></canvas>
    </div>
  );
};

export default EditConfiguration;
