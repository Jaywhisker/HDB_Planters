import React, { useState, useRef, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { usePreload } from "../context/preloadContext";
import { usePlantPalette } from "../context/plantPaletteContext";
import { LandscapeConfigContext } from "../context/landscapeConfigContext";
import { CompositionContext } from "../context/compositionContext";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import LandscapeModel from "../component/LandscapeModel";
import download2DPlantingGrid from "../functions/download2DImage";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";

import {
  AppBar,
  CircularProgress,
  CardMedia,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  IconButton,
  Popover,
  Modal,
  Tooltip,
  DialogTitle,
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
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(1);
  const { state: configState, dispatch: configDispatch } = useContext(
    LandscapeConfigContext
  );
  const { state: compositionState, dispatch: compositionDispatch } =
    useContext(CompositionContext);

  // selectedPlant and selectedLayerID should be mutually exclusive
  const [selectedPlant, setSelectedPlant] = useState(null); // Selected plant
  const [selectedLayerID, setSelectedLayerID] = useState(null); // Selected layer
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false); // Export modal state
  const [exportType, setExportType] = useState("2D");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const { plantPaletteProcessed } = usePlantPalette();

  // Preload Composition Data and Composition Layer Data
  const location = useLocation();
  const { compositionData, compositionLayerData } = location.state || {};
  const { plantModels, updateModels } = usePreload();

  // Included and excluded plants from global plantPaletteProcessed context
  const [includedPlants, setIncludedPlants] = useState(
    Object.values(plantPaletteProcessed).filter((plant) =>
      Object.values(compositionData.coordinates).includes(plant["Species ID"])
    )
  );
  const [excludedPlants, setExcludedPlants] = useState(
    Object.values(plantPaletteProcessed).filter(
      (plant) =>
        !Object.values(compositionData.coordinates).includes(
          plant["Species ID"]
        )
    )
  );
  // Handle Tab Change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Use States for triggering download
  const [downloadModel, setDownloadModel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hoveredLayerID, setHoveredLayerID] = useState(null); //Hovering over layers tab

  // Duplicate edited Composition Coordinates to prevent corrupting the original data
  const [editedCompositionGrid, setEditedCompositionGrid] =
    useState(JSON.parse(JSON.stringify(compositionData["grid"])));
  const [editedCompositionCoordinates, setEditedCompositionCoordinates] =
    useState(JSON.parse(JSON.stringify(compositionData["coordinates"])));
  const [editedCompositionLayerData, setEditedCompositionLayerData] = useState(
    JSON.parse(JSON.stringify(compositionLayerData))
  );

  // Swap Plants Variables
  const [newModelID, setNewModelID] = useState("");
  const [error, setError] = useState("");

  // Download 2D Variables
  const treeCanvasRef = useRef(null);
  const shrubCanvasRef = useRef(null);

  // Handle plant selection
  const handlePlantClick = (plant) => {
    setSelectedPlant(plant);
    console.log(plant);
    setSelectedLayerID(null); // Clear layer selection
  };

  // Deselect or reselect layer
  const handleLayerHighlight = (layerID) => {
    console.log("Sidebar Layer Selection:");
    console.log("Selected Layer ID:", layerID);

    const selectedLayer = editedCompositionLayerData.find(
      (layer) => layer.layerID === layerID
    );
    if (selectedLayer) {
      console.log("Layer Coordinate (Sidebar):", selectedLayer.coordinate);
      console.log("Layer Species ID:", selectedLayer.speciesID);
    } else {
      console.log("No matching layer found.");
    }

    setSelectedLayerID(layerID);
    setSelectedPlant(null); // Clear plant selection
  };

  // Render Layer Name
  const getLayerName = (layerID, speciesID) => {
    const plant = plantPaletteProcessed[speciesID];
    return `${plant ? plant["Scientific Name"] : "Unknown"} ${layerID}`;
  };

  // Open swap plant modal
  const handlePopoverOpen = (event, layerID) => {
    setPopoverAnchor(event.currentTarget);
    setSelectedLayerID(layerID);
  };

  const handlePopoverClose = () => {
    setPopoverAnchor(null); // Close Popover
  };

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
        const selectedCoordinateKey = `(${selectedLayer.coordinate[0]}, ${selectedLayer.coordinate[1]})`;

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
            setError(
              `Failed to load model ${newModelID}. Check if the file exists.`
            );
            return;
          }
        }

        // Update the composition and layer data with the new model ID
        // Landscape model will dyanmically update accordingly
        const updatedPlantType = plantPaletteProcessed[newModelID]['Plant Type']
        var speciesType = 0
        if (updatedPlantType.includes("Tree")) {
          speciesType = 2
        } else if (updatedPlantType.includes("Palm")) {
          speciesType = 2
        } else {
          speciesType = 3
        }
        const updatedGrid = [...editedCompositionGrid]
        updatedGrid[selectedLayer.coordinate[0]][selectedLayer.coordinate[1]] = speciesType
        setEditedCompositionGrid(updatedGrid)

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
        const newIncludedPlants = Object.values(plantPaletteProcessed).filter(
          (plant) => includedPlantIDs.has(plant["Species ID"])
        );
        const newExcludedPlants = Object.values(plantPaletteProcessed).filter(
          (plant) => !includedPlantIDs.has(plant["Species ID"])
        );

        setIncludedPlants(newIncludedPlants);
        setExcludedPlants(newExcludedPlants);

        setError("");
        setPopoverAnchor(null);
      } else {
        setError("Invalid layer selected.");
      }
    } else {
      setError("No model is currently selected. Select a layer first.");
    }
  };

  const isPopoverOpen = Boolean(popoverAnchor);

  // 2D and 3D Download
  const startExport = (type) => {
    setLoading(true);
  
    if (type === "2D") {
      // Simulate a delay for 2D export
      setTimeout(() => {
        download2DPlantingGrid(
          treeCanvasRef,
          shrubCanvasRef,
          editedCompositionGrid,
          editedCompositionCoordinates,
          plantPaletteProcessed
        );
        setLoading(false); // Reset loading after 2D export
        setExportModalOpen(false); // Close modal after export
      }, 1000); // Adjust delay as needed
    } else if (type === "3D") {
      setDownloadModel(true); // Trigger 3D export
      setTimeout(() => {
        setLoading(false); // Reset loading after 3D export
        setExportModalOpen(false); // Close modal after export
      }, 2000); // Simulate 3D export delay
    }
  };

  // Handle completion of 3D download
  const handleDownloadComplete = () => {
    setDownloadModel(false); // Reset download trigger
    setLoading(false); // Reset loading state
  };

  const handleNewDesign = () => {
    setOpenConfirmDialog(true); // Open the confirmation dialog
  };

  const cancelNewDesign = () => {
    setOpenConfirmDialog(false); // Close the dialog without resetting
  };

  const confirmNewDesign = () => {
    setOpenConfirmDialog(false); // Close the dialog
    configDispatch({ type: "RESET_CONFIG" });
    compositionDispatch({ type: "RESET_COMPOSITIONS" });
    navigate("/");
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top AppBar */}
      <AppBar position="sticky" sx={{ bgcolor: "#E0E3DE", zIndex: 2 }}>
        <Toolbar>
          {/* Left Button */}
          <Button
            variant="text"
            startIcon={<ArrowBackIosIcon />}
            onClick={() => navigate("/select-configuration")}
          >
            Change composition
          </Button>

          <Box sx={{ flexGrow: 1, position: "relative" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/dreamscapeLogo.png"
                alt="DreamScape Logo"
                style={{ height: "8vh" }} />
            </Box>
          </Box>

          {/* Right Content */}
          <Box sx={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
            <Button
              variant="text"
              startIcon={<DownloadIcon />}
              onClick={() => setExportModalOpen(true)}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewDesign}
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
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        PaperProps={{
          sx: {
            maxHeight: "40vh",
            width: "18vw",
            boxShadow: 2,
            overflow: "hidden",
            marginLeft: "15vw",
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
              variant="h4"
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
            overflowY: "auto",
            maxHeight: "40vh",
          }}
        >
          <List>
            {Object.values(plantPaletteProcessed).map((plant) => (
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
          <Box sx={{ flexShrink: 0 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
              sx={{ width: "100%" }}
            >
              <Tab
                className="tabs-plant"
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
                className="tabs-layers"
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
              <Box >
                <Typography
                  variant="body1"
                  sx={{
                    mb: "0.5rem",
                  }}
                >
                  Included Plants
                </Typography>
                {includedPlants.map((plant) => (
                  <Box
                    className="tab-plant"
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
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alginItems: "center",
                    }}
                  >
                    <Typography sx={{ width: "80%" }}>{plant["Scientific Name"]}</Typography>
                    <CardMedia
                      component="img"
                      image={`/images/${plant["Species ID"]}.jpg`}
                      alt={plant["Scientific Name"]}
                      sx={{
                        height: "50px",
                        width: "50px",
                        objectFit: "cover",
                        borderRadius: "0.5rem",
                        marginRight: "0.5rem",
                      }}
                    />
                  </Box>
                ))}

                <Typography
                  variant="body1"
                  sx={{ mb: "0.5rem", mt: "1rem" }}
                >
                  Excluded Plants
                </Typography>
                {excludedPlants.map((plant) => (
                  <Box
                    className="tab-plant"
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
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alginItems: "center",
                    }}
                  >
                    <Typography sx={{ width: "80%" }}>{plant["Scientific Name"]}</Typography>
                    <CardMedia
                      component="img"
                      image={`/images/${plant["Species ID"]}.jpg`}
                      alt={plant["Scientific Name"]}
                      sx={{
                        height: "50px",
                        width: "50px",
                        objectFit: "cover",
                        borderRadius: "0.5rem",
                        marginRight: "0.5rem",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                {editedCompositionLayerData.map((layer) => (
                  <Box
                    className="tab-layer"
                    key={layer.layerID}
                    onMouseEnter={() => setHoveredLayerID(layer.layerID)}
                    onMouseLeave={() => setHoveredLayerID(null)}
                    onClick={() => handleLayerHighlight(layer.layerID)}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
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
                    <Typography sx={{ width: "80%" }}>
                      {getLayerName(layer.layerID, layer.speciesID)}
                    </Typography>
                    <Tooltip title="Swap Plants">
                      <Button
                        variant="outlined"
                        size="medium"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation(); // Prevent propagation to parent elements
                          setSelectedLayerID(layer.layerID); // Set the selected layer ID
                          setPopoverAnchor(event.currentTarget); // Set popover anchor
                        }}
                      >
                        Swap
                      </Button>
                    </Tooltip>
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
            bgcolor: "#f7f3f2",
            zIndex: 1,
          }}
        >
          <Box sx={{ width: "100%", height: "100%" }}>
            <Canvas
              shadows
              style={{ width: "100%", height: "100%" }}
              camera={{
                position: [100, 100, 100],
                fov: 50,
              }}
            >
              <LandscapeModel
                backgroundColour={"#f7f3f2"}
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
          </Box>
        </Box>

        {/* Right Drawer */}
        <Box
          sx={{
            width: "20vw",
            height: "calc(100vh - 12vh)",
            padding: 2,
            boxShadow: 2,
            borderRadius: "1rem",
            bgcolor: "#E5E2E1",
            overflowY: "auto",
            position: "absolute",
            right: "1vw",
            top: "10vh",
            bottom: 0,
            zIndex: 2,
            transform:
              selectedPlant || selectedLayerID
                ? "translateX(0)"
                : "translateX(100%)", // Slide in/out
            transition: "transform 0.3s ease-in-out",
            visibility: selectedPlant || selectedLayerID ? "visible" : "hidden", // Show only when active
            display: selectedPlant || selectedLayerID ? "block" : "none", // Remove from flow when inactive
          }}
        >
          <Box sx={{ width: "100%" }}>
            {selectedPlant && (
              <>
                <Typography
                  variant="h2"
                  sx={{ mb: "0.5rem" }}
                >
                  Plant Detail
                </Typography>

                <CardMedia
                  component="img"
                  image={`/images/${selectedPlant["Species ID"]}.jpg`}
                  alt={selectedPlant["Scientific Name"]}
                  sx={{
                    height: "20vh",
                    width: "100%",
                    objectFit: "cover",
                    borderRadius: "0.75rem",
                    margin: "0 auto",
                    marginBottom: "1rem",
                  }}
                />
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
                        color: "#1C1B1B",
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
                  variant="h2"
                  sx={{ mb: "0.5rem" }}
                >
                  Plant Detail
                </Typography>



                {/* Fetch plant details using species ID from the selected layer */}
                {(() => {
                  const layer = editedCompositionLayerData.find(
                    (layer) => layer.layerID === selectedLayerID
                  );
                  const speciesID = layer?.speciesID;
                  const plantDetails = plantPaletteProcessed[speciesID];

                  if (!plantDetails)
                    return <Typography>No details available.</Typography>;

                  return (
                    <>

                      <CardMedia
                        component="img"
                        image={`/images/${speciesID}.jpg`}
                        sx={{
                          height: "20vh",
                          width: "100%",
                          objectFit: "cover",
                          borderRadius: "0.75rem",
                          margin: "0 auto",
                          marginBottom: "1rem",
                        }}
                      />

                      {/* Render all plant details dynamically */}
                      {Object.entries(plantDetails)
                        // .filter(([key]) => key !== "Scientific Name") // Exclude "Scientific Name"
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
                                color: "#1C1B1B",
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

      {/* Confirmation Modal */}
      <Modal
        open={openConfirmDialog}
        onClose={cancelNewDesign}
        aria-labelledby="confirm-new-design-title"
        aria-describedby="confirm-new-design-description"
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
            width: "20vw",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            id="confirm-new-design-title"
            variant="h2"
            sx={{ textAlign: "center", mb: 2 }}
          >
            Confirm New Design
          </Typography>
          <Typography
            id="confirm-new-design-description"
            variant="body1"
            sx={{ mb: 3, textAlign: "center" }}
          >
            Are you sure you want to discard all current designs and restart the designing process?
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={cancelNewDesign}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={confirmNewDesign}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Export Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => !loading && setExportModalOpen(false)} // Prevent closing when loading
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
            width: "20vw",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            // Show spinner while loading
            <>
              <CircularProgress color="inherit" sx={{ mb: 2 }} />
              <Typography variant="body1">Exporting, please wait...</Typography>
            </>
          ) : (
            // Show export options when not loading
            <>
              <DialogTitle id="export-modal-title" sx={{ fontWeight: "500", textAlign: "center" }}>
                Export Composition
              </DialogTitle>

              {/* Dropdown for Export Type */}
              <Box sx={{ mb: 3, width: "100%" }}>
                <Typography variant="body1" gutterBottom>
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
                      Export 3D render of your composition as a GLB file.
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
                  width: "100%",
                }}
              >
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => setExportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => startExport(exportType)}
                  startIcon={<DownloadIcon />}
                >
                  Export
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
      {/* For 2D Downloading, DO NOT REMOVE, it is hidden from the UI, but necessary for the creation of the diagrams */}
      <canvas ref={treeCanvasRef} style={{ display: 'none' }}></canvas>
      <canvas ref={shrubCanvasRef} style={{ display: 'none' }}></canvas>
    </Box>
  );
};

export default EditConfiguration;
