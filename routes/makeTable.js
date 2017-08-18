var AWS = require("aws-sdk");
 
AWS.config.loadFromPath('credentials.json');

var dynamodb = new AWS.DynamoDB();

var params = {
	TableName:"Weekly",
	KeySchema:[
	  { AttributeName: "id", KeyType: "HASH" }
	],
	AttributeDefinitions:[
	  { AttributeName: "id", AttributeType: "N" },
	],
	ProvisionedThroughput:{
		ReadCapacityUnits: 10,
		WriteCapacityUnits: 10
	}
};

dynamodb.createTable(params, function(err, data) {
	if (err) {
		console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
	} else {
		console.error("Created table. Table Description JSON:", JSON.stringify(data, null, 2));
	}
});

