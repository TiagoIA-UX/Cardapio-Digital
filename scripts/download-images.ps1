mkdir -Force assets\images
Invoke-WebRequest -Uri "https://source.unsplash.com/1600x1000/?food,restaurant" -OutFile "assets\images\hero.jpg"
Invoke-WebRequest -Uri "https://source.unsplash.com/1200x800/?dish,meal" -OutFile "assets\images\dish.jpg"
Invoke-WebRequest -Uri "https://source.unsplash.com/1200x800/?restaurant,interior" -OutFile "assets\images\interior.jpg"
Write-Output "Downloaded images to assets\images\"