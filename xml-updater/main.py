from lxml import etree as ET
from lxml.etree import QName
import requests
from bs4 import BeautifulSoup

def get_web_content(url):
    try:
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
        print(f"Error fetching {url}: {str(e)}")
        return None, None

def update_xml_content(xml_file, output_file):
    parser = ET.XMLParser(remove_blank_text=True)
    tree = ET.parse(xml_file, parser)
    root = tree.getroot()
    
    # Get namespace information
    nsmap = root.nsmap
    content_ns = nsmap.get('content', 'http://purl.org/rss/1.0/modules/content/')

    for item in root.xpath('.//item'):
        link_elem = item.find('link')
        if link_elem is None or not link_elem.text:
            continue

        # Backup original content:encoded
        content_encoded = item.find(f'{{{content_ns}}}encoded')
        if content_encoded is not None:
            # Create content-backup:encoded element
            backup_elem = ET.Element(QName(content_ns, 'encoded'), nsmap={'content-backup': content_ns})
            backup_elem.text = content_encoded.text
            backup_elem.tag = QName(content_ns, 'encoded-backup')  # Change element name
            item.append(backup_elem)

        # Get new content from web
        title, content = get_web_content(link_elem.text)

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
        if content:
            content_elem = item.find(f'{{{content_ns}}}encoded')
            if content_elem is None:
                content_elem = ET.Element(QName(content_ns, 'encoded'))
                item.append(content_elem)
            content_elem.text = ET.CDATA(content)

    # Save modified XML
    tree.write(output_file, encoding='utf-8', xml_declaration=True, pretty_print=True)

if __name__ == "__main__":
    update_xml_content('export.xml', 'updated_export.xml')