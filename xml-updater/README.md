take the export.xml
use sed to replace the <link> from https://seatable.io/docs/... to https://seatable.io/en/docs/...</li>
execute the docker container to update the content...

```
docker build -t xml-updater .
docker run -v $(pwd):/app xml-updater
```