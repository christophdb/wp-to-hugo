#!/bin/bash

echo "I create the other export files..."

sed 's|<link>https://seatable.io/|<link>https://seatable.io/en/|' ./export-de.xml > export-en.xml
sed 's|<link>https://seatable.io/|<link>https://seatable.io/fr/|' ./export-de.xml > export-fr.xml
sed 's|<link>https://seatable.io/|<link>https://seatable.io/es/|' ./export-de.xml > export-es.xml
sed 's|<link>https://seatable.io/|<link>https://seatable.io/pt/|' ./export-de.xml > export-pt.xml
sed 's|<link>https://seatable.io/|<link>https://seatable.io/ru/|' ./export-de.xml > export-ru.xml
