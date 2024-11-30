import React, { useEffect, useState } from 'react';

const ModelLoader = ({ coordinates, preloadedModels }) => {
    const [scales, setScales] = useState({});

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

    // Render models
    return (
        <group>
            {Object.entries(coordinates).map(([key, value]) => {
              const [y, x] = key.replace(/[()]/g, "").split(",").map(Number);
              const modelName = `${value}.glb`; // Match JSON naming convention
              const model = preloadedModels[value];

              if (!model) return null;

              // Clone the model and apply transformations
              const clonedModel = model.clone();
              const scale = scales[modelName] || { x: 1, y: 1, z: 1 }; // Default to no scaling
              clonedModel.scale.set(scale.x, scale.y, scale.z);

              // Apply random Y-axis rotation
              const randomYRotation = Math.random() * Math.PI * 2; // Random rotation between 0 and 2π
              clonedModel.rotation.set(0, randomYRotation, 0); // Set rotation on the Y-axis

              clonedModel.traverse((node) => {
                if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
                }
              });

              return (
                <primitive
                  key={`${x}-${y}`}
                  object={clonedModel}
                  position={[x - 50, 0, -(y - 50)]}
                />
              );
            })}
        </group>
    );
};

export default ModelLoader;
