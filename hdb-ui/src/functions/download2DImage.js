export default function download2DPlantingGrid (treeCanvasRef, shrubCanvasRef, plantingGrid, plantingCoords, scale=5) {
    // Tree Colour Map
    const treeColourMap = [
        'rgba(228, 236, 138, 0.75)',
        'rgba(224, 212, 170, 0.75)',
        'rgba(207, 212, 132, 0.75)',
        'rgba(163, 147, 112, 0.75)',

    ]
    const treeOutline = 'rgb(110, 134, 50)'
    const uniqueTreeList = []

    // Shrub Colour Map
    const shrubColourMap = [
        'rgba(184, 209, 210, 1)',
        'rgba(157, 204, 212, 1)',
        'rgba(121, 152, 168, 1)',
        'rgba(74, 126, 137, 1)',
        'rgba(131, 162, 172, 1)',
        'rgba(139, 174, 196, 1)',
        'rgba(66, 97, 173, 1)',
        'rgba(42, 146, 142, 1)',
        'rgba(109, 101, 150, 1)',
        'rgba(161, 170, 169, 1)'
    ]
    const shrubOutline = 'rgba(112, 145, 136, 1)'
    const speciesCoordinates = {};

    // Coordinates Data
    const treeCoordinates = []
    const shrubCoordinates = []

    // Initialisation of Canvas
    const treeCanvas = treeCanvasRef.current;
    const shrubCanvas = shrubCanvasRef.current;
    const ctx = treeCanvas.getContext('2d');
    const ctxS = shrubCanvas.getContext('2d')
    
    treeCanvas.width = plantingGrid[0].length * scale
    treeCanvas.height = plantingGrid.length * scale
    shrubCanvas.width = plantingGrid[0].length * scale
    shrubCanvas.height = plantingGrid.length * scale

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, treeCanvas.width*scale, treeCanvas.height*scale);
    ctxS.fillStyle = 'white'
    ctxS.fillRect(0, 0, shrubCanvas.width*scale, shrubCanvas.height*scale);

    // Helper Function: Check if coordinate is out of bounds
    const isOutOfBounds = (x, y) =>
        x < 0 || y < 0 || x >= plantingGrid[0].length || y >= plantingGrid.length;
  
    // Drawing border of planting area
    for (let y=0; y < plantingGrid.length; y++) {
        for (let x=0; x < plantingGrid[0].length; x++) {
            // Iterate and draw planting grid
            const value = plantingGrid[y][x];
            if (value >= 1) {
                // Check if is shrub / tree coordinates
                if (value == 2) {
                    treeCoordinates.push([x,y])
                } 
                if (value == 3) {
                    shrubCoordinates.push([x,y])
                }
                const neighbors = [
                    [0, -1], // Top
                    [0, 1],  // Bottom
                    [-1, 0], // Left
                    [1, 0],  // Right
                    [-1, -1], // Top-left
                    [1, -1],  // Top-right
                    [-1, 1], // Bottom-left
                    [1, 1],  // Bottom-right
                ];
                let hasOutline = false
                // Check where the outline is
                for (const [dx, dy] of neighbors) {
                    const nx = x + dx;
                    const ny = y + dy;
                    // out of bounds or 0, showing that it is a boundary area
                    if (isOutOfBounds(nx, ny) || plantingGrid[ny][nx] === 0) {
                    hasOutline = true;
                    break;
                    }
                }
                // Draw outline
                if (hasOutline) {
                    // Include border for tree
                        ctx.fillStyle = 'rgb(156, 162, 158)';
                        ctx.fillRect(
                            x * scale - 2,
                            y * scale - 2,
                            scale + 4,
                            scale + 4
                        );
                    // Shrub by default include
                    ctxS.fillStyle = shrubOutline;
                    ctxS.fillRect(
                        x * scale - 2,
                        y * scale - 2,
                        scale + 4,
                        scale + 4
                    );
                }
            }
        }
    }
    
    // Segmenting planting area for shrubs
    // Firstly we need to reformat the data to be in the format of {speciesID: [[x,y], [x,y]]}
    shrubCoordinates.forEach((shrubCoordinate) => {
        const key = `(${shrubCoordinate[0]}, ${shrubCoordinate[1]})`
        var speciesID = plantingCoords[key]
        if (!speciesCoordinates[speciesID]) {
            // Key does not exist, need to initialise
            speciesCoordinates[speciesID] = []
        }
        speciesCoordinates[speciesID].push(shrubCoordinate)
    })
    const allCoordinates = Object.values(speciesCoordinates).flat()
    let clusterMap = Array(plantingGrid.length).fill().map(() => Array(plantingGrid[0].length).fill(-1));

    // Helper Function: Calculate Euclidean Distance from coordinate 1 to coordinate 2
    const euclideanDistance = (coord1, coord2) => {
        const [x1, y1] = coord1;
        const [x2, y2] = coord2;
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
    }

    // Draw Shrub Segmentation
    // Draw Tree planting Grid
    for (let y=0; y < plantingGrid.length; y++) {
        for (let x=0; x < plantingGrid[0].length; x++) {
            const value = plantingGrid[y][x];
            if (value >= 1) {
                // Tree Planting Grid ----------------------------------------------------------------------------------------------
                ctx.fillStyle = 'rgb(210, 216, 179)' // Light green
                ctx.fillRect(
                    x * scale,
                    y * scale,
                    scale,
                    scale
                  );
                
                // Shrub Segmentation ----------------------------------------------------------------------------------------------
                let closestCluster = -1
                let minDistance = Infinity
                // Get the cluster coordinate belongs to
                allCoordinates.forEach((centroid, clusterIndex) => {
                    const distance = euclideanDistance([x,y], centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        // Retrieve the index of the speciesID the coordinate belongs to
                        // This is our cluster component
                        const coordinate = allCoordinates[clusterIndex]
                        let currentSpeciesIndex = 0;
                        for (const [key, coords] of Object.entries(speciesCoordinates)) {
                            if (coords.some(coord => JSON.stringify(coord) === JSON.stringify(coordinate))) {
                                break;
                            }
                            currentSpeciesIndex++;
                        }
                        closestCluster = currentSpeciesIndex
                    }
                })
                clusterMap[y][x] = closestCluster;
                // Fill grid with the respective colour
                ctxS.fillStyle = shrubColourMap[closestCluster]
                ctxS.fillRect(
                    x * scale,
                    y * scale,
                    scale,
                    scale
                );
                // Draw an outline if it's a boundary
                const neighbors = [
                    [-1, 0], [1, 0], // left and right
                    [0, -1], [0, 1]  // top and bottom
                ];
                let hasOutline = false
                for (let [dx, dy] of neighbors) {
                    const nx = x + dx;
                    const ny = y + dy;
                    // Check if the neighbor is within bounds
                    if (nx >= 0 && nx < plantingGrid[0].length && ny >= 0 && ny < plantingGrid.length) {
                        const neighborCluster = clusterMap[ny][nx];
                        if (neighborCluster !== closestCluster && neighborCluster >= 0) {
                            hasOutline = true
                        }
                    }
                }
                if (hasOutline) {
                    ctxS.fillStyle = shrubOutline
                    ctxS.fillRect(
                        x * scale+0.5, 
                        y * scale+0.5, 
                        scale/2, 
                        scale/2
                    )
                }
            }
        }
    }

    // Helper function: Check if coordinate is visited and in same cluster
    const isValid = (y, x, clusterMap, label, visited) => {
        return y >= 0 && y < 100 && x >= 0 && x < 100 && !visited[y][x] && clusterMap[y][x] === label;
    }

    // Helper function: Perform a flood fill (DFS or BFS) to collect all coordinates of a cluster
    const floodFill = (y, x, clusterMap, label, visited) => {
        // Initialisation
        const stack = [[y, x]];
        const clusterCoords = [];
        visited[y][x] = true;

        while (stack.length > 0) {
            const [cy, cx] = stack.pop();
            clusterCoords.push([cy, cx]);
            // Check all 4 directions (up, down, left, right), do they belong to the same cluster
            // Add the coordinate if belonging to same cluster to do a BFS exploration of all coordinates in the cluster
            for (const [dy, dx] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const ny = cy + dy;
                const nx = cx + dx;
                if (isValid(ny, nx, clusterMap, label, visited)) {
                    visited[ny][nx] = true;
                    stack.push([ny, nx]);
                }
            }
        }
        return clusterCoords;
    }

    // Helper function: Calculate all cluster centroids, returns an Array in the format of [{id: xx, x:, y:, label (speciesID Key)}]
    const findClusterCentroids = (clusterMap) => {
        // Initialisation
        const visited = Array.from({ length: 100 }, () => Array(100).fill(false));
        const clusterCentroids = [];
        let clusterId = 0;

        // Loop through the entire cluster map to find unvisited cluster points
        for (let y = 0; y < 100; y++) {
            for (let x = 0; x < 100; x++) {
                // Retrieve speciesKey
                const speciesKey = clusterMap[y][x]

                // Skip if already visited or if it's an unclassified point (-1)
                if (visited[y][x] || speciesKey === -1) {
                    continue
                }

                // Perform flood fill to find all connected coordinates for this cluster
                const clusterCoords = floodFill(y, x, clusterMap, speciesKey, visited);

                // Sum all the coordinates in each cluster
                const sum = clusterCoords.reduce((acc, [cy, cx]) => {
                    acc.x += cx;
                    acc.y += cy;
                    return acc;
                }, { x: 0, y: 0 });

                // Retrieve cluster centroid
                const centroid = {
                    x: Math.round(sum.x / clusterCoords.length),
                    y: Math.round(sum.y / clusterCoords.length),
                    speciesKey: speciesKey,
                    clusterId: clusterId++ // Assign a unique cluster ID
                };

                // Store the centroid
                clusterCentroids.push(centroid);
            }
        }
        return clusterCentroids;
    }
            
    // Update text for each segmented area
    // TODO: Update with proper species name
    const clusterCentroids = findClusterCentroids(clusterMap); // Retrieve all cluster centroids
    var speciesIDArray = Object.keys(speciesCoordinates)
    clusterCentroids.forEach((centroidData, index) => {
        var shrubName = `S${speciesIDArray[centroidData.speciesKey]}`
        // Draw shrub name at the center area
        ctxS.fillStyle = 'black'; // Set text color
        ctxS.font = '12px Arial'; // Set text font and size
        ctxS.textAlign = 'center'; // Align text horizontally to the center
        ctxS.textBaseline = 'middle'; // Align text vertically to the middle
        ctxS.fillText(shrubName, centroidData.x*scale, centroidData.y*scale); // Draw the text at the center
    })

    // Drawing the Tree Radius
    // TODO: Update with proper species name
    treeCoordinates.forEach((coordinate) => {
        // Retrieving Coordinates and ID
        var treeSpecies = plantingCoords[`(${coordinate[0]}, ${coordinate[1]})`]
        var treeColourIndex = uniqueTreeList.indexOf(treeSpecies)
        // Doesnt exist in list
        if (treeColourIndex === -1) {
            treeColourIndex = uniqueTreeList.length
            uniqueTreeList.push(treeSpecies)
        }

        // For tree canvas, it will be a colour fill & outline
        // For shrub canvas, just an outline without any fill 
        // Tree Canvas --------------------------------------------------------------------
        // Draw circle
        ctx.fillStyle = treeColourMap[treeColourIndex]
        ctx.beginPath();
        ctx.arc(coordinate[0]*scale, coordinate[1]*scale, 10*scale, 0, Math.PI * 2);
        ctx.fill()
        // Draw circle outline
        ctx.strokeStyle = treeOutline; 
        ctx.lineWidth = 2;
        ctx.stroke()

        // TODO: Get species name from dataset
        var treeName = `TS${treeColourIndex}`
        // Draw text at the center of the circle
        ctx.fillStyle = 'black'; // Set text color
        ctx.font = '12px Arial'; // Set text font and size
        ctx.textAlign = 'center'; // Align text horizontally to the center
        ctx.textBaseline = 'middle'; // Align text vertically to the middle
        ctx.fillText(treeName, coordinate[0]*scale, coordinate[1]*scale); // Draw the text at the center

        
        // Shrub Canvas -------------------------------------------------------------------
        // Draw circle outline
        ctxS.beginPath();
        ctxS.arc(coordinate[0]*scale, coordinate[1]*scale, 10*scale, 0, Math.PI * 2);
        ctxS.strokeStyle = 'rgba(0, 0, 0, 0.25)'; // Some opacity 
        ctxS.lineWidth = 2;
        ctxS.stroke()                
    })

    downloadImage(treeCanvasRef, shrubCanvasRef)
}



const downloadImage = (treeCanvasRef, shrubCanvasRef) => {
    // Convert treeCanvas into an image to download
    const treeCanvas = treeCanvasRef.current;
    var imageData = treeCanvas.toDataURL('image/png');
    var link = document.createElement('a');
    link.href = imageData;
    link.download = 'treePlantingPlan.png';
    link.click();

    // Convert shrubCanvas into an image to download
    const shrubCanvas = shrubCanvasRef.current;
    imageData = shrubCanvas.toDataURL('image/png');
    link = document.createElement('a');
    link.href = imageData;
    link.download = 'shrubPlantingPlan.png';
    link.click();
};