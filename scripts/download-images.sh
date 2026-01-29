#!/usr/bin/env bash
set -e
mkdir -p assets/images
# Unsplash Source API: fetch high-resolution images by query
curl -L "https://source.unsplash.com/1600x1000/?food,restaurant" -o assets/images/hero.jpg
curl -L "https://source.unsplash.com/1200x800/?dish,meal" -o assets/images/dish.jpg
curl -L "https://source.unsplash.com/1200x800/?restaurant,interior" -o assets/images/interior.jpg

echo "Downloaded images to assets/images/"
