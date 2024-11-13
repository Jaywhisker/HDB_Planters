import pandas as pd
import numpy as np
from collections import Counter
import math

from src.utils.ES_manager import ESManager
from src.utils.ES_query_generator import ESPlantQueryGenerator

class PlantSelectionModel():
    """
    Class that contains entire pipeline to generate plant palette from user requirements
    """
    def __init__(self,
                 es_manager:ESManager,
                 plant_query_generator:ESPlantQueryGenerator,
                 collection_name:str='flora'
                 ):
        
        """
        Args:
            es_manager (ESManager): esManager instance
            plant_query_generator (ESPlantQueryGenerator): ESPlantQueryGenerator instance
            collection_name (str, Optional): 
            gpt_extract (bool, Optional): option to use GPT to extract keywords, if not string matching will automatically be used. Default to False.
            function_requirements (str, Optional): Filepath to JSON with all the key:value pairs for different functions
            es_query_requirements (str, Optional): Filepath to JSON containing all database key and their importance level (should be adhered to / must be adhered to)
            keyword_schema (str, Optional): Filepath to GPT's JSON schema for keyword extraction
            query_schema (str, Optional): Filepath to GPT's JSON schema for query generation
        """
        self.query_generator = plant_query_generator
        self.es_manager = es_manager
        self.collection_name = collection_name


    def retrieve_results(self, query:dict, light_preference:str, maximum_plant_count:int):
        """
        Function to query elasticSearch database to retrieve filtered plants
        Checks that the amount of plants returned is sufficient, or if user query was invalid

        Args:
            query (dict): Custom elasticsearch query
            light_preference (str): user light preference
            maximum_plant_count (int): maximum plant count for user plant palette

        Returns:
            results (list): list of results from elasticSearch, else empty list for no results
        """
        result = self.es_manager.custom_query(self.collection_name, query, 9999)
        if result['response'] == '200':
            print(f"Retrieved {len(result['api_resp'])} results.")
            # Enough data to meet maximum plant count
            if len(result['api_resp']) >= maximum_plant_count:
                return result['api_resp']
            
            # Not enough data, need to ensure at least 3 plants
            elif len(result['api_resp']) < 3:
                return []
            
            else:
                data = pd.DataFrame([item['_source'] for item in result])
                tree_count = data[data['Plant Type'].isin(['Tree', 'Palm'])].shape[0] # Get tree count
                shade_count = data[(data['Plant Type'] == 'Shrub')].shape[0] # Get shrub count
                shade_shrub_count = data[(data['Plant Type'] == 'Shrub') & (data['Light Preference'] == 'Full Shade')].shape[0] # Get shade loving count
                
                # Require 1 full shade and 1 light preference plant
                if light_preference != 'Full Shade':
                    non_shade_shrub_count = shade_count - shade_shrub_count
                else:
                    non_shade_shrub_count = 1 #Just to pass the checker 

                # Minimum 1 tree/palm, 1 shrub that is shade loving, 1 shrub for whatever light preference
                if tree_count >= 1 and shade_shrub_count >= 1 and non_shade_shrub_count >=1 :
                    return result['api_resp']
                else:
                    return []
        
        # No documents found
        else:
            print(result)
            return []        
        

    def rerank_results(self, results:list, rerank_requirements:dict):
        """
        Function to rerank the scores of all results
        Reranking ElasticSearch results with the following:
        1. Height, if Height = Tall, rerank from tall to short, with +0.2 incremental score in each plant type
        2. Plant Type: If provided and not Shrub & Tree, +1 score wise
        3. Attracted Animals: If provided, +2 score wise
        4. Native Habitat: Calculate all unique instances of Native Habitat, add score of counts / total (we want same habitats to be boosted)
        5. Leaf Texture: Calculate all unique instance of Leaf Texture, add (1-ratio)/2 (we want different textures)

        Args:
            results (list): results from database
            rerank_requirements (dict): reranked requirements to aid with the reranking scoring 
                {        
                "Maximum Plant Count": int,
                "Ratio Native": float,
                "Plant Type": list[str],
                "Attracted Animals": list[str],
                "Light Preference": str,
                "Height": str
                }
        
        Returns:
            reranked_results (pd.Dataframe)
        """
        # Convert response into a pandas dataframe for easy access
        processed_data = [
            {**{'_score': item['_score']}, **item['_source']}
            for item in results
        ]
        data = pd.DataFrame(processed_data)

        # Height
        height_value = rerank_requirements.get('Height', None)
        if height_value != None:
            sorted_data = data.sort_values(by="Maximum Height (m)", ascending= (False if height_value == 'Tall' else True))
            for plant_type in [["Shrub"], ["Tree", "Palm"]]:
                # Filter rows where Plant Type contains the target type, then apply cumulative scoring
                mask = sorted_data["Plant Type"].apply(lambda x: any(plant_t in x for plant_t in plant_type))
                num_items = mask.sum()
                incremental_values = np.arange(num_items - 1, -1, -1) * 0.2
                # Count from the bottom +0.2 * num of value from bottom for specific class
                sorted_data.loc[mask, "_score"] += incremental_values
                data = sorted_data

        # Plant Type
        prompt_plant_type = rerank_requirements['Plant Type'].copy()
        prompt_plant_type.remove('Tree')
        prompt_plant_type.remove('Shrub')
        # Unique plant type exists
        if len(prompt_plant_type) > 0:
            mask = data["Plant Type"].apply(lambda x: any(plant_t in x for plant_t in prompt_plant_type))
            data.loc[mask, "_score"] += 1

        # Attracted Animals
        prompt_attracted_animals = rerank_requirements['Attracted Animals']
        if len(prompt_attracted_animals) > 0:
            mask = data['Attracted Animals'].str.contains('|'.join(prompt_attracted_animals), case=False) # Finding any matching string
            data.loc[mask, "_score"] += 2

        # Native Habitat
        # Counting all habitat count
        habitat_counter = Counter()
        for habitat in data['Native habitat']:
            if "(" in habitat:
                # Get overaching and sub habitats
                overarching_habitat, sub_habitat_list = self._extract_overarching_subhabitat(habitat)
                # Counter
                habitat_counter[overarching_habitat] += 1
                for sub_value in sub_habitat_list:
                    habitat_counter[f'{overarching_habitat} ({sub_value.strip()})'] += 1
            # Only overaching, no sub habitats
            else:
                habitat_counter[habitat.strip()] += 1

        # Applying score of habitat counts
        # If just overarching terrestial, ignore
        # Else we + the best score which is the maxcount / total count
        for index, row in data.iterrows():
            habitat = row['Native habitat']
            if "(" in habitat:
                # Get overaching and sub habitats
                overarching_habitat, sub_habitat_list = self._extract_overarching_subhabitat(habitat)
                # Get counter score
                sub_counts = [habitat_counter.get(f"{overarching_habitat} ({sub.strip()})", 0) for sub in sub_habitat_list]
                max_sub_count = max(sub_counts)
                score_ratio = max_sub_count / habitat_counter.get(overarching_habitat)
                data.at[index, '_score'] += score_ratio
            # Only overaching, no sub habitats, no score addition

        # Leaf Texture
        flattened_leaf_textures = data['Leaf Texture'].explode() # Remove list
        leaf_texture_counts = flattened_leaf_textures.value_counts()
        total_count = len(data)
        leaf_texture_ratios =  (1 - (leaf_texture_counts / total_count))/2
        data['_score'] += data['Leaf Texture'].apply(lambda x: sum(leaf_texture_ratios.get(texture, 0) for texture in x))

        return data.sort_values(by='_score', ascending=False) # Descending Score 
    
    
    def _extract_overarching_subhabitat(self,habitat:str):
        """
        Extract all subhabitat and overaching habitat from string

        Args:
            habitat (str): Native Habitat of Data, in the format of overarchingHabitat (subHabitat)
        
        Returns:
            overarching_habitat (str): Overarching Habitat
            sub_habitat_list (list): List of all possible subHabitat, separated by ,
        """
        # Get overaching and sub habitats
        overarching_habitat = habitat[:habitat.index("(")].strip()
        sub_habitat = habitat[habitat.index("(")+1:habitat.index(")")]
        # Split sub habitats
        if "," in sub_habitat:
            sub_habitat_list = sub_habitat.split(",")
        else:
            sub_habitat_list = [sub_habitat]
        
        return overarching_habitat, sub_habitat_list
    

    def select_palette(self, reranked_result:pd.DataFrame, light_requirements:str, native_ratio:float, maximum_plant_count:int):
        """
        Function to select plant palette from reranked results, following the native ratio and maximum plant count

        Args:
            reranked_result (pd.DataFrame): reranked results
            light_preference (str): user light preference
            native_ratio (float): user native preference ratio
            maximum_plant_count (int): maximum plant count for user plant palette         

        Returns:
            result (pd.DataFrame): _description_
        """
        # Calculate required values by native & plant type
        num_native_species = math.ceil(native_ratio * maximum_plant_count)
        # 2 different light requirements 
        if light_requirements != 'Full Shade':
            # 1-5 plants: 1 shade loving, 6 will be 2 shade loving (2,2,2)
            num_shade_shrubs = math.ceil(maximum_plant_count / 5)
            # Remainder divided 2 or total num of trees frm db
            num_tree = min(math.floor((maximum_plant_count-num_shade_shrubs)/2), reranked_result['Plant Type'].apply(lambda x: 'Tree' in x or 'Palm' in x).sum())
            # Remainder
            num_non_shade_shrubs = maximum_plant_count - num_shade_shrubs - num_tree

        # Light preference is already full Shade, num_non_shade_shrub = 0
        else:
            num_non_shade_shrubs = 0
            # Divided by 2 or total num of trees in db
            num_tree = min(math.floor((maximum_plant_count)/2), reranked_result['Plant Type'].apply(lambda x: 'Tree' in x or 'Palm' in x).sum())
            # Remainder
            num_shade_shrubs = maximum_plant_count - num_tree

        # Priority list
        # 1. native species, 2. number of trees, shade, shrubs
        native_df = reranked_result[reranked_result['Native to SG'] == True]
        non_native_df = reranked_result[reranked_result['Native to SG'] == False]

        # Retrieving Native By Plant Type
        native_tree = native_df[native_df['Plant Type'].apply(lambda x: any(pt in ['Tree', 'Palm'] for pt in x))]
        native_non_shade_shrub = native_df[native_df['Plant Type'].apply(lambda x: 'Shrub' in x) & 
                                           (non_native_df['Light Preference'].apply(lambda x: 'Full Shade' not in x))]
        native_shade_shrub = native_df[(native_df['Plant Type'].apply(lambda x: 'Shrub' in x)) &
                                        (native_df['Light Preference'].apply(lambda x: 'Full Shade' in x))]

        # Retrieving Non-Native By Plant Type
        non_native_tree = non_native_df[non_native_df['Plant Type'].apply(lambda x: any(pt in ['Tree', 'Palm'] for pt in x))]
        non_native_non_shade_shrub = non_native_df[non_native_df['Plant Type'].apply(lambda x: 'Shrub' in x) &
                                                   (non_native_df['Light Preference'].apply(lambda x: 'Full Shade' not in x))]
        non_native_shade_shrub = non_native_df[(non_native_df['Plant Type'].apply(lambda x: 'Shrub' in x)) &
                                                (non_native_df['Light Preference'].apply(lambda x: 'Full Shade' in x))]
        

        # Not enough native plants, all native_df will go into result
        if len(native_df) <= num_native_species:
            # Calculate required trees, shrubs and shade_shrub
            # There is a bug for when the required are negative, the overall may be larger than the actual results...
            tree_required = max(num_tree - len(native_tree), 0)
            non_shade_shrub_required = max(num_non_shade_shrubs - len(native_non_shade_shrub), 0)
            shade_shrub_required = max(num_shade_shrubs - len(native_shade_shrub), 0)

            result = native_df
            # Sort based on the length of each dataframe
            non_native_plants = [[non_native_tree, tree_required], [non_native_non_shade_shrub, non_shade_shrub_required], [non_native_shade_shrub, shade_shrub_required]]
            sorted_non_native_plants = sorted(non_native_plants, key=lambda x: len(x[0]))

            diff = 0
            for index, [non_native_plant_df, required_count] in enumerate(sorted_non_native_plants):
                if index == 0:
                    best_k_data = non_native_plant_df.head(required_count)
                    result = pd.concat([result, best_k_data], ignore_index=True)
                    if len(best_k_data) < required_count:
                        diff = len(best_k_data) - required_count
                
                elif index == 1:
                    # Get 1/2 of the difference from prev
                    new_required_count = required_count + diff//2
                    best_k_data = non_native_plant_df.head(new_required_count)
                    result = pd.concat([result, best_k_data], ignore_index=True)

                else:
                    # Get all the remaining
                    new_required_count = maximum_plant_count - len(result)
                    best_k_data = non_native_plant_df.head(new_required_count)
                    result = pd.concat([result, best_k_data], ignore_index=True)

            return result
        
        # More than enough native plants, prioritise scoring when retrieving data
        if len(native_df) > num_native_species:
            # Extract best num_trees, num_non_shade_shrub, num_shade_shrub data from native and non-native
            best_native_tree = native_tree.head(num_tree)
            best_non_native_tree = non_native_tree.head(num_tree)
            best_native_non_shade_shrub = native_non_shade_shrub.head(num_non_shade_shrubs)
            best_non_native_non_shade_shrub = non_native_non_shade_shrub.head(num_non_shade_shrubs)
            best_native_shade_shrub = native_shade_shrub.head(num_shade_shrubs)
            best_non_native_shade_shrub = non_native_shade_shrub.head(num_shade_shrubs)

            # Merge and rank by scoring
            total_dataset = pd.concat([best_native_tree, best_non_native_tree, best_native_non_shade_shrub, best_non_native_non_shade_shrub, best_native_shade_shrub, best_non_native_shade_shrub], ignore_index=True)
            sorted_total_dataset = total_dataset.sort_values(by='_score', ascending=False)

            result = pd.DataFrame(columns=sorted_total_dataset.columns)
            unused_data = pd.DataFrame(columns=sorted_total_dataset.columns)
            # Base variable to keep track of all the data when we start getting the results
            num_native = 0
            num_non_native = 0
            current_trees = 0
            current_non_shade_shrubs = 0
            current_shade_shrubs = 0

            # Before iteration, we check to ensure that is enough data, if there is only total 2 shade shrubs, we must add both regardless of native or not, assuming there is enough other data
            if len(best_native_tree) + len(best_non_native_tree) <= num_tree:
                result = pd.concat([result, best_native_tree, best_non_native_tree], ignore_index=True)
                num_native += len(best_native_tree)
                num_non_native += len(best_non_native_tree)
                current_trees +=  len(best_native_tree) + len(best_non_native_tree) 
            # Non Shade Shrubs
            if len(best_native_non_shade_shrub) + len(best_non_native_non_shade_shrub) <= num_non_shade_shrubs:
                result = pd.concat([result, best_native_non_shade_shrub, best_non_native_non_shade_shrub], ignore_index=True)
                num_native += len(best_native_non_shade_shrub)
                num_non_native += len(best_non_native_non_shade_shrub)
                current_non_shade_shrubs +=  len(best_native_non_shade_shrub) + len(best_non_native_non_shade_shrub)
            # Shade Shrubs
            if len(best_native_shade_shrub) + len(best_non_native_shade_shrub) <= num_shade_shrubs:
                result = pd.concat([result, best_native_shade_shrub, best_non_native_shade_shrub], ignore_index=True)
                num_native += len(best_native_shade_shrub)
                num_non_native += len(best_non_native_shade_shrub)
                current_shade_shrubs += len(best_native_shade_shrub) + len(best_non_native_shade_shrub)

            for _, row in sorted_total_dataset.iterrows():
                # Determine which plant type and light preference
                plant_type_key = ["Tree", "Palm", "Shrub"]
                plant_key = [plant for plant in row['Plant Type'] if plant in plant_type_key][0]
                full_shade = True if ('Full Shade' in row['Light Preference']) else False
                # Adding SG native data when the counts lower than required
                if row['Native to SG'] and num_native < num_native_species:
                    if plant_key == "Shrub" and full_shade and current_shade_shrubs < num_shade_shrubs:
                        current_shade_shrubs += 1
                        num_native += 1
                        result = pd.concat([result, pd.DataFrame([row])], ignore_index=True)
                    
                    elif plant_key == "Shrub" and current_non_shade_shrubs < num_non_shade_shrubs:
                        current_non_shade_shrubs += 1
                        num_native += 1
                        result = pd.concat([result, pd.DataFrame([row])], ignore_index=True)
                    
                    elif plant_key == "Palm" or plant_key == "Tree" and current_trees < num_tree:
                        current_trees += 1
                        num_native += 1
                        result = pd.concat([result, pd.DataFrame([row])], ignore_index=True)
                    
                    else:
                        unused_data =  pd.concat([unused_data, pd.DataFrame([row])], ignore_index=True)

                # Adding non native data when the counts lower than required
                elif not row['Native to SG'] and num_non_native < (maximum_plant_count - num_native_species):
                    if plant_key == "Shrub" and full_shade and current_shade_shrubs < num_shade_shrubs:
                        current_shade_shrubs += 1
                        num_non_native += 1
                        result = pd.concat([result, pd.DataFrame([row])], ignore_index=True)
                    
                    elif plant_key == "Shrub" and current_non_shade_shrubs < num_non_shade_shrubs:
                        current_non_shade_shrubs += 1
                        num_non_native += 1
                        result = pd.concat([result, pd.DataFrame([row])], ignore_index=True)
                    
                    elif plant_key == "Palm" or plant_key == "Tree" and current_trees < num_tree:
                        current_trees += 1
                        num_non_native += 1
                        result = pd.concat([result, pd.DataFrame([row])], ignore_index=True)

                    else:
                        unused_data =  pd.concat([unused_data, pd.DataFrame([row])], ignore_index=True)

                # If not adding, add to unused data
                else:
                    unused_data =  pd.concat([unused_data, pd.DataFrame([row])], ignore_index=True)

                # Once hit the size, break 
                if len(result) == maximum_plant_count:
                    break

            # In the scenario there wasn't enough specific plant type data and the total count is lacking after iterating all the data
            # Add the best unused data to make up the difference
            if len(result) < maximum_plant_count:
                native_diff = num_native_species - num_native
                non_native_diff = maximum_plant_count - num_native_species - num_non_native
                # Select additional native plants
                native_additional = unused_data.loc[unused_data['Native to SG'] == True].head(native_diff)
                # Select additional non-native plants
                non_native_additional = unused_data.loc[unused_data['Native to SG'] == False].head(non_native_diff)
                # Not enough native data, get more non_native data
                if len(native_additional) < native_diff:
                    non_native_additional = unused_data.loc[unused_data['Native to SG'] == False].head(non_native_diff + (native_diff - len(native_additional)))
                # Not enough non native data, get more native data
                elif len(non_native_additional) < non_native_diff:
                    native_additional = unused_data.loc[unused_data['Native to SG'] == True].head(native_diff + (non_native_diff - len(non_native_additional)))

                result = pd.concat([result, native_additional, non_native_additional], ignore_index=True)
            
            return result


    def generate_plant_palette(self, user_call:dict):
        """
        Function to retrieve plant palette and all possible plants from user_call

        Args:
            user_call (dict): api call input in the format of 
            {
                "prompt": str, 
                "maximum_plant_count": int(3-8),
                "light_preference":"Full Shade"/ "Semi Shade"/ "Full Sun",
                "water_preference": "Lots of Water"/ "Moderate Water"/ "Little Water"/ "Occassional Misting",
                "drought_tolerant": True / False,
                "fauna_attracted": ["Butterfly", "Bird", "Caterpillar Moth", "Bat", "Bee"],
                "ratio_native": float(0-1)
            } 

        Return:
            result (dict): API call result
            {
            "plant_palette": [Species_ID],
            "all_plants": [
                {plant data from ElasticSearch}, ...
                ] 
            }
        """
        # Generate query from user_call
        es_query, rerank_requirements = self.query_generator.generate_query(user_call)
        # Retrieve data from elasticSearch
        results = self.retrieve_results(es_query, rerank_requirements['Light Preference'], rerank_requirements['Maximum Plant Count'])
        if len(results) == 0:
            return {
                "plant_palette": [],
                "all_plants": []
            } 
        # Rerank results
        reranked_results = self.rerank_results(results, rerank_requirements)
        # Selected results
        selected_plant_palette = self.select_palette(reranked_results, rerank_requirements['Light Preference'], rerank_requirements['Ratio Native'], rerank_requirements['Maximum Plant Count'])
        # Retrieve all species ID from selected_plant_palette
        selected_ids = selected_plant_palette['Species ID'].to_list()[:rerank_requirements['Maximum Plant Count']]
        return {
            "plant_palette": selected_ids,
            "all_plants": [data['_source'] for data in results]
        }

if __name__ == "__main__":
    pass