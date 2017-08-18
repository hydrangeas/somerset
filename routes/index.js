var express = require('express');
var router = express.Router();

var AWS = require("aws-sdk");
AWS.config.loadFromPath('credentials.json');

var params = {
	TableName:"Weekly",
	Key:{
		"id":{"N":"000000"}
	}
};
var dynamodb = new AWS.DynamoDB();

/* GET home page. */
router.get('/', function(req, res, next) {
	dynamodb.getItem(params, function(err, data){
		if(err) {
			//DB系エラーはもう少し細分化する・・
			res.render('error', { error: err });
		} else {
			console.log('json:', JSON.stringify(data, null, 2));
			res.render('index', { title: 'Express' });
		}
	});
});

module.exports = router;
