#!/bin/bash

echo "I create the other export files..."

sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/en/docs|' ./export-de.xml > export-en.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/fr/docs|' ./export-de.xml > export-fr.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/es/docs|' ./export-de.xml > export-es.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/pt/docs|' ./export-de.xml > export-pt.xml
sed 's|<link>https://seatable.io/docs|<link>https://seatable.io/ru/docs|' ./export-de.xml > export-ru.xml
