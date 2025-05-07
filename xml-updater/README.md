
# How to use:

- take the export.xml
- use the create-multiple-export.sh to generate xml files per language
- execute the docker container to update the <content:encoded>

```
docker build -t xml-updater .
docker run -v $(pwd):/app xml-updater
# expects 
# execution takes about 10 minutes per xml file (2443 items)
```

The docker container takes the xml file, loops over all entries and updates title and content from the real website.