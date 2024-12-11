from fuzzywuzzy import fuzz, process  # for fuzzy matching
from nltk.stem import WordNetLemmatizer
import os
import json
from openai import OpenAI

# Ensure that you have filled in your OPENAI_API_KEY in .env

class ESPlantQueryGenerator():
    """
    Class to Generate ElasticSearch Query from input prompt and options
    """
    def __init__(self, 
                  gpt_extract:bool=False, 
                  function_requirements:str='./src/input/function_requirements.json',
                  es_query_requirements:str='./src/input/es_query_requirements.json',
                  keyword_schema:str='./src/input/schema/keyword_schema.json', 
                  query_schema:str='./src/input/schema/query_schema.json'):
        
        """
        Args:
            gpt_extract (bool, Optional): option to use GPT to extract keywords, if not string matching will automatically be used. Default to False.
            function_requirements (str, Optional): Filepath to JSON with all the key:value pairs for different functions
            es_query_requirements (str, Optional): Filepath to JSON containing all database key and their importance level (should be adhered to / must be adhered to)
            keyword_schema (str, Optional): Filepath to GPT's JSON schema for keyword extraction
            query_schema (str, Optional): Filepath to GPT's JSON schema for query generation
        """
        
        # GPT setup
        self.gpt_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self.keyword_schema_path =  keyword_schema
        self.query_schema_path = query_schema

        # Keyword Extraction Setup
        self.data_list = {
            "function": ["Boundary",  "Playground", "Active Zone", "Central Precinct Garden", "Passive Zone", "Sitting Corner", "Pavilion", "Pergola", "Future Community Garden", "Butterfly Garden"],
            "style": ["Naturalistic", "Manicured",  "Meadow", "Ornamental", "Minimalist", "Formal", "Picturesque", "Rustic", "Plantation"],
            "surrounding": {
                "Boundary": "Road", 
                "Playground": "Walkway", 
                "Active Zone": "Walkway", 
                "Central Precinct Garden": "Walkway",
                "Passive Zone": "Walkway", 
                "Sitting Corner": "Walkway", 
                "Pavilion": "Walkway", 
                "Pergola": "Walkway", 
                "Future Community Garden": "Walkway", 
                "Butterfly Garden": "Walkway"
            }
        }
        self.extract_keyword = self._extract_gpt_keyword if gpt_extract else self._extract_string_matching_keyword

        # Query Creation Setup
        self.function_design_requirements = self._load_JSON(function_requirements)
        self.es_query_requirements = self._load_JSON(es_query_requirements)   

    def _load_JSON(self, filepath:str):
        """
        Function to load a JSON object

        Args:
            filepath (str): filepath to json
        """
        with open(filepath, 'r') as file:
            data = json.load(file)
        return data


    def _extract_string_matching_keyword(self, prompt:str):
        """
        Function to extract function, style and surrounding from prompt using string matching
        These keywords are already pre-defined in self.data_list

        Args:
            prompt (str): user prompt from api call

        Returns:
            result (dictionary): dictionary in the format of {function: x, style:x, surrounding:x}, x will be from self.data_list or None.
        """
        result = {}
        # Tokenise words
        input_words = prompt.split()

        # Get stems of input words
        lemmatizer = WordNetLemmatizer()
        base_words = [lemmatizer.lemmatize(word) for word in input_words]

        for key, targets in self.data_list.items():
            # Retrieve results for function and style
            if isinstance(targets, list):
                base_targets = [lemmatizer.lemmatize(word) for word in targets]
                match = process.extractOne(" ".join(base_words), base_targets, scorer=fuzz.token_set_ratio, score_cutoff=60) #retrieve best matching word
                result[key] = match[0] if match != None else None
            # Extract surrounding data
            else:
                result[key] = targets.get(result['function'], None)
        
        return result
    

    def _extract_gpt_keyword(self, prompt:str):
        """
        Function to extract function, style and surrounding from prompt using gpt
        These keywords are already pre-defined in self.data_list

        Args:
            prompt (str): user prompt from api call

        Returns:
            result (dictionary): dictionary in the format of {function: x, style:x, surrounding:x}, x will be from self.data_list or None.
        """
        # GPT keyword extraction variables
        system_instruction = f"""You are an information extraction model for a landscape architect.
        Given user queries, you are to extract out the function (the purpose of the landscape area) and the style (planting style) from the input.
        The extracted value must be in the possible function and styles, else assign None.

        All possible function:
        {self.data_list['function']}
        
        All possible style:
        {self.data_list['style']}
        """
        # Load gpt return schema
        response_format = self._load_JSON(self.keyword_schema_path)

        # Base result
        result = {
            'function': None, 
            'style': None
        }
        # Query GPT to retrieve function and style
        completion = self.gpt_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            response_format=response_format,
        )
        # Convert string response to JSON
        response_json = json.loads(completion.choices[0].message.content)

        for key, targets in response_json.items():
            if targets != 'None'and targets != None:
                # Valid response, update result
                result[key] = targets

        result['surrounding'] = self.data_list['surrounding'].get(result['function'], None)
        
        return result 
    

    def _extract_query_values(self, prompt:str):
        """
        Function to extract elastic search query values from prompt using gpt
        Mainly the requirement of any specific plant type, attracted animals and colour

        Args:
            prompt (str): user prompt from api call

        Returns:
            gpt_response (dictionary): dictionary of GPT response, in the format in query_schema
        """
        
        # Query generation variables
        system_instruction = f"""You are a database querying model to retrieve the required plants for a landscape design.
        
        Using the user requirements, return the value for each database key. 
        If a key is invalid to the querying, let the value for that key be None.
        For colours, unless explicitedly mentioned should be for flowers, apply the colour to all colour fields.
        
        ---------------------
        Database keys and possible values:
        - Plant Type: list[str] (Palm, Herbaceous Plants)
        - Fruit Bearing: str (True, False, None)
        - Fragrant Plant: str (True, False, None)
        - Maximum Height (m): int 
        - Height: str (Tall, Short, None)
        - Flower Colour: list[str]
        - Attracted Animals: list[str] (Bird, Butterfly, Bee, Caterpillar Moth, Bat)
        - Avoid Animals: list[str] (Bird, Butterfly, Bee, Caterpillar Moth, Bat)
        - Mature Leaf Colour: list[str]
        - Young Flush Leaf Colour: list[str]
        - Trunk Colour: list[str]
        - Trunk Texture: list[str]
        - Leaf Texture: list[str] (Fine, Medium, Coarse)
        """
        # Load query return schema
        response_format = self._load_JSON(self.query_schema_path)
        # Extraction of Colours and Requirements
        completion = self.gpt_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            response_format=response_format,
        )
        return json.loads(completion.choices[0].message.content)


    def generate_query(self, user_call:dict):
        """
        Function to generate elasticsearch query from user call

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

        Returns:
            function_style_surrounding_extraction (dictionary): extracted function, style and surrounding
            query (dictionary): custom query for elastic search
            rerank_requirements (dictionary): key requirements for the reranking algorithm       
        """
        # Base Query from the other option values
        query = {
            "bool": {
                "must": [],
                "must_not": [],
                "should": []
            }
        }
        
        # Option Data ----------------------------------------------------------------------------------------
        # Light Preference, add Full Shade as well
        query["bool"][self.es_query_requirements["Light Preference"]].append({
            "terms": {"Light Preference.keyword": list(set(["Full Shade", user_call['light_preference']]))}
        })

        # Water Preference
        query["bool"][self.es_query_requirements["Water Preference"]].append({
            "term": {"Water Preference.keyword": user_call['water_preference']}
        })

        # Drought Tolerant
        query["bool"][self.es_query_requirements["Drought Tolerant"]].append({
            "term": {"Drought Tolerant": user_call['drought_tolerant']}
        })

        # Prompt Data ----------------------------------------------------------------------------------------
        # Extracting Function, Style & Surrounding from prompt and retrieve requirements
        function_style_surrounding_extraction = self.extract_keyword(user_call['prompt'])
        function_requirements = self.function_design_requirements.get(function_style_surrounding_extraction['function'], {})
        
        # Extract colour and other requirements from GPT
        gpt_response_json = self._extract_query_values(user_call['prompt'])

        # Plant Types, add shrub and tree
        function_plant_requirements = function_requirements.get("Plant Type", [])
        all_plant_types = list(set(["Tree", "Shrub"] + function_plant_requirements + gpt_response_json["Plant Type"]))
        query["bool"][self.es_query_requirements["Plant Type"]].append({
            "terms": {"Plant Type.keywords": all_plant_types}
        })

        # Hazard, if no hazard dont need to add to query, else Hazard must be N/A (no hazard)
        hazard_requirements = function_requirements.get("Hazard", None)
        if hazard_requirements != None:
            query["bool"][self.es_query_requirements["Hazard"]].append({
                "term": {"Hazard": hazard_requirements}
            })

        # Other variables
        for key, items in gpt_response_json.items():
            # Ignore non querying terms
            if key == "Plant Type" or key == "Height":
                pass

            # Maximum height, Prioritise the gpt response > preset function requirements
            elif key == "Maximum Height (m)":
                function_value = function_requirements.get(key, 0)
                # If there is a height constraint
                if function_value != 0 or items != 0:
                    height_constraints = items if items != 0 else function_value
                    query["bool"][self.es_query_requirements[key]].append({
                        "range": {
                            "Maximum Height (m)": {
                                "lt": height_constraints
                            }
                        }
                    })

            # Boolean Terms, Prioritise the gpt response > preset function requirements
            elif key == "Fruit Bearing" or key == "Fragrant Plant":
                gpt_value = True if items == "True" else False if items == "False" else None
                function_value = function_requirements.get(key, None)

                # only add query if both are not None
                if gpt_value != None and function_value != None:
                    query["bool"][self.es_query_requirements[key]].append({
                        "term": {key: gpt_value if gpt_value != None else function_value}
                    })

            # Attracted Animals, need include option data
            elif key == "Attracted Animals":
                function_value = function_requirements.get(key, [])
                all_animal_values = list(set(items + function_value + user_call['fauna_attracted']))
                if len(all_animal_values) > 0:
                    string_value = " ".join(all_animal_values)
                    query["bool"][self.es_query_requirements[key]].append({
                        "match": {key: string_value}
                    })

            # Avoid Animals is under Attraced Animals
            elif key == "Avoid Animals":
                function_value = function_requirements.get(key, [])
                all_values = list(set(items + function_value))
                if len(all_values) > 0:
                    string_value = " ".join(all_values)
                    query["bool"][self.es_query_requirements[key]].append({
                        "match": {"Attracted Animals": string_value}
                    })

            else:
                # List of Str terms, convert to a long string for a match query
                function_value = function_requirements.get(key, [])
                all_values = list(set(items + function_value))
                if len(all_values) > 0:
                    string_value = " ".join(all_values)
                    query["bool"][self.es_query_requirements[key]].append({
                        "match": {key: string_value}
                    })

        # Reranking Requirements, just for easy access
        rerank_requirements = {
            "Maximum Plant Count": user_call['maximum_plant_count'],
            "Ratio Native": user_call['ratio_native'],
            "Plant Type": all_plant_types,
            "Attracted Animals": all_animal_values,
            "Light Preference": user_call['light_preference']
        }
        # Add Height if not none
        if gpt_response_json['Height'] != "None" and gpt_response_json['Height'] != None:
            rerank_requirements['Height'] = gpt_response_json['Height']

        return function_style_surrounding_extraction, query, rerank_requirements
    
if __name__ == "__main__":
    pass