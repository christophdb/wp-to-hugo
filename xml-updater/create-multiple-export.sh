#!/bin/bash

echo "I create the other export files..."

sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/en/docs|' ./export.xml > export-en.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/fr/docs|' ./export.xml > export-fr.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/es/docs|' ./export.xml > export-es.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/pt/docs|' ./export.xml > export-pt.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/ru/docs|' ./export.xml > export-ru.xml
