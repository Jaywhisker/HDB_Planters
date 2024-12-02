import React, { useEffect, useState, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const GrassAndConcrete = ({ grid, surroundingContext }) => {
    const grassGltf = useLoader(GLTFLoader, '/models/grass.glb');

    // Preload selected texture based on surrounding context
    const selectedTexture = useMemo(() => {
        const loader = new THREE.TextureLoader();
        if (surroundingContext === 'Road') {
            const roadTexture = loader.load('/textures/road.jpeg');
            roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
            roadTexture.repeat.set(2, 2);
            return roadTexture;
        } else {
            const concreteTexture = loader.load('/textures/concrete.jpeg');
            concreteTexture.wrapS = concreteTexture.wrapT = THREE.RepeatWrapping;
            concreteTexture.repeat.set(4, 4);
            return concreteTexture;
        }
    }, [surroundingContext]);

    const [grassModel, setGrassModel] = useState(null);
    const [initializedGrid, setInitializedGrid] = useState(null); // Track initialization

    // Preload GRass
    useEffect(() => {
        if (grassGltf && grassGltf.scene) {
            const grassTemplate = grassGltf.scene.clone();
            grassTemplate.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    node.material = new THREE.MeshStandardMaterial({ color: 0x228b22 });
                }
            });
            setGrassModel(grassTemplate);
        }
    }, [grassGltf]);

    useEffect(() => {
        if (grid && !initializedGrid) {
            const gridWithRotations = grid.map((row, x) =>
                row.map((cell, y) => ({
                    cell,
                    rotation: cell === 1 ? Math.random() * Math.PI * 2 : 0, // Random rotation only once
                }))
            );
            setInitializedGrid(gridWithRotations);
        }
    }, [grid, initializedGrid]);

    if (!grassModel || !initializedGrid) return null;

    return (
        <>
            {/* Concrete or Road Layer */}
            <mesh receiveShadow position={[0, -5, 0]}>
                <boxGeometry args={[100, 10, 100]} />
                <meshStandardMaterial map={selectedTexture} />
            </mesh>

            {/* Grass Layer */}
            <group>
                {initializedGrid.map((row, x) =>
                    row.map(({ cell, rotation }, y) => {
                        if (cell === 1) {
                            return (
                                <primitive
                                    key={`${x}-${y}`}
                                    object={grassModel.clone()}
                                    position={[x - grid.length / 2 + 0.5, 0.2, -(y - grid.length / 2 + 0.5)]}
                                    scale={[5, 5, 10]}
                                    rotation={[0, rotation, 0]}
                                    castShadow
                                    receiveShadow
                                />
                            );
                        }
                        return null;
                    })
                )}
            </group>
        </>
    );
};

export default GrassAndConcrete;
