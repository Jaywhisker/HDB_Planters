import React, { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

const ModelLoader = ({ coordinates, preloadedModels, highlightedModelKey, layersData, updateSelectedLayer }) => {
    const [scales, setScales] = useState({});
    const [instances, setInstances] = useState({}); // Store model instances keyed by coordinates

    // Load scaling data
    useEffect(() => {
        const fetchScales = async () => {
            try {
                const response = await fetch('/data/plant_scales.json');
                const data = await response.json();

                const scaleMap = {};
                data.plants.forEach((plant) => {
                    scaleMap[plant.name] = plant.scale; // Map scales by plant name
                });

                setScales(scaleMap);
            } catch (error) {
                console.error('Error loading scales:', error);
            }
        };

        fetchScales();
    }, []);

    // Generate model instances only once
    useEffect(() => {
        const newInstances = {};
        Object.entries(coordinates).forEach(([key, value]) => {
            const [y, x] = key.replace(/[()]/g, "").split(",").map(Number);
            const modelName = `${value}.glb`;
            const model = preloadedModels[value]?.clone();

            if (!model) return;

            // Clone materials for each instance to isolate them
            model.traverse((node) => {
                if (node.isMesh) {
                    node.material = node.material.clone(); // Clone the material
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            // Apply random rotation and scaling
            const randomYRotation = Math.random() * Math.PI * 2; // Random rotation
            const scale = scales[modelName] || { x: 1, y: 1, z: 1 }; // Default scaling
            model.rotation.set(0, randomYRotation, 0);
            model.scale.set(scale.x, scale.y, scale.z);

            // Store the instance with its position
            newInstances[key] = {
                object: model,
                position: [x - 50, 0, -(y - 50)], // Adjust position based on grid
            };
        });
        setInstances(newInstances);
    }, [coordinates, preloadedModels, scales]);

    // Render model instances with highlight logic
    return (
        <group>
            {Object.entries(instances).map(([key, instance]) => {
                const { object, position } = instance;
                object.position.set(...position);
                // Apply highlight logic only to the selected model
                object.traverse((node) => {
                    if (node.isMesh) {
                        node.material.emissive = key === highlightedModelKey
                            ? new THREE.Color(0xff0000) // Highlighted
                            : new THREE.Color(0x000000); // Reset
                    }
                });

                return (
                    <primitive
                        key={key}
                        object={object}
                        position={position}
                        onClick={() => {
                            // Update layer selection when model is clicked
                            const layer = layersData.find((layer) =>
                                layer.coordinate.join() === [position[0] + 50, -position[2] + 50].join()
                            );
                            if (layer) {
                                updateSelectedLayer(layer.layerID);
                            }
                        }}
                    />
                );
            })}
        </group>
    );
};

export default ModelLoader;
