import json
import pandas as pd
import re
import ast
import gc
import logging
from tqdm import tqdm
from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig

from src.utils.llama_manager import LlamaModel


class DataCleaningModel():
    def __init__(self, csv_filepath:str="../src/flora_data/flora_species_updated.csv"):
        self.flora_data = pd.read_csv(csv_filepath)
        # Updates to ensure all None is a string instead (if not it will be empty in the csv)
        self.data = self.flora_data.where(pd.notnull(self.flora_data), 'None')


    def clean_maximum_height(self, llama_model:AutoModelForCausalLM):
        """
        Function to do QA on the maximum height and convert all heights to metre
        Checks the data and if it does not follow a xx cm/m to xx cm/m format do QA

        Args:
            llama_model (AutoModelForCausalLM): Llama2-7b model set to QnA mode
        """
        # Clear any chat history
        llama_model.promptGenerator.clear_chat_history()
        for index, value in tqdm(self.data['Maximum Height'].items(), total=len(self.data['Maximum Height']), desc="Cleaning Maximum Heights"):
            #Regex pattern for xx cm/m to xx cm/m
            pattern = '^\d+(\.\d+)?( ?(cm|m))?( to \d+(\.\d+)?( ?(cm|m))?)?$'
            if value != '-' and not re.match(pattern, value):
                #Do not meet regex pattern and not - Llama QA
                response = llama_model.question_answer("What is the max height of the plant in meters?", value)
                try:
                    new_height = json.loads(response)['answer']
                
                except:
                    # For when the model fails to return a JSON
                    # Just assume no height for now
                    new_height = '-'
                
                self.data.at[index, 'Maximum Height'] = new_height

            # Meet the regex pattern, convert to metre
            elif re.match(pattern, value):
                max_height_m_int = value
                max_height = value
                if 'to' in value:
                    max_height = value[value.index('to') + 2:] #Taking the latter half max height
                
                # Convert value from cm to metre
                if 'cm' in max_height:
                    max_height_cm_str = max_height[:(max_height.index('cm'))].strip() 
                    max_height_m_int = float(max_height_cm_str)/100
                
                elif 'm' in max_height:
                    max_height_m_str = max_height[:max_height.index('m')].strip()
                    max_height_m_int = float(max_height_m_str)

                self.data.at[index, 'Maximum Height'] = max_height_m_int


    def clean_flower_colour(self, llama_model:AutoModelForCausalLM):
        """
        Function to do QA on the flower colour 
        Checks the data if flower, flowers, spathe are inside the text

        Args:
            llama_model (AutoModelForCausalLM): Llama2-7b model set to QnA mode
        """        
        # Clear any chat history
        llama_model.promptGenerator.clear_chat_history()
        for index, value in tqdm(self.data['Flower Colour'].items(), total=len(self.data['Flower Colour']), desc='Cleaning Flower Colour'):
            if 'flower' in value.lower() or 'flowers' in value.lower() or 'spathe' in value.lower():
                #Llama QA
                response = llama_model.question_answer("What are the colours of the flowers?", value)
                try:
                    flower_colour = json.loads(response)['answer']
                    # Just in case model returned a list 
                    try:
                        flower_colour = ast.literal_eval(flower_colour)
                    except:
                        pass
                    # Just in case model returned a list 
                    if isinstance(flower_colour, list):
                        flower_colour = " ".join(flower_colour).title()
                    # Captialise all words
                    else:
                       flower_colour = flower_colour.title()
                
                except:
                    # For now, if fails js changed the height to - To be manully retrieved
                    flower_colour = '-'

                self.data.at[index, 'Flower Colour'] = flower_colour


    def clean_trunk_texture(self, llama_model:AutoModelForCausalLM):
        """
        Function to do QA on trunk texture
        if trunk, trunks, bark, barks, stem, stems or girth in description, query

        Args:
            llama_model (AutoModelForCausalLM): Llama2-7b model set to QnA mode

        """
        # Clear any chat history
        llama_model.promptGenerator.clear_chat_history()
        for index, value in tqdm(self.data['Trunk Texture'].items(), total=len(self.data['Trunk Texture']), desc='Cleaning Trunk Texture'):
            response = None
            if 'trunk' in value.lower() or 'trunks' in value.lower():
                #Llama QA
                response = llama_model.question_answer("What is the texture of the trunk?", value)

            elif 'bark' in value.lower() or 'barks' in value.lower():
                response = llama_model.question_answer("What is the texture of the bark?", value)

            elif 'stem' in value.lower() or 'stems' in value.lower() or 'girth' in value.lower():
                response = llama_model.question_answer("What is the texture of the stem?", value)
            # If any query was done
            if response:
                try:
                    bark_texture = json.loads(response)['answer']
                
                except:
                    bark_texture = '-'

                self.data.at[index, 'Trunk Texture'] = bark_texture

        
    def clean_trunk_colour(self, llama_model:AutoModelForCausalLM):
        """
        Function to do QA on trunk colour
        if trunk, trunks, bark, barks, stem, stems or girth in description, query

        Args:
            llama_model (AutoModelForCausalLM): Llama2-7b model set to QnA mode

        """
        # Clear any chat history
        llama_model.promptGenerator.clear_chat_history()
        for index, value in tqdm(self.data['Trunk Colour'].items(), total=len(self.data['Trunk Colour']), desc='Cleaning Trunk Colour'):
            response = None
            if 'trunk' in value.lower() or 'trunks' in value.lower():
                #Llama QA
                response = llama_model.question_answer("What is the colour of the trunk?", value)

            elif 'bark' in value.lower() or 'barks' in value.lower():
                response = llama_model.question_answer("What is the colour of the bark?", value)

            elif 'stem' in value.lower() or 'stems' in value.lower() or 'girth' in value.lower():
                response = llama_model.question_answer("What is the colour of the stem?", value)
            # If any query was done
            if response:
                try:
                    bark_texture = json.loads(response)['answer']
                
                except:
                    bark_texture = '-'

                self.data.at[index, 'Trunk Colour'] = bark_texture
    

    def classify_leaf_texture(self, llama_model:AutoModelForCausalLM):
        """
        Function to classify leaf texture

        Args:
            llama_model (AutoModelForCausalLM): Llama2-7b model set to Classification mode (preset for leaf texture)
        """
        # Clear any chat history
        llama_model.promptGenerator.clear_chat_history()
        for index, value in tqdm(self.data['Leaf Texture'].items(), total=len(self.data['Leaf Texture']), desc='Classifying Leaf Texture'):
            if value != '-' and value != 'None':
                response = llama_model.classify(value)
                try:
                    leaf_texture = json.loads(response)['answer']
                    if leaf_texture.lower() in ['fine', 'medium', 'coarse']:
                        leaf_texture = leaf_texture.title()
                    else:
                        leaf_texture = '-'
                
                except:
                    leaf_texture = '-'

                self.data.at[index, 'Leaf Texture'] = leaf_texture


    def clean_data(self, output_path:str):
        """
        Function to run all data cleaning functions before downloading updated data into a csv file

        Args:
            output_path (str): filepath to csv output for clean dataset
        """
        QnAModel = LlamaModel('QnA')
        logging.info(f"Starting data cleaning.")
        self.clean_maximum_height(QnAModel)
        logging.info(f"Maximum Height Extracted")
        self.clean_flower_colour(QnAModel)
        logging.info(f"Flower Colour Extracted")
        self.clean_trunk_texture(QnAModel)
        logging.info(f"Trunk Texture Extracted")
        self.clean_trunk_colour(QnAModel)
        logging.info(f"Trunk Colour Extracted")

        logging.info("Information extration complete, starting classification.")
        del QnAModel
        gc.collect()
        classificationModel = LlamaModel("Classification")
        self.classify_leaf_texture(classificationModel)
        logging.info(f"Leaf Texture Classified")

        logging.info("Data cleaning completed")
        self.data.to_csv(output_path, index=False)
        logging.info(f"Data saved to {output_path}")

if __name__ == "__main__":
    pass