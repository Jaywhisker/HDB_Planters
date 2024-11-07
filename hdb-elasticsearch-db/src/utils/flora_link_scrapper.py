import os
import csv
import re
import requests
import logging

class FloraLinksScraper:
    '''
    scraper class to fetch, process, and save flora species data from NParks Flora & Fauna API.

    attributes:
        items_count (int): number of species to request from the API (default = 9999).
    '''
    JSON_URL_TEMPLATE = "https://www.nparks.gov.sg/api/FFWApi/GetSpecies?itemsRequested={}&page=1&category=&productTerm=&tags=flora&sort=&imageTag="
    BASE_URL = "https://www.nparks.gov.sg"

    def __init__(self, data_folder: str, csv_file_path: str, items_count: int = 9999):
        '''
        initialize the FloraScraper with a given number of items to fetch.

        parameters:
            data_folder (str): The folder path where data will be stored.
            csv_file_path (str): The CSV file path for saving species links.
            items_count (int): number of species to fetch from the API.
        '''
        self.data_folder = data_folder
        self.csv_file_path = csv_file_path
        self.items_count = items_count
        self.ensure_data_folder_exists()
        self.existing_links = self.load_existing_species_links()

    def ensure_data_folder_exists(self) -> None:
        '''
        ensure that the data folder exists. if not found, it will create the folder.
        '''
        if not os.path.exists(self.data_folder):
            os.makedirs(self.data_folder)
            logging.info(f"Created folder: {self.data_folder}")
        else:
            logging.info(f"Folder already exists: {self.data_folder}")

    def load_existing_species_links(self) -> set:
        '''
        load existing species links from the CSV file into a set.

        returns:
            set: set containing the links of species already present in CSV file.
        '''
        # if csv file does not exist, create new file
        if not os.path.exists(self.csv_file_path):
            logging.info(f"No existing CSV found. New file will be created at {self.csv_file_path}.")
            return set()

        # if csv file exists, checks through each row for existing links.
        # utilising links to check for matching as it is more unique than species name
        existing_links = set()
        try:
            with open(self.csv_file_path, mode='r', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    link = row.get('Link')
                    if link:
                        existing_links.add(link)
            logging.info(f"Loaded {len(existing_links)} existing species from CSV.")
        except Exception as e:
            logging.error(f"Error reading CSV file: {e}")
        
        return existing_links

    def fetch_species_data(self) -> list:
        '''
        fetch the species data from the API in JSON format.

        returns:
            list: list of species data (dictionaries), or an empty list if an error occurs.
        '''
        url = self.JSON_URL_TEMPLATE.format(self.items_count)
        logging.info(f"Accessing URL: {url}")
        try:
            response = requests.get(url)
            response.raise_for_status()
            logging.info(f"Successfully fetched flora species data.")
            return response.json().get('species', [])
        except requests.RequestException as e:
            logging.error(f"Error fetching data from API: {e}")
            return []

    @staticmethod
    def clean_html_tags(text: str) -> str:
        '''
        clean HTML tags from text string.

        parameters:
            text (str): name string containing HTML tags.

        returns:
            str: cleaned name string without HTML tags or '-' if name not found in JSON.
        '''
        return re.sub(r'<.*?>', '', text) if text else '-'

    @staticmethod
    def extract_species_id(link: str) -> str:
        '''
        extract species ID from the given species link.
        species ID should be the number that comes after the last '/' in the link.

        parameters:
            link (str): link to the species' page.

        returns:
            str: The species ID, or '-' if the link is empty.
        '''
        return link.split('/')[-1] if link else '-'

    def process_species_data(self, species: dict) -> list:
        '''
        process single species data dictionary to extract relevant information.

        parameters:
            species (dict): species data dictionary.

        returns:
            list: list containing the scientific name, common name, species ID, and full link.
        '''
        # default is set to '-' for information not found in species dictionary
        scientific_name = self.clean_html_tags(species.get('name', '-'))
        common_name = species.get('commonName', '-')
        link = species.get('link', '-')
        species_id = self.extract_species_id(link)
        full_link = self.BASE_URL + link

        #ensure '-' is returned for missing data
        if not scientific_name:
            scientific_name = '-'
        if not common_name:
            common_name = '-'
        if not species_id or species_id == '-':
            species_id = '-'
        full_link = self.BASE_URL + link if link != '-' else '-'
        
        return [scientific_name, common_name, species_id, full_link]

    def write_to_csv(self, data: list, mode='a') -> None:
        '''
        write processed species data to CSV file.

        parameters:
            data (list): list of lists where each inner list represents a row of species data.
            mode (str): file mode ('w' for write, 'a' for append). Default is 'a' for append.
        '''
        # check if file exists
        file_exists = os.path.exists(self.csv_file_path)

        # by default, it will append
        with open(self.csv_file_path, mode=mode, newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            # however, if file does not exists, then will first append header row before rows of data
            if not file_exists or mode == 'w':  # add header if the file is being created, which means csv file did not exist prior.
                writer.writerow(["Scientific Name", "Common Name", "Species ID", "Link"])
            writer.writerows(data)
        logging.info(f"Data successfully written to {self.csv_file_path}")

    def scrape_flora_data(self) -> None:
        '''
        main function to scrape flora data from the API and save it to a CSV file.
        checks and skips species that already exist in the CSV based on their link.
        '''
        species_data = self.fetch_species_data()
        if not species_data:
            logging.error("No species data to process. Exiting.")
            return
        
        logging.info(f"Processing {len(species_data)} species.") 
        
        processed_data = []
        new_species_count = 0 #tracking number of new species updated
        skipped_count = 0
        skipped_species_links = [] 

        for species in species_data:
            row = self.process_species_data(species)
            species_link = row[-1]  # link is the last item in the list
            if species_link in self.existing_links:
                skipped_count += 1
                skipped_species_links.append(species_link)
                logging.debug(f"Skipping species with link {species_link}. Already exists.") #only logged if in debug mode if wish to have access to species link
                continue  # skip this species since it already exists
            
            processed_data.append(row)
            self.existing_links.add(species_link)  # add the new link to the set, avoiding future duplication
            new_species_count += 1

        # Summary of skipped species
        logging.warning(f"Total skipped species: {skipped_count}. Already exists.")
        
        self.write_to_csv(processed_data)
        logging.info(f"Flora data scraping complete. {new_species_count} new species added. Total species in CSV: {len(self.existing_links)}")


if __name__ == '__main__':
    pass
    # DATA_FOLDER = os.path.join('src', 'flora_data')
    # if not os.path.exists(DATA_FOLDER):
    #     os.makedirs(DATA_FOLDER)

    # LOGS_FOLDER = os.path.join('src', 'flora_data', 'logs')
    # if not os.path.exists(LOGS_FOLDER):
    #     os.makedirs(LOGS_FOLDER)

    # CSV_FILENAME = 'flora_species.csv'
    # CSV_FILE_PATH = os.path.join(DATA_FOLDER, CSV_FILENAME)

    # # logs configuration: note that log is cleared at each run
    # logging.basicConfig(
    #     filename=os.path.join(DATA_FOLDER, 'flora_link_scraping.log'),
    #     level=logging.INFO,
    #     format='%(asctime)s - %(levelname)s - %(message)s',
    #     filemode='w'
    # )

    # scraper = FloraLinksScraper()
    # scraper.scrape_flora_data()
