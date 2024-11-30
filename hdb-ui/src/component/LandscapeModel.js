import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import GrassAndConcrete from "./GrassAndConcrete";
import ModelLoader from "./ModelLoader";

const LandscapeModel = ({
  index,
  plantModels,
  gridArray,
  coordinatesObject,
  surroundingContext,
  layersData,
  updateLayersData,
  allowInteraction,
  hoveredLayer,
  updateHoveredLayer,
  selectedLayer,
  updateSelectedLayer,
  downloadModel,
}) => {
  // TODO:
  // 1. Render the 3D model using gridArray, coordinatesObject and plantModels
  const scene = new THREE.Scene();
  const { camera } = useThree();
  scene.background = new THREE.Color(0xffffff); // Set background to white

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const hoveredObjectRef = useRef(null);

  // Extract grid and coordinates from JSON

  useEffect(() => {
    // Add ambient and directional lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 5); // Slightly dimmer
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(50, 100, 50);
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.left = -200;
    light.shadow.camera.right = 200;
    light.shadow.camera.top = 200;
    light.shadow.camera.bottom = -200;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    light.shadow.bias = -0.0005; // Adjust bias to avoid shadow artifacts
    scene.add(light);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.6); // Sky and ground colors
    scene.add(hemisphereLight);

    return () => {
      scene.remove(ambientLight, light, hemisphereLight);
    };
  }, [scene]);

  useEffect(() => {
    if (layersData.length === 0) {
      const newLayersData = Object.entries(coordinatesObject).map(
        ([coord, speciesID], idx) => {
          const [y, x] = coord.replace(/[()]/g, "").split(",").map(Number); // Parse coordinates
          return { layerID: idx, speciesID, coordinate: [x, y] }; // Ensure coordinate matches [x, y]
        }
      );
      updateLayersData(newLayersData);
    }
  }, [coordinatesObject, layersData, updateLayersData]);

  useEffect(() => {
    if (allowInteraction) {
      const onMouseMove = (event) => {
        const rect = event.target.getBoundingClientRect();
        mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const intersects = raycaster.current.intersectObjects(
          scene.children,
          true
        );
        if (intersects.length > 0) {
          const object = intersects[0].object;
          if (object !== hoveredObjectRef.current) {
            hoveredObjectRef.current = object;
            const layer = layersData.find(
              (layer) => layer.coordinate.join() === object.position.join()
            );
            updateHoveredLayer(layer ? layer.layerID : null);
          }
        } else {
          hoveredObjectRef.current = null;
          updateHoveredLayer(null);
        }
      };

      const onMouseDown = (event) => {
        const rect = event.target.getBoundingClientRect();
        mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(mouse.current, camera);

        const intersects = raycaster.current.intersectObjects(
          scene.children,
          true
        );
        if (intersects.length > 0) {
          const object = intersects[0].object;

          const layer = layersData.find(
            (layer) => layer.coordinate.join() === object.position.join()
          );

          if (layer) {
            updateSelectedLayer(
              layer.layerID === selectedLayer ? null : layer.layerID
            );
          }
        } else {
          // Deselect layer if clicking on a blank space
          updateSelectedLayer(null);
        }
      };

      window.addEventListener("mousedown", onMouseDown);

      return () => {
        window.removeEventListener("mousedown", onMouseDown);
      };
    }
  }, [layersData, selectedLayer, updateSelectedLayer, scene, camera]);

  useEffect(() => {
    const handleClick = (event) => {
      const rect = event.target.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera); // Use the extracted camera

      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );
      if (intersects.length > 0) {
        const object = intersects[0].object;

        // Find the corresponding layerID
        const layer = layersData.find(
          (layer) => layer.coordinate.join() === object.position.join()
        );

        if (layer) {
          updateSelectedLayer(layer.layerID);
        }
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [layersData, updateSelectedLayer, scene, camera]);

  useEffect(() => {
    if (downloadModel) {
      // TODO: Function to download the 3D object model
    }
  }, [downloadModel]);

  useEffect(() => {
    // Reset highlights for all models
    Object.entries(coordinatesObject).forEach(([coord, speciesID]) => {
      const [y, x] = coord.replace(/[()]/g, "").split(",").map(Number);
      const modelName = `${speciesID}.glb`;
      const model = plantModels[speciesID]?.clone();

      if (model) {
        model.traverse((node) => {
          if (node.isMesh) {
            node.material.emissive = new THREE.Color(0x000000); // Reset highlight
          }
        });
      }
    });

    // Apply highlight to the selected model
    if (selectedLayer !== null && layersData[selectedLayer]) {
      const { coordinate, speciesID } = layersData[selectedLayer];
      const [x, y] = coordinate;

      Object.entries(coordinatesObject).forEach(([coord, id]) => {
        const [cy, cx] = coord.replace(/[()]/g, "").split(",").map(Number);
        if (id === speciesID && x === cx && y === cy) {
          const model = plantModels[speciesID]?.clone();
          if (model) {
            model.traverse((node) => {
              if (node.isMesh) {
                node.material.emissive = new THREE.Color(0xff0000); // Red highlight
              }
            });
          }
        }
      });
    }
  }, [selectedLayer, layersData, coordinatesObject, plantModels]);

  // Determine the key of the highlighted model
  const highlightedModelKey = useMemo(() => {
    if (selectedLayer !== null && layersData[selectedLayer]) {
      const { coordinate } = layersData[selectedLayer];
      return `(${coordinate[1]}, ${coordinate[0]})`; // Match the coordinate format in the JSON
    }
    return null;
  }, [selectedLayer, layersData]);


  useEffect(() => {
    if (downloadModel) {
        // TODO: Function to download the 3D object model
    }
}, [downloadModel])



  return (
    <>
      <OrbitControls
        enableDamping
        dampingFactor={0.25}
        screenSpacePanning={false}
        maxPolarAngle={Math.PI / 2}
      />
      <ambientLight intensity={5} color={0x404040} />
      <directionalLight
        intensity={2.5}
        position={[50, 100, 50]}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-bias={-0.0005}
      />
      <hemisphereLight
        intensity={0.6}
        skyColor={0x87ceeb}
        groundColor={0x444444}
      />

      {/* Grass and Concrete */}
      <GrassAndConcrete
        grid={gridArray}
        surroundingContext={surroundingContext}
      />

      {/* 3D Model Loader */}
      <ModelLoader
        coordinates={coordinatesObject}
        preloadedModels={plantModels}
        highlightedModelKey={highlightedModelKey}
        hoveredLayer={layersData.find(
          (layer) => layer.layerID === hoveredLayer
        )} // Match hovered layer
        selectedLayer={layersData.find(
          (layer) => layer.layerID === selectedLayer
        )} // Match selected layer
        layersData={layersData}
        updateSelectedLayer={updateSelectedLayer}
      />
    </>
  );
};

export default LandscapeModel;
