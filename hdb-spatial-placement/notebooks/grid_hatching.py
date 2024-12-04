import numpy as np
import gymnasium as gym
from gymnasium import spaces
import random
from perlin_noise import PerlinNoise
from scipy.spatial.distance import cdist
import cv2
import matplotlib.pyplot as plt
from stable_baselines3.common.env_checker import check_env
from stable_baselines3 import PPO
from stable_baselines3.common.evaluation import evaluate_policy
import matplotlib.colors as mcolors
import matplotlib.patches as mpatches
import os
import copy
from scipy.ndimage import binary_fill_holes
from scipy.ndimage import label
from scipy.stats import mode
import re

class gridHatching():
    def __init__(self, starting_grid:np.ndarray, starting_plant_dict: dict, randomised_seed: int = None, threshold: float = 0.1, fall_off: bool= False):
        """
        Class to take a grid and plant_selection in order to create hatches of regions 

        Args:
            grid (np.ndarray): grid received from procedural generation, 0 means unplantable, 1 means plantable, 2 means tree, 3 means shrub
            plant_dict (dict): the plant_dict and information on the theme as well
            threshold (float, optional): is the amount of difference between seed strength before one is dominannt
            fall_off (bool, optional): controls whether the influence from the depth of the area is bool (either 100 or 0 strength) or gradually decreases across distance 
        """
        self.randomized_seed = None
        self.threshold = 0.1
        self.fall_off = False

        self.unplantable_int = 0
        self.plantable_int = 1
        self.tree_int = 2
        self.shrub_int = 3

        self.starting_grid = starting_grid
        self.starting_plant_dict = starting_plant_dict

        self.starting_seed_list, self.shrub_int_list, self.tree_radii_dict, self.seed_mapping = self._initialise_info()
        # print("starting_seed_list")
        # print(self.starting_seed_list)
        # print("shrub_int_list")
        # print(self.shrub_int_list)
        # print("tree_radii_dict")
        # print(self.tree_radii_dict)
        # print("seed_mapping")
        # print(self.seed_mapping)

    def create_hatching(self):        
        intermediate_grid = self._generation()

        output_grid, output_seed_dict, seed_mapping = self._postprocessing(intermediate_grid)

        self._visualize_grid_with_outlines_v2(output_grid, output_seed_dict, seed_mapping, self.tree_radii_dict)

        # To have a function here that will recompile into a json
        
        return None # we will output the json above
    

    # Compiled Functions, not public but essentially the segments
    def _initialise_info(self):
        """
        Function used to initialise all the information before the grid generation

        Returns: 
            starting_seed_list (list[tuple]): a list of tuple of seed locations
            shrub_int_list (list): a list of integers to be used to populate the numpy array
            tree_radii_dict (dict): a dictionary of tuples of tree locations as the keys and radii of each tree as the value
        """ 
        trees_list, starting_seed_list = self._extract_tree_shrub_placements(self.starting_grid) #to be improved in order to take in arguments that will search for seeds and shrubs by specific integers
        tree_info_dict, shrub_info_dict = self._retrive_trees_shrubs_from_input_dict(self.starting_plant_dict)
        new_trees = self._allocate_trees_to_coordinates(trees_list, tree_info_dict)
        tree_radii_dict = {pos: data[1] for pos, data in new_trees.items()}
        shrub_int_dict, shrub_int_list = self._create_seed_labels_v2(shrub_info_dict)

        return starting_seed_list, shrub_int_list, tree_radii_dict, shrub_int_dict
    
    def _generation(self):
        """
        Function used to generate the raw heatmap before cleaning

        Returns: 
            output_grid (np.ndarray): the numpy array that has different regions labelled with different integers for different plants
        """ 
        seed_to_int_dict = self._choose_starter_slots_v3(self.starting_seed_list, self.seed_mapping)  # This function should take the seed from the class to controls its random actions
        noise_map = self._generate_worley_heatmap() # This function should take the seed from the class to controls its random actions
        noise_grids = self._combined_noisemap(self.starting_grid, noise_map, seed_to_int_dict) #NGL I think this function can be cleaned up to only require the size of the grid without needing to take in the input grid as an argument
        heatmaps = self._create_heatmaps_v2(self.shrub_int_list , self.starting_grid, noise_grids, self.tree_radii_dict, self.fall_off) #This function can also be cleaned up bcos wx technically already has plantable and unplantable area segmented out so it does not need to be further subdivided
        output_grid = self._apply_influence_grids_with_border(heatmaps, self.starting_grid, threshold=self.threshold)
        return output_grid
    
    def _postprocessing(self, intermediate_grid):
        """
        Function used to generate the raw heatmap before cleaning

        Returns: 
            cleaned_grid (np.ndarray): the numpy array that has different regions labelled with different integers for different plants
            seed_dict (dict): a dictionary of integers of the selected regions as the keys and list of tuples of their locations as the value output.
        """ 
        cleaned_grid = self._fill_small_regions(intermediate_grid, required_points=self.starting_seed_list)
        seed_dict = self._sort_seeds_v2(cleaned_grid, self.starting_seed_list)
        shifted_seeds_dict = self._shift_and_space_seeds_optimized(cleaned_grid, seed_dict)
        cleaned_grid = self._merge_regions_without_seeds(cleaned_grid,shifted_seeds_dict)

        seed_mapping = {seed["Seed Number"]: seed["Shrub Name"] for seed in self.seed_mapping}

        return cleaned_grid, seed_dict, seed_mapping
    

    # Everything below this line is just to check if it works first
    # to be commented and cleaned according to comments later
    
    def _extract_tree_shrub_placements(self, grid): #to be improved in order to take in arguments that will search for seeds and shrubs by specific integers
        """
        Extracts the tree and shrub placements from the final grid.
        
        Args:
            grid (np.ndarray): The final grid after placement.
        
        Returns:
            trees (list of tuple): List of coordinates of tree placements.
            shrubs (list of tuple): List of coordinates of shrub placements.
        """
        trees = list(zip(*np.where(grid == 1)))
        shrubs = list(zip(*np.where(grid == 2)))
        return trees, shrubs#
    
    def _retrive_trees_shrubs_from_input_dict(self, input_dict):
        Tree_Species = []
        Shrub_Species = []
        selected_plants_list = input_dict["selected_plants"]
        for plant in selected_plants_list:
            if self._contains_palm(plant["Plant Type"]) or self._contains_tree(plant["Plant Type"]):
                # It is a tree
                Tree_Species.append(plant)
            elif self._contains_shrub(plant["Plant Type"]):
                Shrub_Species.append(plant)
            else:
                print("WHATT ARE THOSEE")
                continue
        return Tree_Species,Shrub_Species
    
    def _allocate_trees_to_coordinates(self, tree_positions, Trees_list):
        """
        Allocates a tree species and its radius to each coordinate from the given tree list.

        Args:
            tree_positions (list of tuple): List of (y, x) grid coordinates.
            Trees_list (list of dict): List of tree data with species name and canopy radius.

        Returns:
            dict: A dictionary mapping each coordinate to a tree species and its radius.
        """
        # Check if there are any tree species
        if not Trees_list:
            raise ValueError("No tree species available in the tree list.")

        # Initialize the output dictionary
        allocated_trees = {}

        # Assign each coordinate a tree species and radius
        for pos in tree_positions:
            # Randomly select a tree species
            selected_tree = random.choice(Trees_list)
            name = selected_tree["Species Name"]
            radius = selected_tree.get("Canopy Radius", "None")
            
            # Ensure radius is a float if possible
            radius = float(radius) if radius != "None" else 0
            
            # Allocate the tree to the coordinate
            allocated_trees[pos] = [name, radius]

        return allocated_trees
    
    def _create_seed_labels_v2(self, shrubs_list):
        BSH = 0  # Border, Shade Hating
        NBSL = 0  # Not Border, Shade Loving
        NBSH = 0  # Not Border, Shade Hating
        BSL = 0  # Border, Shade Loving
        shrub_mapping = {  # To map seeds to shrub names
            "BSH": [],
            "NBSL": [],
            "NBSH": [],
            "BSL": []
        }

        # Process each shrub and categorize
        for shrub in shrubs_list:
            if "Shrub" in shrub["Plant Type"]:  # Ensure it's a shrub
                if shrub["Hazard"] != "-":  # NB: Not Border (hazard present)
                    if self._contains_semi_shade_jx(shrub["Light Preference"]) or self._contains_full_shade_jx(shrub["Light Preference"]):
                        # NBSL: Not Border, Shade Loving
                        NBSL += 1
                        shrub_mapping["NBSL"].append(shrub["Species Name"])
                    else:
                        # NBSH: Not Border, Shade Hating
                        NBSH += 1
                        shrub_mapping["NBSH"].append(shrub["Species Name"])
                else:  # B: Border (no hazard)
                    if self._contains_semi_shade_jx(shrub["Light Preference"]) or self._contains_full_shade_jx(shrub["Light Preference"]):
                        # BSL: Border, Shade Loving
                        BSL += 1
                        shrub_mapping["BSL"].append(shrub["Species Name"])
                    else:
                        # BSH: Border, Shade Hating
                        BSH += 1
                        shrub_mapping["BSH"].append(shrub["Species Name"])

        # Log the counts
        # print(f"BSH: {BSH}, NBSL: {NBSL}, BSL: {BSL}, NBSH: {NBSH}")

        # Generate seed numbers for the categories
        seedlist = self._select_numbers(startingNumber=3, BSH=BSH, NBSL=NBSL, BSL=BSL, NBSH=NBSH)

        # Map seed numbers to shrubs
        seed_mapping = []
        seeds_list = []
        for category, seeds in zip(["BSH", "NBSL", "NBSH", "BSL"], 
                                [seedlist[:BSH], seedlist[BSH:BSH+NBSL], seedlist[BSH+NBSL:BSH+NBSL+NBSH], seedlist[BSH+NBSL+NBSH:]]):
            names = shrub_mapping[category]
            for seed, name in zip(seeds, names):
                seed_mapping.append({"Seed Number": seed, "Shrub Name": name})
                seeds_list.append(seed)

        return seed_mapping, seeds_list

    def _select_numbers(self, BSH=0, NBSL=0, NBSH=0, BSL=0, startingNumber=3):
        """
        Selects integers based on the conditions specified:
        - BSH: Border, shade hating (not a multiple of 2, multiple of 3)
        - NBSL: Not Border, shade loving (multiple of 2, not a multiple of 3)
        - NBSH: Not Border, shade hating (not a multiple of 2, not a multiple of 3)
        - BSL: Border, shade loving (multiple of 2, multiple of 3)
        
        Args:
            BSH (int): Number of integers required for Border, shade hating condition.
            NBSL (int): Number of integers required for Not Border, shade loving condition.
            NBSH (int): Number of integers required for Not Border, shade hating condition.
            BSL (int): Number of integers required for Border, shade loving condition.
            startingNumber (int): The number to start iterating from.
            
        Returns:
            list: A list of integers meeting the conditions in the specified quantities.
        """
        result = []
        current_number = startingNumber
        count = BSH + NBSL + NBSH + BSL

        while len(result) < (count):
            # Check conditions and add to the result list
            if current_number % 2 != 0 and current_number % 3 == 0 and BSH > 0:
                result.append(current_number)
                # print(current_number, "BSH")
                BSH -= 1
            elif current_number % 2 == 0 and current_number % 3 != 0 and NBSL > 0:
                result.append(current_number)
                # print(current_number, "NBSL")
                NBSL -= 1
            elif current_number % 2 != 0 and current_number % 3 != 0 and NBSH > 0:
                result.append(current_number)
                # print(current_number, "NBSH")
                NBSH -= 1
            elif current_number % 2 == 0 and current_number % 3 == 0 and BSL > 0:
                result.append(current_number)
                # print(current_number, "BSL")
                BSL -= 1
            
            current_number += 1

        return result

    def _choose_starter_slots_v3(self, shrub_positions, starter_types, percentage_of_starters=0.8):
        """
        Selects a percentage of shrub positions to be assigned as starter slots and groups them
        by starter types based on the provided list.

        Args:
            shrub_positions (list): List of tuples representing the positions of shrubs.
            starter_types (list): List of dictionaries with "Seed Number" and optionally other fields.
            percentage_of_starters (float): Percentage of shrub positions to use as starter slots. Default is 0.8 (80%).

        Returns:
            dict: A dictionary of seed locations by type.
        """
        shrub_slots = copy.deepcopy(shrub_positions)
        
        # Use only the "Seed Number" from starter_types for seed_locations keys
        seed_locations = {t["Seed Number"]: [] for t in starter_types}

        # Determine the number of starters based on the percentage
        number_of_starters = int(len(shrub_slots) * percentage_of_starters)
        number_of_starters = max(1, number_of_starters)  # Ensure at least one starter is selected

        # Use the provided list of starter types in sequence
        types_sequence = [starter_types[i % len(starter_types)]["Seed Number"] for i in range(number_of_starters)]

        for i, assigned_type in enumerate(types_sequence):
            if not shrub_slots:  # If no more shrub positions are left, break the loop
                break
            selected_position = shrub_slots.pop(0)  # Select the next shrub position in order
            seed_locations[assigned_type].append(selected_position)

        return seed_locations

    def _generate_worley_heatmap(self, grid_size=(100, 100), distribution_seed=None, value_range=(40, 50), feature_points=20, invert=False): # This function should take the seed from the class to controls its random actions
        """
        Generate a random heatmap using Worley noise.

        Args:
            grid_size (tuple): The size of the heatmap (width, height).
            distribution_seed (int or None): Seed for reproducibility.
            value_range (tuple): The range of values for the heatmap (min, max).
            feature_points (int): Number of feature points in the grid.
            invert (bool): Whether to invert the values so that centers of the points are high-value areas.

        Returns:
            np.ndarray: A 2D array representing Worley noise.
        """
        width, height = grid_size

        # Set random seed for reproducibility
        if distribution_seed is not None:
            random.seed(distribution_seed)

        # Generate random feature points
        feature_points = [(random.uniform(0, width), random.uniform(0, height)) for _ in range(feature_points)]

        def closest_distance(x, y):
            # Compute the closest distance to a feature point
            return min(np.sqrt((x - fx) ** 2 + (y - fy) ** 2) for fx, fy in feature_points)

        # Compute Worley noise for the grid
        noise = np.array([[closest_distance(x, y) for x in range(width)] for y in range(height)])

        # Normalize the noise to 0-1
        noise = (noise - np.min(noise)) / (np.max(noise) - np.min(noise))

        # Invert the noise if required
        if invert:
            noise = 1 - noise

        # Scale the noise to the desired value range
        min_val, max_val = value_range
        noise = noise * (max_val - min_val) + min_val

        return noise

    def _combined_noisemap(self, grid, noise_map, seed_dict): #NGL I think this function can be cleaned up to only require the size of the grid without needing to take in the input grid as an argument
        seed = {}
        for i in seed_dict:
            seed[i] = self._radiate_influence(grid, noise_map, seed_dict[i])
        return seed

    def _radiate_influence(self, grid, noise_map, seed_locations, decay_rate=0.1):
        """
        Radiates influence from each seed location based on its strength on the noise map, taking the maximum influence.

        Args:
            grid (np.ndarray): The input grid where influence will be applied.
            noise_map (np.ndarray): A grid representing the noise values.
            seed_locations (list of tuple): List of (y, x) seed coordinates.
            decay_rate (float): The rate at which influence decreases with distance.

        Returns:
            np.ndarray: A grid with the maximum influence from all seeds.
        """
        # Initialize the influence grid with zeros
        influence_grid = np.zeros_like(grid, dtype=np.float32)

        # Get grid dimensions
        height, width = grid.shape

        # Iterate over each seed
        for y, x in seed_locations:
            # Get the seed's strength from the noise map
            if 0 <= y < height and 0 <= x < width:
                seed_strength = noise_map[y, x]

                # Iterate over the grid to calculate influence
                for i in range(height):
                    for j in range(width):
                        # Calculate the distance from the seed
                        distance = np.sqrt((i - y) ** 2 + (j - x) ** 2)

                        # Calculate the influence based on the distance
                        influence = seed_strength * np.exp(-decay_rate * distance)

                        # Assign the maximum influence to the grid
                        influence_grid[i, j] = max(influence_grid[i, j], influence)

        influence_grid = np.flipud(influence_grid)

        return influence_grid
   
    def _create_heatmaps_v2(self, seed_list, grid, noise_grids, tree_radii, fall_off= False): #This function can also be cleaned up bcos wx technically already has plantable and unplantable area segmented out so it does not need to be further subdivided
        seed_heatmaps = {}
        print(seed_list)
        for i in seed_list:
            seed_heatmaps[i] = self._create_heatmap_for_type_v2(i,grid, noise_grids[i], tree_radii =tree_radii, fall_off=fall_off)
        return seed_heatmaps

    def _create_heatmap_for_type_v2(self, seed_value, grid, noise_grid, tree_radii, fall_off=False):
        plantable_grid = self._shade_inside_border(grid)
        # Create the grids to be combined
        shade_grid = None
        # If the thing is a multiple of 2 then it is shade loving
        if seed_value%2 == 0:
            shade_grid = self._label_heatmap_based_on_trees_v2(plantable_grid,tree_radii)
        else:
            shade_grid = self._label_heatmap_based_on_trees_v2(plantable_grid, tree_radii, invert=True)
        border_grid = None
        # If the seed_value is a modulus of 3 then it is something that likes the border
        if seed_value%3 ==0:
            border_grid = self._calculate_border_proximity(plantable_grid, instant_fall_off=fall_off)
        else:
            border_grid = self._calculate_distance_to_border(plantable_grid, instant_fall_off=fall_off)
        
        # visualize_heatmap(shade_grid)
        # visualize_heatmap(border_grid)
        influences = [shade_grid,border_grid, noise_grid]
        influence = self._combine_heatmaps(influences)
        # visualize_heatmap(influence)
        return influence

    def _shade_inside_border(self, grid, border_value=255, fill_value=128):
        """
        Shade points inside the black borders on the grid with a specified fill color,
        leaving outside regions untouched.

        Args:
            grid (np.ndarray): The grid representing the environment.
            border_value (int): Value representing the border in the grid.
            fill_value (int): Value to fill the inside regions with.

        Returns:
            np.ndarray: Modified grid with inside regions shaded with the fill color.
        """
        # Create a mask for border areas
        border_mask = grid == border_value

        # Use binary_fill_holes to fill regions inside the border
        filled_region = binary_fill_holes(border_mask)

        # Create a copy of the grid to modify
        shaded_grid = np.copy(grid)
        
        # Apply the fill color to inside regions only
        shaded_grid[filled_region] = fill_value
        # plt.imshow(shaded_grid, cmap="gray")
        # plt.title("Grid with Inside Regions Shaded")
        # plt.show()
        
        return shaded_grid

    def _label_heatmap_based_on_trees_v2(self, grid, tree_data, invert=False):
        """
        Creates a new grid where points with a value of 128 are labeled with 100 or 0 
        based on their proximity to trees. Each tree has a specific radius for labeling.
        Points within or outside the radius are labeled, depending on `invert`.

        Args:
            grid (np.ndarray): The input grid (heatmap values or similar structure).
            tree_data (dict): Dictionary with (y, x) coordinates as keys and radius as values.
            invert (bool): If True, label points outside the radius of all trees instead of within it.

        Returns:
            np.ndarray: A new grid where desired squares are labeled as 100, others as 0.
        """
        # Initialize the new grid with zeros
        labeled_grid = np.zeros_like(grid, dtype=np.float32)

        # Identify positions with a value of 128 in the grid
        target_positions = np.argwhere(grid == 128)

        # If there are tree positions and target positions, calculate distances
        if len(tree_data) > 0 and len(target_positions) > 0:
            # Extract tree positions and radii
            tree_positions = np.array(list(tree_data.keys()))
            tree_radii = np.array(list(tree_data.values()))

            # Calculate distances from target positions to the tree positions
            distances = cdist(target_positions, tree_positions)

            if invert:
                # Label points outside the radius of ALL trees
                outside_all_trees = np.all(distances > tree_radii, axis=1)
                valid_indices = np.where(outside_all_trees)[0]
            else:
                # Label points within the radius of ANY tree
                within_any_tree = np.any(distances <= tree_radii, axis=1)
                valid_indices = np.where(within_any_tree)[0]

            # Mark valid target points in the labeled grid
            for index in valid_indices:
                y, x = target_positions[index]
                labeled_grid[y, x] = 100  # Assign the value 100 for valid points

            labeled_grid = np.flipud(labeled_grid)

        return labeled_grid

    def _calculate_border_proximity(self, grid, constant_zone=0.6, instant_fall_off=False):
        """
        Calculate a proximity map where pixels of type 128 closest to the border have the highest value.
        Type 0 remains 0. Includes a cutoff value to ignore distances below the cutoff threshold,
        a max_cutoff to cap the proximity effect, and a constant_zone where the score remains 100.
        Supports an instant fall-off mode where values less than 100 are set to 0.

        Args:
            grid (np.ndarray): 2D array where 128 represents the target area.
            cutoff (float): The minimum distance value to consider. Distances below this are set to 0.
            max_cutoff (float or percentage): The maximum distance value to cap. If between 0 and 1, treated as a percentage.
            constant_zone (float or percentage): The distance from the border where the proximity value remains 100.
                                                If between 0 and 1, treated as a percentage.
            instant_fall_off (bool): If True, values less than 100 are set to 0.

        Returns:
            np.ndarray: A 2D array where proximity to the border is higher for points closer to the border.
        """
        cutoff = 1
        max_cutoff = 1
        # Create a binary mask where type 128 is 1 and everything else is 0
        binary_mask = (grid == 128).astype(np.uint8)

        # Apply distance transform
        distance_to_border = cv2.distanceTransform(binary_mask, distanceType=cv2.DIST_L2, maskSize=5)

        # Calculate max_distance for normalization and percentage-based calculations
        max_distance = np.max(distance_to_border)

        # Convert constant_zone and max_cutoff to absolute values if they are percentages
        if 0 < constant_zone <= 1:
            constant_zone = constant_zone * max_distance
        if 0 < max_cutoff <= 1:
            max_cutoff = max_cutoff * max_distance

        # Maintain a constant value of 100 in the constant zone
        proximity_map = np.zeros_like(distance_to_border)
        proximity_map[distance_to_border <= constant_zone] = 100

        # Normalize the distances beyond the constant zone
        beyond_constant_zone = distance_to_border > constant_zone
        if max_distance > 0:
            normalized_distances = (distance_to_border[beyond_constant_zone] - constant_zone) / (max_distance - constant_zone)
            proximity_map[beyond_constant_zone] = (1 - normalized_distances) * 100

        # Apply cutoff to remove low-proximity regions
        proximity_map = np.where(distance_to_border >= cutoff, proximity_map, 0)

        # Handle instant fall-off: Set all values less than 100 to 0
        if instant_fall_off:
            proximity_map = np.where(proximity_map == 100, 100, 0)
        else:
            # Apply max_cutoff to limit the proximity range
            if max_cutoff is not None:
                proximity_map = np.where(distance_to_border <= max_cutoff, proximity_map, 0)

        # Flip the proximity map vertically
        flipped_proximity_map = np.flipud(proximity_map)

        return flipped_proximity_map

    def _calculate_distance_to_border(self, grid, cutoff=1, max_area=0.4, instant_fall_off=False):
        """
        Calculate and normalize the distance of each pixel to the nearest border of the area with type 128.
        Includes a cutoff value to ignore distances below the cutoff threshold and a max_area to cap the proximity.
        Allows max_area to specify the portion of the grid covered.
        Supports an instant fall-off mode where values drop to 0 beyond the max_area range.

        Args:
            grid (np.ndarray): 2D array where 128 represents the target area.
            cutoff (float): The minimum distance value before starting to increase. Default is 1.
            max_area (float): The portion of the grid where proximity should remain non-zero. If between 0 and 1, treated as a percentage.
            instant_fall_off (bool): If True, values beyond max_area are set to 0 immediately.

        Returns:
            np.ndarray: A 2D array of the same shape as the input, containing normalized distances.
        """
        # Create a binary mask where type 128 is 1 and everything else is 0
        max_cutoff = 1 - max_area
        binary_mask = (grid == 128).astype(np.uint8)

        # Apply distance transform
        distance_to_border = cv2.distanceTransform(binary_mask, distanceType=cv2.DIST_L2, maskSize=5)

        # Apply cutoff
        distance_to_border = np.where(distance_to_border >= cutoff, distance_to_border, 0)

        # Convert max_cutoff to an absolute value if it's a percentage (0 < max_cutoff <= 1)
        max_distance = np.max(distance_to_border)
        if 0 < max_cutoff <= 1:  # If max_cutoff is a percentage
            max_cutoff = max_cutoff * max_distance

        # Set values at max_cutoff to 100 and normalize the gradient
        distance_to_border = np.clip(distance_to_border, 0, max_cutoff)  # Cap at max_cutoff
        if max_cutoff > 0:
            normalized_distance_map = (distance_to_border / max_cutoff) * 100  # Scale to range [0, 100]

        # Set values that hit max_cutoff to exactly 100
        normalized_distance_map[distance_to_border == max_cutoff] = 100

        # Handle instant fall-off: Retain yellow zones (100) and remove all other gradients
        if instant_fall_off:
            normalized_distance_map = np.where(normalized_distance_map == 100, 100, 0)

        # Flip the distance map vertically
        flipped_distance_map = np.flipud(normalized_distance_map)

        return flipped_distance_map

    def _combine_heatmaps(self, heatmaps):
        """
        Combine multiple heatmaps into a single heatmap by summing them element-wise.

        Args:
            heatmaps (list of np.ndarray): List of 2D heatmaps to combine.

        Returns:
            np.ndarray: Combined heatmap with the same shape as the input heatmaps.
        """
        if not heatmaps:
            raise ValueError("The list of heatmaps is empty.")
        
        # Ensure all heatmaps have the same shape
        shape = heatmaps[0].shape
        for idx, h in enumerate(heatmaps):
            if h.shape != shape:
                print(f"Heatmap at index {idx} has shape {h.shape}, expected {shape}")
                raise ValueError("All heatmaps must have the same shape.")
        
        # Sum the heatmaps element-wise
        combined = sum(heatmaps)
        
        return combined

    def _apply_influence_grids_with_border(self, influence_grids, grid, threshold=1):
        """
        Apply influence grids to assign plant types based on influences while respecting the border constraints.
        Correct the vertical flip issue by flipping the grid as needed.

        Args:
            influence_grids (dict): A dictionary of influence grids for each plant type.
            grid (np.ndarray): Original grid to determine workable spots.
            threshold (float): The maximum absolute difference between influences to trigger random selection.

        Returns:
            np.ndarray: A grid with plant types assigned based on influence grids, keeping non-workable spots untouched.
        """
        # Identify workable spots using shade_inside_border
        workable_grid = self._shade_inside_border(grid)
        
        # Flip grids vertically to address the issue
        flipped_influence_grids = {
            plant_type: np.flipud(influence_grids[plant_type])
            for plant_type in influence_grids
        }
        
        grid_shape = workable_grid.shape

        # Initialize the assigned grid with zeros
        assigned_grid = np.zeros(grid_shape, dtype=int)

        # Iterate through each cell in the grid
        for i in range(grid_shape[0]):
            for j in range(grid_shape[1]):
                if workable_grid[i, j] == 128:  # Only consider workable spots
                    # Gather influences for all plant types at this position
                    influences = [
                        (flipped_influence_grids[plant_type][i, j], plant_type)
                        for plant_type in flipped_influence_grids
                    ]

                    # Sort influence values with their corresponding types
                    influences.sort(reverse=True, key=lambda x: x[0])  # Sort by influence value

                    # Decide based on the absolute threshold
                    if len(influences) > 1 and abs(influences[0][0] - influences[1][0]) <= threshold:
                        # Randomly select between the top two types
                        assigned_type = random.choice([influences[0][1], influences[1][1]])
                    else:
                        # Select the type with the highest influence
                        assigned_type = influences[0][1]

                    # Assign the type to the corresponding cell
                    assigned_grid[i, j] = assigned_type
                else:
                    # Retain the original value for non-workable spots (e.g., 0)
                    assigned_grid[i, j] = grid[i, j]

        return assigned_grid

    def _fill_small_regions(self, grid, min_size=50, required_points=[]):
        """
        Replace small patches (connected components) in a grid with surrounding tile values.
        Additionally, replace regions that do not contain at least one required point.

        Args:
            grid (np.ndarray): The input 2D grid with integer values (e.g., 3 and above for regions).
            min_size (int): The minimum size for a region to remain unchanged.
            required_points (list of tuple): List of (y, x) coordinates. Regions missing these points will be replaced.

        Returns:
            np.ndarray: A grid with small regions filled with surrounding tile values.
        """
        # Create a copy of the grid to modify
        cleaned_grid = np.copy(grid)
        
        # Identify unique region values (starting from 3)
        unique_values = np.unique(grid[grid >= 3])  # Ignore values less than 3
        
        # Iterate over unique values in the grid
        for value in unique_values:
            # Create a mask for the current region
            mask = (grid == value)
            
            # Label connected components within the mask
            labeled_mask, num_features = label(mask)
            
            # Iterate over connected components
            for region_label in range(1, num_features + 1):
                # Extract the region
                region_mask = (labeled_mask == region_label)
                region_size = np.sum(region_mask)
                region_coords = np.argwhere(region_mask)

                # Check if the region contains at least one required point
                contains_required_point = any(tuple(coord) in required_points for coord in region_coords)

                # If the region size is smaller than the threshold or does not contain a required point
                if region_size < min_size or not contains_required_point:
                    # Collect surrounding values for all pixels in the region
                    surrounding_values = []
                    for y, x in region_coords:
                        # Check all 8 neighbors
                        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                            ny, nx = y + dy, x + dx
                            if 0 <= ny < grid.shape[0] and 0 <= nx < grid.shape[1]:  # Check bounds
                                neighbor_value = cleaned_grid[ny, nx]
                                surrounding_values.append(neighbor_value)
                    
                    # Determine the most frequent surrounding value
                    values = {}
                    for x in surrounding_values:
                        if x not in values:
                            values[x] = 1
                        else:
                            values[x] += 1

                    replacement_value = None
                    while replacement_value is None:
                        replacement_value = max(values, key=values.get)
                        if replacement_value == 0:
                            replacement_value = None
                            values.pop(max(values, key=values.get), None)

                    # Replace the small region or region without required points
                    cleaned_grid[region_mask] = replacement_value

        return cleaned_grid
   
    def _sort_seeds_v2(self, grid, seeds):
        """
        Sorts the seeds based on their corresponding values on a grid.

        Args:
            grid (np.ndarray): A 2D numpy array representing the grid.
            seeds (list of tuples): A list of (x, y) coordinate tuples.

        Returns:
            dict: A dictionary where keys are grid values and values are lists of coordinates.
        """
        sorted_seeds = {}

        for y, x in seeds:
            # Get the value at the grid position
            value = grid[y, x]  # Note: grid indexing is row-major (y, x)

            # Add the coordinate to the appropriate list in the dictionary
            if value not in sorted_seeds:
                sorted_seeds[value] = []
            sorted_seeds[value].append((y, x))

        sorted_seeds = dict(sorted(sorted_seeds.items()))
        return sorted_seeds

    def _shift_and_space_seeds_optimized(self, input_grid, seed_dict_x, min_distance=5, spacing_distance=7, max_iterations=100):
        """
        Optimized version to shift seeds inward and ensure they are spaced out within regions.
        Includes timeout for both boundary adjustment and spacing adjustments.

        Args:
            input_grid (np.ndarray): A numpy grid representing the different areas.
            seed_dict_x (dict): A dictionary with keys as area types and values as lists of (y, x) coordinates of seeds.
            min_distance (float): The minimum distance a seed must maintain from the boundary.
            spacing_distance (float): The minimum distance seeds must maintain from each other.
            max_iterations (int): Maximum number of iterations to try for adjusting seed spacing.

        Returns:
            dict: Updated seed_dict_x with seeds shifted inward and spaced out within regions.
        """
        for area_type, seeds in seed_dict_x.items():
            # Create a binary mask for the current area type
            binary_mask = (input_grid == area_type).astype(np.uint8)

            # Apply distance transform to get distances from the boundary
            distance_to_boundary = cv2.distanceTransform(binary_mask, distanceType=cv2.DIST_L2, maskSize=5)

            # Step 1: Shift seeds inward until they meet the minimum distance from the boundary
            shifted_seeds = []
            for seed in seeds:
                y, x = seed
                steps = 0  # Timeout counter for boundary adjustment

                while distance_to_boundary[y, x] < min_distance and steps < min_distance:
                    best_shift = None
                    max_distance = 0

                    # Check all 8 neighbors to find the best inward shift
                    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < input_grid.shape[0] and 0 <= nx < input_grid.shape[1]:
                            if (
                                input_grid[ny, nx] == area_type
                                and distance_to_boundary[ny, nx] > max_distance
                            ):
                                max_distance = distance_to_boundary[ny, nx]
                                best_shift = (ny, nx)

                    # If a better position is found, shift the seed
                    if best_shift:
                        y, x = best_shift
                    else:
                        # If no valid shift is possible, stop the loop
                        break

                    steps += 1  # Increment the timeout counter

                shifted_seeds.append((y, x))

            # Step 2: Adjust seeds iteratively to improve spacing
            placed_seeds = []
            for seed in shifted_seeds:
                y, x = seed
                iterations = 0  # Timeout counter for spacing adjustment

                # Iterate to adjust until spacing is achieved or timeout is reached
                while iterations < max_iterations:
                    is_spaced = all(
                        np.sqrt((y - py) ** 2 + (x - px) ** 2) >= spacing_distance
                        for py, px in placed_seeds
                    )
                    if is_spaced:
                        break

                    best_shift = None
                    max_spacing = 0

                    # Check all 8 neighbors to find the best shift to improve spacing
                    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < input_grid.shape[0] and 0 <= nx < input_grid.shape[1]:
                            if input_grid[ny, nx] == area_type:
                                # Calculate the minimum distance to all placed seeds
                                distances = [
                                    np.sqrt((ny - py) ** 2 + (nx - px) ** 2) for py, px in placed_seeds
                                ]
                                min_spacing = min(distances) if distances else float("inf")
                                if min_spacing > max_spacing:
                                    max_spacing = min_spacing
                                    best_shift = (ny, nx)

                    # If a better position is found, shift the seed
                    if best_shift:
                        y, x = best_shift
                    else:
                        # If no valid shift is possible, stop adjusting
                        break

                    iterations += 1  # Increment the timeout counter

                placed_seeds.append((y, x))

            # Update the seed positions in seed_dict_x
            seed_dict_x[area_type] = placed_seeds

        return seed_dict_x
    
    def _merge_regions_without_seeds(self, input_grid, seed_dict_x, visualise=False):
        """
        Merge regions without any seeds into neighboring regions, separating regions by boundaries and region types.

        Args:
            input_grid (np.ndarray): A numpy grid representing different regions by type.
            seed_dict_x (dict): A dictionary with keys as region types and values as lists of seed coordinates.

        Returns:
            np.ndarray: A modified grid where regions without seeds are merged into neighboring regions.
        """
        # Step 1: Label each type separately and assign unique labels
        labeled_grid = np.zeros_like(input_grid, dtype=int)
        current_label = 1  # Start labeling from 1
        region_type_to_labels = {}  # Keep track of which labels belong to which region type

        for region_type in np.unique(input_grid):
            if region_type == 0:  # Skip unplantable areas
                continue

            # Label regions for the current type
            type_mask = (input_grid == region_type).astype(int)
            labeled_type, num_features = label(type_mask)

            # Assign unique labels for this type
            for feature_id in range(1, num_features + 1):
                labeled_grid[labeled_type == feature_id] = current_label
                if region_type not in region_type_to_labels:
                    region_type_to_labels[region_type] = []
                region_type_to_labels[region_type].append(current_label)
                current_label += 1

        if visualise == True:
            # Visualization after Step 1: Display labeled regions
            plt.figure(figsize=(8, 8))
            plt.imshow(labeled_grid, cmap="tab20", origin="upper")
            plt.colorbar(label="Region Label")
            for region_type, seeds in seed_dict_x.items():
                for y, x in seeds:
                    plt.scatter(x, y, c="red", label=f"Type {region_type}" if y == seeds[0][0] else "", s=100, edgecolors="black")
            plt.title("Labeled Regions with Seeds")
            plt.xlabel("X-axis")
            plt.ylabel("Y-axis")
            plt.legend(loc="upper right", bbox_to_anchor=(1.3, 1))
            plt.show()

        # Step 2: Check regions for seeds
        regions_with_seeds = set()
        for region_type, seeds in seed_dict_x.items():
            for seed in seeds:
                y, x = seed
                region_label = labeled_grid[y, x]
                regions_with_seeds.add(region_label)

        # Step 3: Merge regions without seeds into neighboring regions
        for region_label in np.unique(labeled_grid):
            if region_label == 0 or region_label in regions_with_seeds:
                continue

            # Get coordinates of the seedless region
            region_coords = np.argwhere(labeled_grid == region_label)

            # Find neighboring regions
            neighbors = {}
            for y, x in region_coords:
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < input_grid.shape[0] and 0 <= nx < input_grid.shape[1]:
                        neighbor_label = labeled_grid[ny, nx]
                        if neighbor_label > 0 and neighbor_label != region_label:
                            neighbors[neighbor_label] = neighbors.get(neighbor_label, 0) + 1

            # Merge into the most common neighboring region
            if neighbors:
                largest_neighbor = max(neighbors, key=neighbors.get)
                for y, x in region_coords:
                    labeled_grid[y, x] = largest_neighbor

        # Step 4: Map back to original region types
        merged_grid = np.zeros_like(input_grid)
        for region_type, label_list in region_type_to_labels.items():
            for label_id in label_list:
                merged_grid[labeled_grid == label_id] = region_type

        return merged_grid
    
    def _visualize_grid_with_outlines_v2(self, grid, shrubs_dict, seed_name_mapping, tree_radii):
        """
        Visualize a grid with different types and draw outlines for specific points from a dictionary of shrubs.

        Args:
            grid (np.ndarray): 2D array representing the grid. Each cell value corresponds to a type.
            shrubs_dict (dict): Dictionary where keys are types (seed numbers) and values are lists of (y, x) positions.
            seed_name_mapping (dict): Dictionary mapping seed numbers to shrub names.
            tree_radii (dict): Dictionary mapping (y, x) positions to radii.
        """
        # Define a colormap for visualization
        unique_values = np.unique(grid)
        colors = plt.cm.Accent(np.linspace(0, 1, len(unique_values)))  # Use a colormap for distinct colors

        # Create a color map dictionary
        color_map = {val: colors[i] for i, val in enumerate(unique_values)}

        # Generate type labels based on seed_name_mapping
        type_labels = {
            val: seed_name_mapping.get(val, "Unplantable Area" if val == 0 else f"Unknown {val}")
            for val in unique_values
        }

        # Create the plot
        plt.figure(figsize=(8, 8))
        ax = plt.gca()

        # Draw the grid points
        for value, color in color_map.items():
            indices = np.argwhere(grid == value)
            plt.scatter(
                indices[:, 1],
                indices[:, 0],
                color=color,
                label=type_labels.get(value, f"Unknown {value}"),
                s=50,
                alpha=0.8
            )

        # Draw the outlines for shrubs
        for shrub_type, positions in shrubs_dict.items():
            for y, x in positions:
                # Draw only the outline of the circle with a smaller radius
                circle = mpatches.Circle(
                    (x, y),
                    radius=1.0,
                    facecolor='none',
                    edgecolor='black',
                    linewidth=1.5,
                    zorder=5
                )
                ax.add_patch(circle)

        # Draw the outlines for trees with their radii, clipping to grid boundary
        grid_height, grid_width = grid.shape
        for (y, x), radius in tree_radii.items():
            # Only draw circles within bounds
            if 0 <= x < grid_width and 0 <= y < grid_height:
                circle = mpatches.Circle(
                    (x, y),
                    radius=radius,
                    facecolor='none',
                    edgecolor='green',
                    linewidth=1,
                    zorder=5,
                    clip_on=True  # Clip circles to the axes
                )
                ax.add_patch(circle)

        # Set axis limits to grid size to enforce clipping
        ax.set_xlim(-0.5, grid.shape[1] - 0.5)
        ax.set_ylim(-0.5, grid.shape[0] - 0.5)

        # Invert y-axis for correct orientation
        ax.invert_yaxis()

        # Add title and legend
        plt.title("Grid Visualization with Shrub Outlines")
        plt.legend(title="Legend (Shrub Names)", loc='upper right')
        plt.grid(False)
        plt.show()
        
    # Utility Functions
    def _contains_shrub(self, string):
        """
        Check if the string contains the word 'Shrub' (case-insensitive).
        Args:
            string (str): The input string to check.
        Returns:
            bool: True if the string contains 'Shrub', False otherwise.
        """
        return bool(re.search(r'\bShrub\b', string, re.IGNORECASE))

    def _contains_tree(self, string):
        """
        Check if the string contains the word 'Tree' (case-insensitive).
        Args:
            string (str): The input string to check.
        Returns:
            bool: True if the string contains 'Tree', False otherwise.
        """
        return bool(re.search(r'\bTree\b', string, re.IGNORECASE))

    def _contains_palm(self, string):
        """
        Check if the string contains the word 'Fern' (case-insensitive).
        Args:
            string (str): The input string to check.
        Returns:
            bool: True if the string contains 'Fern', False otherwise.
        """
        return bool(re.search(r'\bPalm\b', string, re.IGNORECASE))

    def _contains_semi_shade(self, string):
        """
        Check if the string contains the term 'Semi Shade' (case-insensitive).
        Args:
            string (str): The input string to check.
        Returns:
            bool: True if the string contains 'Semi Shade', False otherwise.
        """
        return bool(re.search(r'\bSemi Shade\b', string, re.IGNORECASE))

    def _contains_full_shade(self, string):
        """
        Check if the string contains the term 'Full Shade' (case-insensitive).
        Args:
            string (str): The input string to check.
        Returns:
            bool: True if the string contains 'Full Shade', False otherwise.
        """
        return bool(re.search(r'\bFull Shade\b', string, re.IGNORECASE))
    
    def _contains_semi_shade_jx(self, light_preference):
        """
        Check if light preference contains 'Semi Shade'.
        """
        return "Semi Shade" in light_preference

    def _contains_full_shade_jx(self, light_preference):
        """
        Check if light preference contains 'Full Shade'.
        """
        return "Full Shade" in light_preference
