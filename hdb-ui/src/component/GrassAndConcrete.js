import React, { useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const GrassAndConcrete = ({ grid, surroundingContext }) => {
    const concreteTexture = useLoader(THREE.TextureLoader, '/textures/concrete.jpeg');
    const roadTexture = useLoader(THREE.TextureLoader, '/textures/road.jpeg');
    const grassGltf = useLoader(GLTFLoader, '/models/grass.glb');

    const [grassModel, setGrassModel] = useState(null);

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

    if (!grassModel) return null;

    return (
        <>
            {/* Concrete or Road Layer */}
            <mesh receiveShadow position={[0, -5, 0]}>
                <boxGeometry args={[100, 10, 100]} />
                <meshStandardMaterial map={surroundingContext === 'Road' ? roadTexture : concreteTexture} />
            </mesh>

            {/* Grass Layer */}
            <group>
                {grid.map((row, x) =>
                    row.map((cell, y) => {
                        if (cell === 1) {
                            return (
                                <primitive
                                    key={`${x}-${y}`}
                                    object={grassModel.clone()}
                                    position={[x - grid.length / 2 + 0.5, 0.2, -(y - grid.length / 2 + 0.5)]}
                                    scale={[5, 5, 2]}
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
