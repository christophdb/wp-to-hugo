# wp-to-hugo

This project is a fork of [lonekorean/wordpress-export-to-markdown](https://github.com/lonekorean/wordpress-export-to-markdown), extended to support multilingual WordPress exports (weglot) and custom category handling for migrating [seatable.io](https://seatable.io) to [seatable.com](https://seatable.com) using Hugo.

## Project goals

- **Migrate content** from a WordPress site (with Weglot multilanguage and BetterDocs) to a Hugo static site.
- **Automate** the extraction and transformation of multilingual content.
- **Support custom categories** and content structures required by our documentation workflow.

## XML Multilanguage Export

`export.xml` from wordpress only contains the german content of our website. We have build a python docker container that can generate export files for the other languages. This python docker container can be found in the folder `xml-updater`. 

This container loops over the <items> in the export.xml, downloads the html content form the website (in the non-german language) and saves it back to the target export.xml.

The result are multiple export files for the various languages:
- export-de.xml
- export-en.xml
- export-fr.xml
- ...

Then we can use this forked wordpress to markdown software to generate all the required markdown files. Due to some custom html code in our workpress site, we had to extend mainly the `translator.js` to fullfil our needs.

### How to use xml-updater

The process to generate the language specific xml files is easy:

- Get `export.xml` from Wordpress
- Use `create-multiple-export.sh` to generate xml files per language
- execute the docker container to update the <content:encoded>

These are the required commands:

```
docker build -t xml-updater .
docker run -v $(pwd):/app xml-updater
```

Important notes:

- expects `./export.xml` as input.
- generates `./updated-updated.xml`
- execution takes about 10 minutes per xml file (2443 items)

## Markdown generation

As soon as we have the export-xx.xml files, it is easy to generate the markdown files. Use the enhanced Node.js script to convert each language-specific XML file to Markdown.

```bash
node app
```

Follow the questions of the wizard - default values should be ok.
Only the images must be downloaded once.

