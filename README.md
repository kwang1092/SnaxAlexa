# SnaxAlexa
Allows users to add pets and food items to a DynamoDB database through Alexa and allows them to log the food items and calorie counts for their pets.

Have to set up 2 tables in DynamoDB beforehand - one table labelled "SnaxTrax" one labelled "FoodTrax" - The Keys are "Name" and "FoodName" respectively. The secondary keys are "UserId" for both. Once done, you prompt Alexa via "Alexa open SnaxTrax". The possible commands that follow are: "add a pet" (or some variety of this), "add a food" (or some variety of this), "feed pet" (or some variety (ie. give meal)), and "log {food item}" (where the food item is a corresponding food item in the database). You can observe changes within the DynamoDB database. 
