from lxml import etree as ET
from lxml.etree import QName
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

def get_web_content(url):
    try:
        logger.info(f"Fetching: {url}")
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.string.strip() if soup.title else None
        content_div = soup.find('div', {
            'id': 'betterdocs-single-content',
            'class': 'betterdocs-content'
        })
        content = str(content_div) if content_div else None
        return title, content
    except Exception as e:
        logger.warning(f"Error fetching {url}: {str(e)}")
        return None, None

def update_xml_content(xml_file, output_file):
    logger.info(f"Processing '{xml_file}' -> '{output_file}'")
    parser = ET.XMLParser(remove_blank_text=True)
    try:
        tree = ET.parse(xml_file, parser)
    except Exception as e:
        logger.error(f"Failed to parse {xml_file}: {e}")
        return
    root = tree.getroot()
    
    nsmap = root.nsmap
    content_ns = nsmap.get('content', 'http://purl.org/rss/1.0/modules/content/')

    items = root.xpath('.//item')
    logger.info(f"Found {len(items)} items in '{xml_file}'.")

    for idx, item in enumerate(items, start=1):
        link_elem = item.find('link')
        if link_elem is None or not link_elem.text:
            logger.info(f"Item {idx}: No <link> found, skipping.")
            continue

        # Get new content from web
        title, content = get_web_content(link_elem.text)

        # Only update if content is not empty
        if content and content.strip():
            # Backup original content:encoded
            content_encoded = item.find(f'{{{content_ns}}}encoded')
            if content_encoded is not None:
                backup_elem = ET.Element(QName(content_ns, 'encoded-backup'))
                backup_elem.text = content_encoded.text
                item.append(backup_elem)
            else:
                logger.info(f"Item {idx}: No <content:encoded> to backup.")

            # Update title with CDATA
            if title:
                title_elem = item.find('title')
                cdata_title = ET.CDATA(title)
                if title_elem is not None:
                    title_elem.text = cdata_title
                else:
                    new_title = ET.Element('title')
                    new_title.text = cdata_title
                    item.append(new_title)

            # Update content:encoded with new content
            content_elem = item.find(f'{{{content_ns}}}encoded')
            if content_elem is None:
                content_elem = ET.Element(QName(content_ns, 'encoded'))
                item.append(content_elem)
            content_elem.text = ET.CDATA(content)

            logger.info(f"Item {idx}: Updated title and content.")
        else:
            logger.info(f"Item {idx}: No new content found. Item left unchanged.")

    tree.write(output_file, encoding='utf-8', xml_declaration=True, pretty_print=True)
    logger.info(f"Finished writing '{output_file}'.")

if __name__ == "__main__":
    files = [
        ('export.xml', 'updated-updated.xml'),
    ]

    for input_file, output_file in files:
        if Path(input_file).is_file():
            update_xml_content(input_file, output_file)
        else:
            logger.warning(f"File '{input_file}' does not exist, skipping.")
