import os
import csv
import logging
import requests
from bs4 import BeautifulSoup
from collections import defaultdict

DATA_FOLDER = os.path.join('src', 'flora_data')
if not os.path.exists(DATA_FOLDER):
    os.makedirs(DATA_FOLDER)

CSV_FILENAME = 'flora_species.csv'
CSV_UPDATED_FILENAME = 'flora_species_updated.csv'
CSV_FILE_PATH = os.path.join(DATA_FOLDER, CSV_FILENAME)
CSV_UPDATED_FILE_PATH = os.path.join(DATA_FOLDER, CSV_UPDATED_FILENAME) 

# logs configuration: note that log is cleared at each run
logging.basicConfig(
    filename=os.path.join(DATA_FOLDER, 'flora_scraping.log'),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='w'
)

class WebScrap:
    '''
    WebScrap class to fetch additional plant data from NParks Flora & Fauna pages.

    attributes:
        start_row (int): row to start scraping from in the CSV file.
        end_row (int): row to end scraping at in the CSV file.
    '''

    def __init__(self, start_row: int = 0, end_row: int = None):
        '''
        initialize the WebScrap with starting and ending rows for processing.

        parameters:
            start_row (int): row to start scraping from in the CSV file.
            end_row (int): row to end scraping at in the CSV file.
        '''
        self.start_row = start_row
        self.end_row = end_row
        self.ensure_data_folder_exists()
        self.species_data = []

        self.is_shrub = False
        self.is_tree = False

        # boolean variables to check if plant info already found
        self.found_max_height = False
        self.found_flower_color = False
        self.found_mature_bark_texture = False
        self.found_bark_colour = False
        self.found_foliage = False

        # define possible selections for each logo criterion
        self.plant_types = ['Aquatic & Hydrophyte', 'Bamboo', 'Climber', 'Creeper',
                            'Cycad', 'Epiphyte', 'Grass or Grass-like Plant', 
                            'Herbaceous Plant', 'Lithophyte', 'Palm', 
                            'Shrub', 'Succulent Plant', 'Tree']
        
        self.light_preferences = ['Full Sun', 'Semi Shade', 'Full Shade']
        self.water_preferences = ['Little Water', 'Lots of Water', 'Moderate Water', 'Occasional Misting', 'Prefers Cool Environment']

        # define possible plant types in either shrubs or trees
        self.shrubs = ['Shrub', 'Succulent Plant','Herbaceous Plant', 'Lithophyte', 'Cycad', 'Epiphyte', 'Aquatic & Hydrophyte', 'Bamboo', 'Climber', 'Creeper']
        self.trees = ['Palm','Tree']

    def ensure_data_folder_exists(self) -> None:
        '''
        ensure that the data folder exists. if not found, it will create the folder.
        '''
        if not os.path.exists(DATA_FOLDER):
            os.makedirs(DATA_FOLDER)
            logging.info(f"Created folder: {DATA_FOLDER}")
        else:
            logging.info(f"Folder already exists: {DATA_FOLDER}")
    
    def read_csv(self):
        '''
        read species data from CSV file.

        returns:
            list: list of rows from the CSV file.
        '''
        try:
            with open(CSV_FILE_PATH, mode='r', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    yield row
        except FileNotFoundError as e:
            logging.error(f"CSV file not found: {e}")
        except IOError as e:
            logging.error(f"Error reading CSV file: {e}")

    def get_plant_type(self, soup: BeautifulSoup) -> dict:
        '''
        extracts and looks for specific plant types such as trees and shrubs by checking:
        1. The 'species-info__icons' section of the page.
        2. The 'Classifications and Characteristics' section, particularly under 'Plant Shape'.
        
        if any matching plant types are found, 
        flags `self.is_tree` and `self.is_shrub` are set accordingly (in order to check for tree or shrub specific attribute later), 
        and the plant types are returned as a comma-separated string in a dictionary.

        parameters:
            soup (BeautifulSoup): parsed HTML page data from which plant types will be extracted.

        returns:
            dict: dictionary containing the plant type(s) as a string in the format 
                {'Plant Type': '<comma-separated plant types>'}, or '-' if none are found.

        example:
            {'Plant Type': 'Tree, Shrub'}
        '''
        plant_types = []

        # check for matching plant types in the species info icons
        icons_div = soup.find('div', class_='species-info__icons')
        if icons_div:
            for icon in icons_div.find_all('a'):
                img = icon.find('img')
                if img:
                    title = img.get('title').lower()
                    for plant_type in self.plant_types:
                        if title.strip().lower() == plant_type.strip().lower():
                            logging.info(f"Plant type {title} found in icons..")
                            plant_types.append(plant_type)

        else:
            logging.info("No plant type icons found.")

        # check for plant shape in the classifications section
        def check_classification_table(table):
            for row in table.find_all('tr'):
                header = row.find('th') or row.find('td')
                if header:
                    header_text = header.find('strong').text.strip() if header.find('strong') else ''
                    data_cell = header.find_next_sibling('td')
                    if 'plant shape' in header_text.lower():
                        value = data_cell.text.strip().lower() if data_cell else ''
                        if value == 'shrubby' and 'Shrub' not in plant_types:
                            logging.info(f"Plant shape '{value}' found in classification. Adding 'Shrub' to plant types.")
                            plant_types.append('Shrub')

        # find tables in the classifications section
        classifications_heading = soup.find('h3', id='classifications')
        if classifications_heading:
            first_table_div = classifications_heading.find_next('div', class_='rte')
            if first_table_div:
                table = first_table_div.find('table', {'aria-label': 'descflora'})
                table_show = first_table_div.find('table', {'aria-label': 'descfloraShow'})
                if table:
                    check_classification_table(table)
                if table_show:
                    check_classification_table(table_show)

        else:
            logging.info("No classifications section found.")

        # set flags based on plant types found
        self.is_tree = any(pt in self.trees for pt in plant_types)
        self.is_shrub = any(pt in self.shrubs for pt in plant_types)

        # log final plant types found
        if plant_types:
            logging.info(f"Final plant types identified: {', '.join(plant_types)}")
        else:
            logging.info("No plant types identified.")

        return {'Plant Type': ', '.join(plant_types) if plant_types else '-'}

    def get_default_icon_data(self) -> dict:
        '''
        returns default default values based on plant type.

        example:
        For shrubs, the default value for 'Fragrant Plant?' is set to '-'. For trees, it is set to 'None'.

        returns: dict: a dictionary with default values for following keys:
              'Light Preference', 'Water Preference', 'Drought Tolerant?', 
              'Native to SG?', 'Fruit Bearing?', and 'Fragrant Plant?'.

              Example:
              {
                  'Light Preference': '-',
                  'Water Preference': '-',
                  'Drought Tolerant?': 'False',
                  'Native to SG?': 'False',
                  'Fruit Bearing?': 'False',
                  'Fragrant Plant?': '-'
              }

        '''
        default_data = {
            'Light Preference': '-',
            'Water Preference': '-',
            'Drought Tolerant?': 'False',
            'Native to SG?': 'False',
            'Fruit Bearing?': 'False'
        }
        default_data['Fragrant Plant?'] = '-' if self.is_shrub else 'None'
        return default_data

    def extract_icon_title(self, title: str, icon_data: dict):
        '''
        updates icon data based on the title found in the icon's image.

        For titles that correspond to specific preferences (like light or water preference), it searches the respective list to find a matching value. 
        If the title does not require a list (e.g., just checking against string 'drought tolerant'), the value is set directly.

        parameters:
            title (str): title attribute of the icon's image (e.g., 'light preference','drought tolerant').
            icon_data (dict): dictionary to be updated with the corresponding plant attributes (e.g., 'Light Preference', 'Drought Tolerant?').

        returns:
            None: The function updates the `icon_data` dictionary in-place.    
        '''


        # define a mapping of titles to icon data keys and their corresponding preferences lists
        title_mapping = {
            'light preference': ('Light Preference', self.light_preferences),
            'water preference': ('Water Preference', self.water_preferences),
            'drought tolerant': ('Drought Tolerant?', None, 'True'),
            'native to singapore': ('Native to SG?', None, 'True'),
            'fruit bearing': ('Fruit Bearing?', None, 'True'),
            'fragrant plant': ('Fragrant Plant?', None, 'True')
        }

        # normalize the title for consistent comparison
        normalized_title = title.lower()

        # check if title has a mapping
        if normalized_title in title_mapping:
            icon_key, preferences_list, value = title_mapping[normalized_title]

            # if there is a preferences list, normalize and check against it
            if preferences_list:
                icon_data[icon_key] = next(
                    (pref for pref in preferences_list if pref.lower() == normalized_title), '-'
                )
                logging.info(f"{icon_key} {normalized_title} found.")
            else:
                # otherwise, set the value directly
                icon_data[icon_key] = value
                logging.info(f"{icon_key} icon found.")
        else:
            logging.warning(f"Title {normalized_title} not recognized.")

    def scrape_icons(self, soup: BeautifulSoup) -> dict:
        '''
        extracts and scrapes icon-related data from species webpage, including light preference, 
        water preference, drought tolerance, and other plant-specific attributes.

        If icon data is missing from the webpage, default values are returned based on the 
        plant type. 
        
        For trees, special handling is applied for the 'Fragrant Plant?' attribute 
        based on its presence or absence.

        parameters:
            soup (BeautifulSoup): Parsed HTML of the species webpage.

        returns:
            dict: dictionary with keys corresponding to the plant's attributes, such as 
                'Light Preference', 'Water Preference', 'Drought Tolerant?', 'Native to SG?', 
                'Fruit Bearing?', and 'Fragrant Plant?'.

                Example:
                {
                    'Light Preference': 'Full Sun',
                    'Water Preference': 'Moderate',
                    'Drought Tolerant?': 'True',
                    'Native to SG?': 'False',
                    'Fruit Bearing?': 'True',
                    'Fragrant Plant?': 'None'
                }
        '''
        icons_div = soup.find('div', class_='species-info__icons')

        # initialize icon_data using default function
        icon_data = self.get_default_icon_data()

        if not icons_div:
            logging.info("No icons found on the webpage. Using default values.")
            return icon_data

        for icon in icons_div.find_all('a'):
            img = icon.find('img')
            if img:
                title = img.get('title').lower()
                self.extract_icon_title(title, icon_data)

        # Handle special case for trees
        if self.is_tree and icon_data['Fragrant Plant?'] == 'False':
            logging.info("Tree detected. Setting 'Fragrant Plant?' to 'None' for trees.")
            icon_data['Fragrant Plant?'] = 'None'
        
        return icon_data

    def update_section_data(self, section_data: dict, table: BeautifulSoup, row_keywords: dict):
        """
        updates section data with values extracted from the table based on matching row header keywords.

        for each row in the table, it looks for a header (td or th with <strong>)that matches any of the provided row keywords. 
        if a match is found, the corresponding data cell value (which would be the first td after) is added to the `section_data` dictionary under the mapped key. 
        special handling is provided for the 'Leaf Colour' key, where multiple values are appended.
        
        parameters:
            section_data (dict): dictionary that holds the extracted data.
            table (BeautifulSoup): BeautifulSoup object representing the HTML table from which data will be extracted.
            row_keywords (dict): dictionary mapping row header keywords (case-insensitive) to output data keys in `section_data`.
        """
        for row in table.find_all('tr'):
            header = row.find('th') or row.find('td')
            if header:
                header_text = header.find('strong').text.strip() if header.find('strong') else None
                data_cell = header.find_next_sibling('td')

                if header_text and data_cell:
                    new_value = data_cell.text.strip()
                    for keyword, output_key in row_keywords.items():
                        if keyword.lower() == header_text.lower():
                            existing_value = section_data.get(output_key, '')

                            # handling appending for 'Leaf Colour' in particular
                            if output_key == 'Leaf Colour':
                                if existing_value and existing_value != '-':
                                    # Append the new value to the existing value
                                    section_data[output_key] = f"{existing_value}, {new_value}"
                                    logging.info(f"Appended '{new_value}' to existing 'Leaf Colour' value.")
                                else:
                                    # Set the value directly if it's empty or default
                                    section_data[output_key] = new_value
                                    logging.info(f"Set 'Leaf Colour' to '{new_value}'.")
                            elif not existing_value or existing_value == '-':
                                # Only set if empty or default value
                                section_data[output_key] = new_value
                                logging.info(f"Set '{output_key}' to '{new_value}'.")
                            break
    

    def scrape_section_by_h3(self, soup: BeautifulSoup, section_id: str, row_keywords: dict, default_values: dict = None) -> dict:
        """
        general function to scrape a section identified by an h3 heading.
        looks for keywords in row headers and extracts data.

        this function looks for a section in the HTML with a given h3 heading (identified by the section_id). 
        it finds tables within the section, scans them for rows whose headers match keywords from `row_keywords`, 
        and extracts corresponding data into a dictionary. 
        
        optionally, it applies default values for any missing data.
        
        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the page
            section_id (str): HTML id of the h3 section to scrape
            row_keywords (dict): dictionary mapping row header keywords to output data keys
            default_values (dict): optional dictionary of default values for missing data
        """
        section_data = {}
        section_heading = soup.find('h3', id=section_id)

        if section_heading:
            first_table_div = section_heading.find_next('div', class_='rte')
            if first_table_div:
                # extract data from both tables (seperate by the the 'Show More' button)
                table = first_table_div.find('table', {'aria-label': 'descflora'})
                table_show = first_table_div.find('table', {'aria-label': 'descfloraShow'})
                
                # extract data using the helper function
                if table:
                    self.update_section_data(section_data, table, row_keywords)
                if table_show:
                    self.update_section_data(section_data, table_show, row_keywords)

        else:
            logging.warning(f"Section with id '{section_id}' not found.")

        # apply default values if provided and missing data
        if default_values:
            for key, default_value in default_values.items():
                section_data.setdefault(key, default_value)
                logging.info(f"Applied default value '{default_value}' for missing '{key}'.")
        
        return section_data

    
    def classifications_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes Classifications and Characteristics section of the plant data to extract the maximum height and sets a flag indicating whether the maximum height was found.

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.
        
        returns:
            dict: dictionary containing the extracted data for the classifications section.
    
        '''
        row_keywords = {
            'maximum height': 'Maximum Height'
        }
        default_values = {'Maximum Height': '-'}

        section_data = self.scrape_section_by_h3(soup, 'classifications', row_keywords, default_values)

        if section_data['Maximum Height'] != '-':
            self.found_max_height = True
            logging.info(f"Maximum height found: {section_data['Maximum Height']}")
        
        return section_data

    def floral_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes Floral (Angiosperm) section of the plant data to extract flower color information and sets a flag indicating whether the flower color was found.

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.

        returns:
            dict: A dictionary containing the extracted data for the floral section.
         
        '''
        row_keywords = {
            'flower colour(s)': 'Flower Colour'
        }
        default_values = {'Flower Colour': '-'}

        section_data = self.scrape_section_by_h3(soup, 'floral', row_keywords, default_values)

        if section_data['Flower Colour'] != '-':
            self.found_flower_color = True
            logging.info(f"Flower color found: {section_data['Flower Colour']}" )
        
        return section_data

    def foliar_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes the Foliar section of the plant data to extract leaf color and leaf area index (LIA).
            - retrieves the mature foliage color, prominent young flush colour(s) and leaf area index from the foliar section.
            - mature foliage color and prominent young flush colour(s) are both saved in Leaf Colour

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.

        returns:
            dict: dictionary containing the extracted data for the foliar section.
        '''
        row_keywords = {
            'mature foliage colour(s)': 'Leaf Colour',
            'prominent young flush colour(s)': 'Leaf Colour',  # appends to existing Leaf Colour
            'leaf area index (lai) for green plot ratio': 'Leaf Area Index'
        }
        default_values = {
            'Leaf Colour': '-',
            'Leaf Area Index': '-'
        }
        
        section_data = self.scrape_section_by_h3(soup, 'foliar', row_keywords, default_values)

        logging.info(f"Foliar data extracted:{section_data}" )
    
        return section_data
    
    def plantcare_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes Plant Care and Propagation section of the plant data to extract growth rate information.

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.

        returns:
            dict: dictionary containing the extracted data for the plant care section.
        '''
        row_keywords = {
            'plant growth rate': 'Growth rate'
        }
        default_values = {'Growth rate': '-'}
        
        section_data = self.scrape_section_by_h3(soup, 'plant', row_keywords, default_values)

        logging.info(f"Plant care data extracted:{section_data}")

        return section_data
    
    def landscape_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes the Landscaping Features section of the plant data to extract hazard information.

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.

        returns:
            dict: A dictionary containing the extracted data for the landscape section.
        '''
        row_keywords = {
            'usage hazard - cons': 'Hazard'
        }
        default_values = {'Hazard': '-'}
        
        section_data = self.scrape_section_by_h3(soup, 'landscaping', row_keywords, default_values)

        logging.info(f"Landscape data extracted: {section_data}")

        return section_data

    def fauna_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes the Fauna section of the plant data to extract attracted animals information under 'fauna pollination dispersal associated fauna' from the fauna section.

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.

        returns:
            dict: dictionary containing the extracted data for the fauna section.

        '''
        row_keywords = {
            'fauna pollination dispersal associated fauna': 'Attracted animals'
        }
        default_values = {'Attracted animals': '-'}
        
        section_data = self.scrape_section_by_h3(soup, 'fauna', row_keywords, default_values)

        logging.info(f"Fauna data extracted: {section_data}")

        return section_data

    def biogeography_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes the Biogeography section of the plant data to extract native habitat information.

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.

        returns:
            dict: A dictionary containing the extracted data for the biogeography section.

        '''
        row_keywords = {
            'native habitat': 'Native habitat'
        }
        default_values = {'Native habitat': '-'}
        
        section_data = self.scrape_section_by_h3(soup, 'biogeography', row_keywords, default_values)

        logging.info(f"Biogeography data extracted: {section_data}")

        return section_data

    def nonfoliar_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes the Non - Foliar and Storage section of the plant data to extract trunk texture (from mature bark texture) and trunk color (from bark color).
        it also sets flags indicating whether the bark texture or color was found.

        parameters:
            soup (BeautifulSoup): BeautifulSoup object of the HTML content to scrape.

        returns:
            dict: dictionary containing the extracted data for the non-foliar section.
        '''
        row_keywords = {
            'mature bark texture': 'Trunk Texture',
            'bark colour(s)': 'Trunk Colour'
        }
        default_values = {
            'Trunk Texture': '-' if self.is_tree else 'None',
            'Trunk Colour': '-' if self.is_tree else 'None'
        }
        
        section_data = self.scrape_section_by_h3(soup, 'non', row_keywords, default_values)

        # setting flags
        if section_data['Trunk Texture'] != '-':
            self.found_mature_bark_texture = True
            logging.info(f"Mature bark texture found: {section_data['Trunk Texture']}")
        if section_data['Trunk Colour'] != '-':
            self.found_bark_colour = True
            logging.info(f"Bark Colour found: {section_data['Trunk Colour']}")

        return section_data

    def description_section(self, soup: BeautifulSoup) -> dict:
        '''
        scrapes data from the Description and Ethnobotany section of a plant species page, denoted by h3 header.

        This function extracts various attributes:
        - If max height is not found, use growth form
        - If foliage is not found, use others - plant morphology
        - If mature bark texture and bark colour not found from non-foliar section, check trunk; if trunk is empty, check growth form 

        parameters:
            soup (BeautifulSoup): A BeautifulSoup object representing the parsed HTML of the species page.
            plant_type (str): The type of the plant (e.g., shrub, tree) for applying specific logic.

        returns:
            dict: dictionary containing the scraped attributes from the description section.
                The dictionary includes:
                - 'Trunk Colour': color of the trunk or '-' if not found.
                - 'Trunk Texture': texture of the trunk or '-' if not found.
                - 'Maximum Height': maximum height of the plant or '-' if not found.
                - 'Flower Colour': color of the flower or '-' if not found.
                - 'Leaf Texture': texture of the leaves or '-' if not found, depending on plant type.
        '''
        section_data = {}
        classifications_heading = soup.find('h3', id='foliar')

        if classifications_heading:
            first_table_div = classifications_heading.find_next('div', class_='rte')
            if first_table_div:
                # extract data from both tables
                table = first_table_div.find('table', {'aria-label': 'descflora'})
                table_show = first_table_div.find('table', {'aria-label': 'descfloraShow'})

                # function to check attributes in a table
                def extract_classification_data(table):
                    for row in table.find_all('tr'):
                        header = row.find('th') or row.find('td')
                        if header:
                            header_text = header.find('strong').text.strip() if header.find('strong') else None
                            data_cell = header.find_next_sibling('td')
                            if header_text:
                                
                                if 'trunk' in header_text.lower() and self.found_bark_colour == False:
                                    trunk_bark_colour = data_cell.text.strip() if data_cell else ''
                                    section_data['Trunk Colour'] = trunk_bark_colour
                                    self.found_bark_colour = True
                                    logging.info("Trunk Colour found")

                                if 'trunk' in header_text.lower() and self.found_mature_bark_texture == False:
                                    trunk_bark_texture = data_cell.text.strip() if data_cell else ''
                                    section_data['Trunk Texture'] = trunk_bark_texture
                                    self.found_mature_bark_texture = True
                                    logging.info("Trunk Texture found")

                                if 'growth form' in header_text.lower() and self.found_max_height==False:
                                    growth_form_max_height = data_cell.text.strip() if data_cell else ''
                                    section_data['Maximum Height'] = growth_form_max_height
                                    self.found_max_height == True
                                    logging.info("Maximum Height")

                                if 'growth form' in header_text.lower() and self.found_bark_colour == False:
                                    growth_form_bark_colour = data_cell.text.strip() if data_cell else ''
                                    section_data['Trunk Colour'] = growth_form_bark_colour
                                    self.found_bark_colour = True
                                    logging.info("Trunk Colour found")

                                if 'growth form' in header_text.lower() and self.found_mature_bark_texture == False:
                                    growth_form_bark_texture = data_cell.text.strip() if data_cell else ''
                                    section_data['Trunk Texture'] = growth_form_bark_texture
                                    self.found_mature_bark_texture = True
                                    logging.info("Trunk Texture found")

                                if 'flowers' in header_text.lower() and self.found_flower_color == False:
                                    flower_colour = data_cell.text.strip() if data_cell else ''
                                    section_data['Flower Colour'] = flower_colour
                                    self.found_flower_color = True
                                    logging.info("Flower Colour found")

                                if 'foliage' in header_text.lower():
                                    foliage_colour = data_cell.text.strip() if data_cell else ''
                                    section_data['Leaf Texture'] = foliage_colour
                                    self.found_foliage = True
                                    logging.info("Leaf Texture found")

                                if 'others - plant morphology' in header_text.lower() and  self.found_foliage == False:
                                    plant_morphology = data_cell.text.strip() if data_cell else ''
                                    section_data['Leaf Texture'] = plant_morphology
                                    self.found_foliage = True
                                    logging.info("Leaf Texture found")

                if table:
                    extract_classification_data(table)
                if table_show:
                    extract_classification_data(table_show)

        if 'Flower Colour' not in section_data and self.found_flower_color == False:
            section_data['Flower Colour'] = '-'
         
        if 'Maximum Height' not in section_data and self.found_max_height == False:
            section_data['Maximum Height'] = '-'

        if self.found_foliage == 'False':
            section_data['Leaf Texture'] = '-' if self.is_shrub else 'None'
    
        if self.found_mature_bark_texture == 'False':
            section_data['Trunk Texture'] = '-' if self.is_tree else 'None',

        if self.found_bark_colour == 'False':
            section_data['Trunk Colour'] = '-' if self.is_tree else 'None',
 
        return section_data

    def fetch_additional_data(self, link: str) -> dict:
        '''
        retrieves various attributes related to the species from the specified page and combines them into a single dictionary.
        also attempts to handle duplicates in keys just in case.

        parameters:
            link (str): link to the species page.

        returns:
            dict: Dictionary containing additional species attributes, or None if an error occurred.
    
        example:
            >>> fetch_additional_data("http://example.com/species_page")
            {'Flower Colour': 'Red', 'Maximum Height': '2m', ...}
        '''

        try:
            response = requests.get(link)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            plant_type_data = self.get_plant_type(soup)
            icon_data = self.scrape_icons(soup)
            classification_data = self.classifications_section(soup)
            floral_data = self.floral_section(soup)
            landscape_data = self.landscape_section(soup)
            fauna_data = self.fauna_section(soup)
            biogeography_data = self.biogeography_section(soup)
            foliar_data = self.foliar_section(soup)
            plantcare_data = self.plantcare_section(soup)
            nonfoliar_data = self.nonfoliar_section(soup)
            description_data = self.description_section(soup)

            # use defaultdict to merge while handling duplicates
            merged_data = defaultdict(list)

            for section in [plant_type_data, icon_data, classification_data,
                            floral_data, landscape_data, fauna_data,
                            biogeography_data, foliar_data, plantcare_data,
                            nonfoliar_data, description_data]:
                for key, value in section.items():
                    merged_data[key].append(value)

            # Convert lists to a single value or keep them as lists based on your requirement
            final_data = {key: value[0] if len(value) == 1 else value for key, value in merged_data.items()}

            # Log the final merged data
            logging.debug(f"Merged data: {final_data}")

            return final_data

        except (requests.RequestException, AttributeError) as e:
            logging.error(f"Error fetching data from {link}: {e}")
            return None

    def update_species_data(self, species_row: dict, additional_data: dict) -> dict:
        '''
        update the species row with additional data.

        parameters:
            species_row (dict): row of species data from the CSV.
            additional_data (dict): additional data to be appended.

        returns:
            dict: updated species row with additional information.

        example:
            >>> species_row = {'Scientific Name': 'Rosa rubiginosa'}
            >>> additional_data = {'Flower Color': 'Pink'}
            >>> update_species_data(species_row, additional_data)
            {'Scientific Name': 'Rosa rubiginosa', 'Flower Color': 'Pink'}

        '''
        species_row.update(additional_data)
        logging.info(f"Updated species row: {species_row['Scientific Name']} with additional data.")
        return species_row
    
    def write_row_to_csv(self, updated_row: dict, mode: str = 'a') -> None:
        '''
        write a single updated row to the CSV file.
        it appends or writes a new row to the specified CSV file, creating a new file header if the file is empty and the mode is set to write.

        parameters:
            updated_row (dict): Updated species row to be written.
            mode (str): The file open mode, either 'a' for append or 'w' for write. Defaults to 'a'.
        '''
        try:
            with open(CSV_UPDATED_FILE_PATH, mode=mode, newline='', encoding='utf-8') as csvfile:
                fieldnames = list(updated_row.keys())
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                # write header only if the file is empty or in 'w' mode
                if csvfile.tell() == 0 and mode == 'w':
                    writer.writeheader()
                writer.writerow(updated_row)
                logging.info(f"Wrote updated row for species: {updated_row['Scientific Name']} to CSV.")

        except IOError as e:
            logging.error(f"Error writing to CSV file: {e}")


    def scrape(self) -> None:
        '''
        main function to read CSV, scrape additional data, and write directly to CSV.
        '''
        try:
            species_generator = self.read_csv()
            if self.end_row is None:
                self.end_row = sum(1 for _ in self.read_csv())  # calculate total rows if end_row not provided

            for index, species_row in enumerate(species_generator):
                if index < self.start_row:
                    continue  # skip rows before start_row
                if index >= self.end_row:
                    break  # stop after end_row

                link = species_row['Link']
                if not link:
                    logging.warning(f"Species {species_row['Scientific Name']} has no link, skipping.")
                    continue

                logging.info(f"Fetching additional data for species: {species_row['Scientific Name']}")
                additional_data = self.fetch_additional_data(link)

                if additional_data:
                    updated_row = {**species_row, **additional_data}  # update species row with additional data
                    mode = 'w' if index == self.start_row else 'a'  # Write header only for the first row
                    self.write_row_to_csv(updated_row, mode)
                    logging.info(f"Completed web scrap for {species_row['Species ID']}")

            logging.info(f"Web Flora data scraping complete.")
            logging.info(f"Total rows written to CSV: {index + 1}")

        except Exception as e:
            logging.error(f"Error during scraping process: {e}")

    
if __name__ == '__main__':
    '''example for how to call as a segment of csv'''
    scraper = WebScrap(start_row = 0, end_row = 4)

    '''example for how to call entire csv'''
    # scraper = WebScrap()
    scraper.scrape()
