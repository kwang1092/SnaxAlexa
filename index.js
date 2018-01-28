const alexaSDK = require('alexa-sdk');
const awsSDK = require('aws-sdk');
const promisify = require('es6-promisify');

const appId = 'amzn1.ask.skill.95710215-8084-4482-89fd-116d23954748';
const petStatsTable = 'SnaxTrax';
const foodStatsTable = 'FoodTrax';
const docClient = new awsSDK.DynamoDB.DocumentClient();

// convert callback style functions to promises
const dbScan = promisify(docClient.scan, docClient);
const dbGet = promisify(docClient.get, docClient);
const dbPut = promisify(docClient.put, docClient);
const dbDelete = promisify(docClient.delete, docClient);
const dbUpdate = promisify(docClient.update, docClient);

const instructions = `Welcome to SnaxTrax<break strength="medium" />
How may I help you?`;
var increasingCalories = 0;
const handlers = {

  /**
  * Triggered when the user says "Alexa, open Recipe Organizer.
  */
  'LaunchRequest'() {
    this.emit(':ask', instructions);
  },

  /**
  * Adds a recipe to the current user's saved recipes.
  * Slots: PetName, Weight, BCS, CalorieGoal
  */


  'AddPet'() {
    const { userId } = this.event.session.user;
    const { slots } = this.event.request.intent;

    // prompt for slot values and request a confirmation for each

    // RecipeName
    if (!slots.PetName.value) {
      const slotToElicit = 'PetName';
      const speechOutput = 'What is the name of the pet?';
      const repromptSpeech = 'Please tell me the name of the pet';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }
    else if (slots.PetName.confirmationStatus !== 'CONFIRMED') {

      if (slots.PetName.confirmationStatus !== 'DENIED') {
        // slot status: unconfirmed
        const slotToConfirm = 'PetName';
        const speechOutput = `The name of the pet is ${slots.PetName.value}, correct?`;
        const repromptSpeech = speechOutput;
        return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
      }

      // slot status: denied -> reprompt for slot data
      const slotToElicit = 'PetName';
      const speechOutput = 'What is the name of the pet you would like to add?';
      const repromptSpeech = 'Please tell me the name of the pet';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // PetWeight
    if (!slots.PetWeight.value) {
      const slotToElicit = 'PetWeight';
      const speechOutput = 'What is their weight?';
      const repromptSpeech = 'Please give me the weight.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }
    else if (slots.PetWeight.confirmationStatus !== 'CONFIRMED') {

      if (slots.PetWeight.confirmationStatus !== 'DENIED') {
        // slot status: unconfirmed
        const slotToConfirm = 'PetWeight';
        const speechOutput = `The weight is ${slots.PetWeight.value}, correct?`;
        const repromptSpeech = speechOutput;
        return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
      }

      // slot status: denied -> reprompt for slot data
      const slotToElicit = 'PetWeight';
      const speechOutput = 'What is their weight?';
      const repromptSpeech = 'Please give me the weight.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // BCS
    if (!slots.Bcs.value) {
      const slotToElicit = 'Bcs';
      const speechOutput = 'What is their BCS?';
      const repromptSpeech = 'What is their BCS?';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }
    else if (slots.Bcs.confirmationStatus !== 'CONFIRMED') {

      if (slots.Bcs.confirmationStatus !== 'DENIED') {
        // slot status: unconfirmed
        const slotToConfirm = 'Bcs';
        const speechOutput = `${slots.Bcs.value} is their BCS, correct?`;
        const repromptSpeech = speechOutput;
        return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
      }

      // slot status: denied -> reprompt for slot data
      const slotToElicit = 'Bcs';
      const speechOutput = 'What is their BCS?';
      const repromptSpeech = 'What is their BCS?';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // CalorieGoal
    if (!slots.CalorieGoal.value) {
      const slotToElicit = 'CalorieGoal';
      const speechOutput = 'What is the calorie goal?';
      const repromptSpeech = 'Please give me the calorie goal.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }
    else if (slots.CalorieGoal.confirmationStatus !== 'CONFIRMED') {

      if (slots.CalorieGoal.confirmationStatus !== 'DENIED') {
        // slot status: unconfirmed
        const slotToConfirm = 'CalorieGoal';
        const speechOutput = `The goal is ${slots.CalorieGoal.value}, correct?`;
        const repromptSpeech = speechOutput;
        return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
      }

      // slot status: denied -> reprompt for slot data
      const slotToElicit = 'CalorieGoal';
      const speechOutput = 'What is the calorie goal?';
      const repromptSpeech = 'Please give me the calorie goal.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // all slot values received and confirmed, now add the record to DynamoDB

    const name = slots.PetName.value;
    const weight = slots.PetWeight.value;
    const petBCS = slots.Bcs.value;
    const calorieGoal = slots.CalorieGoal.value;
    const dynamoParams = {
      TableName: 'SnaxTrax',
      Item: {
        Name: name,
        UserId: userId,
        Weight: weight,
        Bcs: petBCS,
        CurrentCalories: 0,
        CalorieGoal: calorieGoal
      }
    };

    const checkIfPetExistsParams = {
      TableName: 'SnaxTrax',
      Key: {
        Name: name,
        UserId: userId
      }
    };

    console.log('Attempting to add pet', dynamoParams);

    // query DynamoDB to see if the item exists first
    dbGet(checkIfPetExistsParams)
    .then(data => {
      console.log('Get item succeeded', data);

      const pet = data.Item;

      if (pet) {
        const errorMsg = `Pet ${name} already exists!`;
        this.emit(':tell', errorMsg);
        throw new Error(errorMsg);
      }
      else {
        // no match, add the pet
        return dbPut(dynamoParams);
      }
    })
    .then(data => {
      console.log('Add item succeeded', data);

      this.emit(':tell', `Pet ${name} added!`);
    })
    .catch(err => {
      console.error(err);
    });
  },

  /**
  * Adds a snack to the current user's saved recipes.
  * Slots: FoodName Calories
  */
  'AddFood'() {
    const { userId } = this.event.session.user;
    const { slots } = this.event.request.intent;

    // prompt for slot values and request a confirmation for each

    // FoodName
    if (!slots.FoodName.value) {
      const slotToElicit = 'FoodName';
      const speechOutput = 'What is the name of the food?';
      const repromptSpeech = 'Please tell me the name of the food.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }
    else if (slots.FoodName.confirmationStatus !== 'CONFIRMED') {

      if (slots.FoodName.confirmationStatus !== 'DENIED') {
        // slot status: unconfirmed
        const slotToConfirm = 'FoodName';
        const speechOutput = `The name of the food is ${slots.FoodName.value}, correct?`;
        const repromptSpeech = speechOutput;
        return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
      }

      // slot status: denied -> reprompt for slot data
      const slotToElicit = 'FoodName';
      const speechOutput = 'What is the name of the food you would like to add?';
      const repromptSpeech = 'Please tell me the name of the food.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // Calories
    if (!slots.Calories.value) {
      const slotToElicit = 'Calories';
      const speechOutput = 'How many calories are in one serving?';
      const repromptSpeech = 'Please give me the number of calories.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }
    else if (slots.Calories.confirmationStatus !== 'CONFIRMED') {

      if (slots.Calories.confirmationStatus !== 'DENIED') {
        // slot status: unconfirmed
        const slotToConfirm = 'Calories';
        const speechOutput = `The number of calories in a serving is ${slots.Calories.value}, correct?`;
        const repromptSpeech = speechOutput;
        return this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
      }

      // slot status: denied -> reprompt for slot data
      const slotToElicit = 'Calories';
      const speechOutput = 'How many calories are in one serving?';
      const repromptSpeech = 'Please give me the number of calories.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // all slot values received and confirmed, now add the record to DynamoDB
    const foodName = slots.FoodName.value;
    const calories = slots.Calories.value;
    const dynamoParams = {
      TableName: 'FoodTrax',
      Item: {
        FoodName: foodName,
        UserId: userId,
        Calories: calories
      }
    };

    const checkIfFoodExistsParams = {
      TableName: 'FoodTrax',
      Key: {
        FoodName: foodName,
        UserId: userId,
      }
    };

    console.log('Attempting to add food', dynamoParams);

    // query DynamoDB to see if the item exists first
    dbGet(checkIfFoodExistsParams)
    .then(data => {
      console.log('Get item succeeded', data);

      const food = data.Item;

      if (food) {
        const errorMsg = `Food ${foodName} already exists!`;
        this.emit(':tell', errorMsg);
        throw new Error(errorMsg);
      }
      else {
        // no match, add the snack
        return dbPut(dynamoParams);
      }
    })
    .then(data => {
      console.log('Add item succeeded', data);

      this.emit(':tell', `Food ${foodName} added!`);
    })
    .catch(err => {
      console.error(err);
    });
  },

  'LogFood'(){
    const { userId } = this.event.session.user;
    alexa = this;
    food = alexa.event.request.intent.slots.FoodLogged.value;
    // enterFood(food)
    const dynamoParamsFood = {
      TableName: 'FoodTrax',
      Key: {
        FoodName: food,
        UserId: userId
      }
    };
    dbGet(dynamoParamsFood)
    .then(data => {
      const test = data.Item;
      increasingCalories =  test.Calories;
      console.log(increasingCalories);
    })
      .catch(err => console.error(err));
      const dynamoParamsPet = {
        TableName: 'SnaxTrax',
        Key: {
          Name: 'Clara',
          UserId: userId
        }
      };
      dbGet(dynamoParamsPet)
      .then(data => {
        const pet = data.Item;
        const p = parseInt(increasingCalories);
        const q = parseInt(pet.CurrentCalories);
        const total = p+q;
        const dynamoParams = {
          TableName: 'SnaxTrax',
          Key: {
            Name: 'Clara',
            UserId: userId
          },
          UpdateExpression:   'SET CurrentCalories = :r',
          ExpressionAttributeValues:{
            ":r": total
          }
        }
        console.log('Hellooooo', data);
        return dbUpdate(dynamoParams);
      })
    .then(data => {
      console.log('Food logged!', data);
      // if((total) > parseInt(pet.CalorieGoal)){
      //   this.emit(':tell', 'Food ${foodName} logged!, but your pet has surpassed their limit for the day!');
      // }
      this.emit(':tell', `Food ${food} logged!`);
    })
    .catch(err => console.error(err));
  },



  /**
  * Adds the calories from a snack to your pet's logs
  * Slots: PetName, FoodName
  */
  'FeedSnack'() {
    const { userId } = this.event.session.user;
    const { slots } = this.event.request.intent;

    // prompt for slot values and request a confirmation for each

    // PetName
    if (!slots.PetName.value) {
      const slotToElicit = 'PetName';
      const speechOutput = 'What is the name of the pet?';
      const repromptSpeech = 'Please tell me the name of the pet';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // FoodName
    if (!slots.FoodName.value) {
      const slotToElicit = 'FoodName';
      const speechOutput = 'What is the food?';
      const repromptSpeech = 'Please give me food name.';
      return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
    }

    // all slot values received and confirmed, now add the record to DynamoDB
    const petName = slots.PetName.value;
    const foodName = slots.FoodName.value;
    const dynamoParamsPet = {
      TableName: 'SnaxTrax',
      Key: {
        Name: petName,
        UserId: userId
      }
    };
    const dynamoParamsFood = {
      TableName: 'FoodTrax',
      Key: {
        FoodName: foodName,
        UserId: userId
      }
    };
    //console.log('Attempting to add pet', dynamoParams);


    // query DynamoDB to see if the item exists first
    dbGet(dynamoParamsFood)
    .then(data => {
      console.log('Get item succeeded', data);

      const food = data.Item;
      if(!food){
        this.emit(':tell', `Food ${foodName} not found!`);
      }
      else{
        increasingCalories = food.Calories;
      }
    })
    .catch(err => console.error(err));
    dbGet(dynamoParamsPet)
    .then(data => {
      console.log('Get item succeeded', data);

      const pet = data.Item;
      if(!pet){
        this.emit(':tell', `Pet ${petName} not found!`);
      }
      else{
        const p = parseInt(increasingCalories);
        const q = parseInt(pet.CurrentCalories);
        const total = p+q;
        const dynamoParams = {
          TableName: 'SnaxTrax',
          Key: {
            Name: petName,
            UserId: userId
          },
          UpdateExpression:   'SET CurrentCalories = :r',
          ExpressionAttributeValues:{
            ":r": total
          }
        }
        console.log('Hellooooo', data);
        if((total) > parseInt(pet.CalorieGoal)){
          return dbUpdate(dynamoParams);
          this.emit(':tell', 'Your pet has surpassed their limit for the day!');
        }
        return dbUpdate(dynamoParams);
      }
    })
    .then(data => {
      console.log('Food logged!', data);

      this.emit(':tell', `Food ${foodName} logged!`);
    })
    .catch(err => console.error(err));
  },

  'Unhandled'() {
    console.error('problem', this.event);
    this.emit(':ask', 'An unhandled problem occurred!');
  },

  'AMAZON.HelpIntent'() {
    const speechOutput = instructions;
    const reprompt = instructions;
    this.emit(':ask', speechOutput, reprompt);
  },

  'AMAZON.CancelIntent'() {
    this.emit(':tell', 'Goodbye!');
  },

  'AMAZON.StopIntent'() {
    this.emit(':tell', 'Goodbye!');
  }
};

function enterFood(food){
  params={
    TableName: 'FoodTrax',
    FilterExpression: "FoodName = :f1",
    ExpressionAttributeValues: { ":f1": food}
  };
  dbGet(params)
  .then(function(data){
    console.log(data.Calories);
    return new Promise(function(resolve, reject){
      resolve(data.Calories)
    });
  }).catch(function(err){
    lambdaCallback(err, null);
  })
}

function scanFood(food){
  params={
    TableName: 'FoodTrax',
    FilterExpression: "FoodName = :f1",
    ExpressionAttributeValues: { ":f1": food}
  }
  return dbGet(params);
}

exports.handler = function handler(event, context) {
  const alexa = alexaSDK.handler(event, context);
  alexa.APP_ID = appId;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
