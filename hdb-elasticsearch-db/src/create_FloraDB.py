"""
Python File to scrape Flora & Fauna Web before providing data cleaning with Llama2-7b 

Note: 
To download LLama2-7b from hugging face, you require access from meta.
Once you have gotten access, please retrieve an authentication key from your own hugging face account.

Get access here: https://huggingface.co/meta-llama/Llama-2-7b
"""
import argparse
import os
import logging

from src.utils.flora_attributes_scrapper import FloraAttributesScraper
from src.utils.flora_link_scrapper import FloraLinksScraper
from src.utils.data_cleaning_manager import DataCleaningModel


def parse_arguments():
    """
    Function defining all arguments for the data
    """
    parser = argparse.ArgumentParser(description="Web Scrapping Details.")
    
    # Define the arguments
    parser.add_argument('--clean_data', type=bool, default=True, help='Run data cleaning with Llama2-7b? Defaults to True.')
    parser.add_argument('--output_folder', type=str, default='./src/flora_data/', help='Dataset CSV output folder.')
    parser.add_argument('--logs_folder', type=str, default='./src/flora_data/logs/', help='Logs output folder.')

    return parser.parse_args()


def main():
    args = parse_arguments()

    # Accessing the arguments
    clean_data = args.clean_data
    DATA_FOLDER = args.output_folder
    LOGS_FOLDER = args.logs_folder

    # Create folders
    if not os.path.exists(DATA_FOLDER):
        os.makedirs(DATA_FOLDER)

    if not os.path.exists(LOGS_FOLDER):
        os.makedirs(LOGS_FOLDER)

    # Logs configuration
    logging.basicConfig(
        filename=os.path.join(LOGS_FOLDER, 'dataset.log'),
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        filemode='w'
    )
    """
    Scrapping Links
    """
    CSV_FILENAME = 'flora_species_links.csv'
    LINKS_CSV_FILE_PATH = os.path.join(DATA_FOLDER, CSV_FILENAME)
    link_scrapper = FloraLinksScraper(DATA_FOLDER, LINKS_CSV_FILE_PATH)
    link_scrapper.scrape_flora_data()
    print("Links scrapped, scrapping flora details.")

    """
    Scrapping Attributes
    """    
    CSV_FILENAME = 'flora_species_attributes.csv'
    ATTRIBUTES_CSV_FILE_PATH = os.path.join(DATA_FOLDER, CSV_FILENAME)
    attr_scrapper = FloraAttributesScraper(DATA_FOLDER, LINKS_CSV_FILE_PATH, ATTRIBUTES_CSV_FILE_PATH)
    attr_scrapper.scrape()
    print("Attributes scrapped.")

    """
    Data Cleaning
    """
    if clean_data:
        print("Starting Data Cleaning")
        dataset_cleaner = DataCleaningModel(ATTRIBUTES_CSV_FILE_PATH)
        dataset_cleaner.clean_data(os.path.join(DATA_FOLDER, 'cleaned_flora_species.csv'))
    
    print("Dataset Successfully Created.")

if __name__ == "__main__":
    main()