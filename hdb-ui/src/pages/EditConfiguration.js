import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { usePreload } from "../context/preloadContext";
import { usePlantPalette } from '../context/plantPaletteContext';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; // Import GLTFLoader

import LandscapeModel from "../component/LandscapeModel";
import download2DPlantingGrid from "../functions/download2DImage";

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import AddIcon from "@mui/icons-material/Add";
import EditIcon from '@mui/icons-material/Edit';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';

import {
  AppBar,
  CircularProgress,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  Popover,
  Modal,
  Collapse,
  DialogTitle,
  DialogActions,
  DialogContent,
  Divider,
  Checkbox,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";

const EditConfiguration = () => {
  const [selectedTab, setSelectedTab] = useState(0); // For left drawer tabs; Tabs: Plant Palette or Layers

  // selectedPlant and selectedLayerID should be mutually exclusive
  const [selectedPlant, setSelectedPlant] = useState(null); // Selected plant
  const [selectedLayerID, setSelectedLayerID] = React.useState(null); // Selected layer
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false); // Export modal state
  const [exportType, setExportType] = useState("2D");

  const { plantPalette } = usePlantPalette();

  // Preload Composition Data and Composition Layer Data
  const location = useLocation();
  const { compositionData, compositionLayerData } = location.state || {};
  const { plantModels, updateModels } = usePreload();

  // Included and excluded plants from global plantPalette context
  const [includedPlants, setIncludedPlants] = useState(
    Object.values(plantPalette).filter((plant) =>
      Object.values(compositionData.coordinates).includes(plant["Species ID"])
    )
  );
  const [excludedPlants, setExcludedPlants] = useState(
    Object.values(plantPalette).filter(
      (plant) => !Object.values(compositionData.coordinates).includes(plant["Species ID"])
    )
  );
  // Handle Tab Change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // TODO: Load PlantPalette details for layer data and download2D
  const plantPaletteDetails = null

  // Use States for triggering download
  const [downloadModel, setDownloadModel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hoveredLayerID, setHoveredLayerID] = useState(null); //Hovering over layers tab

  // Duplicate edited Composition Coordinates to prevent corrupting the original data
  const [editedCompositionCoordinates, setEditedCompositionCoordinates] = useState(JSON.parse(JSON.stringify(compositionData["coordinates"])));
  const [editedCompositionLayerData, setEditedCompositionLayerData] = useState(JSON.parse(JSON.stringify(compositionLayerData)))

  // Swap Plants Variables
  const [newModelID, setNewModelID] = useState("");
  const [error, setError] = useState("");

  // Download 2D Variables
  const treeCanvasRef = useRef(null)
  const shrubCanvasRef = useRef(null)

  // Handle plant selection
  const handlePlantClick = (plant) => {
    setSelectedPlant(plant);
    console.log(plant)
    setSelectedLayerID(null); // Clear layer selection
  };

  // Deselect or reselect layer 
  const handleLayerHighlight = (layerID) => {
    if (!popoverAnchor) { // If no popover is open, allow toggle
      setSelectedLayerID((prevLayerID) => (prevLayerID === layerID ? null : layerID));
      setSelectedPlant(null); // Clear plant selection
    }
  };

  // Render Layer Name
  const getLayerName = (layerID, speciesID) => {
    const plant = plantPalette[speciesID];
    return `${plant ? plant["Scientific Name"] : "Unknown"} ${layerID}`;
  };

  // Open swap plant modal
  const handlePopoverOpen = (event) => {
    if (selectedLayerID !== null) {
      setPopoverAnchor(event.currentTarget);
    }
  };

  const handlePopoverClose = () => {
    setPopoverAnchor(null); // Close Popover
  }

  // Handle Model Swap
  // In this code, we ALLOW you to swap outside of the plant palette (AKA we will preload a model that is not inside the plant palette and let you swap)
  // DO NOT show this in the UI, this is an additional feature that shouldn't be used (too complex)
  // Just let users swap within the plant palette and the preloading portion should never be called
  const handleModelSwap = async (newModelID) => {
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

        // Dynamically update included and excluded plants
        const includedPlantIDs = new Set(Object.values(updatedCoordinates));
        const newIncludedPlants = Object.values(plantPalette).filter((plant) =>
          includedPlantIDs.has(plant["Species ID"])
        );
        const newExcludedPlants = Object.values(plantPalette).filter(
          (plant) => !includedPlantIDs.has(plant["Species ID"])
        );

        setIncludedPlants(newIncludedPlants);
        setExcludedPlants(newExcludedPlants);

        setError("");
        setPopoverAnchor(null);
      }
      else {
        setError("Invalid layer selected.")
      }
    }
    else {
      setError("No model is currently selected. Select a layer first.");
    }
  };

  const isPopoverOpen = Boolean(popoverAnchor);

  // 2D and 3D Download
  const startExport = (type) => {
    setLoading(true);

    if (type === "2D") {
      // Simulate a delay for 2D export to showcase loading spinner
      setTimeout(() => {
        download2DPlantingGrid(
          treeCanvasRef,
          shrubCanvasRef,
          compositionData["grid"],
          editedCompositionCoordinates,
          plantPaletteDetails
        );
        setLoading(false); // Reset loading after 2D export
      }, 1000); // Adjust delay as needed
    } else if (type === "3D") {
      setDownloadModel(true); // Trigger 3D export
    }
    setExportModalOpen(false); // Close modal after initiating export
  };

  // Handle completion of 3D download
  const handleDownloadComplete = () => {
    setDownloadModel(false); // Reset download trigger
    setLoading(false); // Reset loading state
  };


  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Loading Spinner */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      )}
      {/* Top AppBar */}
      <AppBar position="sticky" sx={{ bgcolor: "#E0E3DE", zIndex: 2 }}>
        <Toolbar>
          {/* Left Button */}
          <Button
            variant="text"
            color="primary"
            startIcon={<ArrowBackIosIcon />}
            onClick={() => console.log("Go back to edit")}
            sx={{ px: 4, py: 1.5 }}
          >
            Change composition
          </Button>

          <Box sx={{ flexGrow: 1, position: "relative" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  fontSize: "inherit", // Match font size
                  lineHeight: "inherit", // Match line height
                }}
              >
                DreamScape
              </Typography>
            </Box>
          </Box>

          {/* Right Content */}
          <Box sx={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
            <Button
              variant="text"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => setExportModalOpen(true)}
              sx={{ px: 4, py: 1.5 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => console.log("New Design")}
              sx={{ px: 4, py: 1.5 }}
            >
              New Design
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Popover for swapping plants */}
      <Popover
        open={isPopoverOpen}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            maxHeight: "40vh", // Limit height
            width: "18vw", // Set a fixed width
            marginLeft: "-20.5vw", // Adjust spacing to position beside the drawer
            boxShadow: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#444844" }}
            >
              Swap plant
            </Typography>
            <IconButton onClick={handlePopoverClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider variant="middle"></Divider>
        <DialogContent
          sx={{
            padding: "0",
          }}
        >
          <List
            sx={{
              maxHeight: "20rem", // Limit height of the List
              overflowY: "auto", // Enable scrolling only for the List
            }}
          >
            {Object.values(plantPalette).map((plant) => (
              <ListItem
                key={plant["Species ID"]}
                button
                onClick={() => handleModelSwap(plant["Species ID"])}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={
                      editedCompositionLayerData.find(
                        (layer) => layer.layerID === selectedLayerID
                      )?.speciesID === plant["Species ID"]
                    }
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={plant["Scientific Name"]} />
              </ListItem>
            ))}
          </List>
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
      </Popover>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          overflow: "hidden",
          padding: "1rem",
        }}
      >
        {/* Left Drawer */}
        <Box
          sx={{
            width: "20vw",
            padding: 2,
            boxShadow: 2,
            borderRadius: "1rem",
            bgcolor: "#E5E2E1",
            display: "flex",
            flexDirection: "column", // Ensure proper column layout
            height: "100%", // Full height
          }}
        >
          {/* Tabs for Plant Palette and Layers */}
          <Box className="interactive-element" sx={{ flexShrink: 0 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
              sx={{ width: "100%" }}
            >
              <Tab
                label="Plant Palette"
                sx={{
                  width: "50%", // Fill half the width (two tabs)
                  fontFamily: '"Source Sans Pro", sans-serif',

                  color: selectedTab === 0 ? "#FFF" : "#000", // Active tab white text, inactive black
                  "&:hover": {
                    bgcolor: selectedTab === 1 ? "#FFF" : "#f0f0f0", // Add hover effect
                  },

                  textTransform: "none", // Prevent capitalization
                }}
              />
              <Tab
                label="Layers"
                sx={{
                  width: "50%", // Fill half the width (two tabs)
                  fontFamily: '"Source Sans Pro", sans-serif',
                  color: selectedTab === 1 ? "#FFF" : "#000", // Active tab white text, inactive black
                  "&:hover": {
                    bgcolor: selectedTab === 1 ? "#FFF" : "#f0f0f0", // Add hover effect
                  },
                  textTransform: "none", // Prevent capitalization
                }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box
            sx={{
              flexGrow: 1, // Makes content scrollable
              overflowY: "auto", // Enable vertical scrolling for content
              mt: 2,
            }}
          >
            {selectedTab === 0 && (
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: "#1C1B1B",
                    fontSize: "0.875rem",
                    mb: "0.5rem",
                  }}
                >
                  Included Plants
                </Typography>
                {includedPlants.map((plant) => (
                  <Box
                    key={plant["Species ID"]}
                    onClick={() => handlePlantClick(plant)}
                    sx={{
                      display: "flex",
                      padding: "0.625rem",
                      border: "1px solid #444844",
                      borderRadius: "0.75rem",
                      bgcolor:
                        selectedPlant === plant
                          ? "rgba(36, 90, 62, 0.08)"
                          : "#FFF",
                      cursor: "pointer",
                      mb: "0.5rem",
                    }}
                  >
                    <Typography>{plant["Scientific Name"]}</Typography>
                  </Box>
                ))}

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: "#1C1B1B",
                    fontSize: "0.875rem",
                    mb: "0.5rem",
                    mt: "1rem",
                  }}
                >
                  Excluded Plants
                </Typography>
                {excludedPlants.map((plant) => (
                  <Box
                    key={plant["Species ID"]}
                    onClick={() => handlePlantClick(plant)}
                    sx={{
                      display: "flex",
                      padding: "0.625rem",
                      border: "1px solid #444844",
                      borderRadius: "0.75rem",
                      bgcolor:
                        selectedPlant === plant
                          ? "rgba(36, 90, 62, 0.08)"
                          : "#FFF",
                      cursor: "pointer",
                      mb: "0.5rem",
                    }}
                  >
                    <Typography>{plant["Scientific Name"]}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                {editedCompositionLayerData.map((layer) => (
                  <Box
                    key={layer.layerID}
                    onMouseEnter={() => setHoveredLayerID(layer.layerID)}
                    onMouseLeave={() => setHoveredLayerID(null)}
                    onClick={() => handleLayerHighlight(layer.layerID)}
                    sx={{
                      display: "flex",
                      padding: "0.625rem",
                      border: "1px solid #444844",
                      borderRadius: "0.75rem",
                      mb: "0.5rem",
                      cursor: "pointer",
                      bgcolor:
                        selectedLayerID === layer.layerID
                          ? "rgba(36, 90, 62, 0.08)"
                          : hoveredLayerID === layer.layerID
                          ? "#D6D4CD"
                          : "#FFF",
                    }}
                  >
                    <Typography>
                      {getLayerName(layer.layerID, layer.speciesID)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* 3D Rendering, DO NOT REMOVE Canvas */}
        <Box
          sx={{
            flexGrow: 1,
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f8f8f8",
            zIndex: 1, // Set z-index to ensure canvas is behind the drawer
          }}
        >
          <Box sx={{ width: "100%", height: "100%" }}>
            {
              <Canvas
                shadows
                style={{ width: "100%", height: "100%" }}
                camera={{
                  position: [100, 100, 100],
                  fov: 50,
                }}
              >
                <LandscapeModel
                  backgroundColour={"#fcf8f7"}
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
            }
          </Box>
        </Box>

        {/* Right Drawer */}
        <Box
          sx={{
            width: "20vw", // Make the drawer 20% of the window width
            maxWidth: "400px", // Optional max width for responsiveness
            padding: 2,
            boxShadow: 2,
            borderRadius: "1rem",
            bgcolor: "#E5E2E1",
            overflowY: "auto",
            transform:
              selectedPlant || selectedLayerID
                ? "translateX(0)"
                : "translateX(100%)",
            transition: "transform 0.3s ease-in-out",
            position: "absolute", // Ensure it's absolutely positioned in relation to the container
            right: 0, // Ensure it aligns to the right of the screen
            top: "80px", // Push it below the top bar
            bottom: 0, // Make it span the full height of the screen
            zIndex: 2, // Ensure the drawer is on top of the canvas
          }}
        >
          <Box sx={{ width: "100%" }}>
            {selectedPlant && (
              <>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#444844", mb: "0.5rem" }}
                >
                  Plant Detail
                </Typography>
                {/* Render all plant details dynamically */}
                {Object.entries(selectedPlant).map(([key, value], index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: "0.5rem",
                      borderBottom:
                        index < Object.entries(selectedPlant).length - 1
                          ? "1px solid #ddd"
                          : "none",
                      paddingBottom: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        color: "#1C1B1B",
                        fontSize: "0.875rem",
                      }}
                    >
                      {key.replace(/_/g, " ")}:
                    </Typography>
                    {key.replace(/_/g, " ") === "Link" ? (
                      <Link
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        color="primary"
                        sx={{
                          fontSize: "0.875rem",
                          wordBreak: "break-word",
                          cursor: "pointer",
                        }}
                      >
                        {value}
                      </Link>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#444",
                          fontSize: "0.875rem",
                          wordBreak: "break-word",
                        }}
                      >
                        {value?.toString() || "N/A"}
                      </Typography>
                    )}
                  </Box>
                ))}
              </>
            )}

            {selectedLayerID !== null && (
              <>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#444844", mb: "0.5rem" }}
                >
                  Plant Detail
                </Typography>
                {/* Fetch plant details using species ID from the selected layer */}
                {(() => {
                  const layer = editedCompositionLayerData.find(
                    (layer) => layer.layerID === selectedLayerID
                  );
                  const speciesID = layer?.speciesID;
                  const plantDetails = plantPalette[speciesID];

                  if (!plantDetails)
                    return <Typography>No details available.</Typography>;

                  return (
                    <>
                      {/* Scientific Name and Swap Button */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 2,
                          gap: "0.5rem",
                        }}
                      >
                        <IconButton
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation(); // Prevent propagation to parent elements
                            handlePopoverOpen(event);
                          }}
                          sx={{
                            bgcolor: "primary.main",
                            color: "#fff",
                            "&:hover": {
                              bgcolor: "primary.dark",
                            },
                          }}
                        >
                          <SwapVertIcon />
                        </IconButton>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            color: "primary.main",
                            fontSize: "1rem",
                          }}
                        >
                          {plantDetails["Scientific Name"] || "Unknown"}
                        </Typography>
                      </Box>

                      {/* Render all plant details dynamically */}
                      {Object.entries(plantDetails)
                        .filter(([key]) => key !== "Scientific Name") // Exclude "Scientific Name"
                        .map(([key, value], index) => (
                          <Box
                            key={index}
                            sx={{
                              mb: "0.5rem",
                              borderBottom:
                                index < Object.entries(plantDetails).length - 1
                                  ? "1px solid #ddd"
                                  : "none",
                              paddingBottom: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "bold",
                                color: "#1C1B1B",
                                fontSize: "0.875rem",
                              }}
                            >
                              {key.replace(/_/g, " ")}:
                            </Typography>
                            {key === "Link" ? (
                              <Link
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                color="primary"
                                sx={{
                                  fontSize: "0.875rem",
                                  wordBreak: "break-word",
                                  cursor: "pointer",
                                }}
                              >
                                {value}
                              </Link>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#444",
                                  fontSize: "0.875rem",
                                  wordBreak: "break-word",
                                }}
                              >
                                {value?.toString() || "N/A"}
                              </Typography>
                            )}
                          </Box>
                        ))}
                    </>
                  );
                })()}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Export Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        aria-labelledby="export-modal-title"
        aria-describedby="export-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            width: "30vw",
            height: "45vh",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DialogTitle
            id="export-modal-title"
            sx={{ textAlign: "center", mb: 2 }}
          >
            Export Composition
          </DialogTitle>

          {/* Dropdown for Export Type */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Select Export Type
            </Typography>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                marginBottom: "1rem",
              }}
            >
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </select>

            {/* Export Type Description */}
            <Box sx={{ mb: "0.25rem", minHeight: "2.5rem" }}>
              {exportType === "2D" ? (
                <Typography variant="body2" id="export-modal-description">
                  Export 2D top-down view for the placements of trees and shrubs
                  in separate PNG files.
                </Typography>
              ) : (
                <Typography variant="body2" id="export-modal-description">
                  Export 3D render of your composition as a glb file.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Export and Close Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => setExportModalOpen(false)}
              sx={{ px: 4, py: 1.5 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => startExport(exportType)}
              startIcon={<DownloadIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              Export
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* For 2D Downloading, DO NOT REMOVE, it is hidden from the UI, but necessary for the creation of the diagrams */}
      <canvas ref={treeCanvasRef} style={{ display: "none" }}></canvas>
      <canvas ref={shrubCanvasRef} style={{ display: "none" }}></canvas>
    </Box>
  );
};

export default EditConfiguration;
