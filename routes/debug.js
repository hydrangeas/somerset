const express = require('express');
const router = express.Router();
const AWS = require("aws-sdk");
AWS.config.loadFromPath('credentials.json');

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();
const async = require("async");
const moment = require('moment');
const request = require('request');
const co = require('co');
const thunkify = require('thunkify');

const PDFParser = require("pdf2json");
const stream = require('stream');
const StringifyStream = require('stringifystream');
const StringDecoder = require('string_decoder').StringDecoder;


/* GET home page. */
router.get('/', function(req, res, next) {
	async.waterfall([

			/*
			 * 1. テーブルをチェックする。
			 */
			function(callback) {
				var params = {
					Limit: 100
				};
				dynamodb.listTables(params, function(err, data) {
					if(err) {
						//DB系エラー
						res.render('Unable to access DynamoDB. Error JSON:', { error: err });
					} else {
						//テーブルの存在チェック
						console.log('json:', JSON.stringify(data, null, 2));
						console.log('TableNames:', JSON.stringify(data.TableNames, null, 2));
						if(data.TableNames.indexOf('Weekly') >= 0) {
							//テーブルが存在する
							callback(null);
						} else {
							//テーブルが存在しない
							var newErr = {
								'status': 'Table is not exist!',
								'stack': {}
							};
							res.render('error', { error: newErr });
						}
					}
				});
			},

			/*
			 * 2. 更新時間をチェックする
			 * 2.1. 前回更新時から30分未満の場合、更新しない
			 * 2.2. 前回更新時から30分以上の場合、更新する
			 * 2.3. 前回更新がない場合、新規作成する
			 */
			function(callback) {
				var params = {
					TableName: 'Weekly',
					Key:{
						"id": 0
					}
				};
				docClient.get(params, function(err, data) {
					if (err) {
						//DB系エラー
						res.render('Unable to read item. Error JSON:', { error: err });
					} else {
						console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
						if(Object.keys(data).length > 0) {
							//データが存在する:更新日時をチェックする
							//.unix():秒
							var _old = moment(data.Item.updateDate).unix();
							var _new = moment().unix();
							console.log("updateDate:", data.Item.updateDate);
							console.log("old date:", _old, ", new date:", _new);

							if ( (_new - _old) < 1 ) {
								//10分未満:更新なし
								callback(null, 0);
							} else {
								//10分以上経過:更新
								callback(null, 1);
							}
						} else {
							//データが存在しない:新規追加
							callback(null, 2);
						}
					}
				});
			},

			/*
			 * 更新日時だけを更新する
			 */
			function(data, callback) {
				var now = moment().format();

				if(data == 0) {
					//更新なし
					callback(null, 1);
					console.log("No Updated.");
				} else if(data == 1) {
					//更新
					var params = {
						TableName: 'Weekly',
						Key:{
							"id": 0
						},
						UpdateExpression: "set updateDate = :d",
						ExpressionAttributeValues:{
							":d":now
						},
						ReturnValues:"UPDATED_NEW"
					};
					console.log(params);

					docClient.update(params, function(err, data) {
						if(err) {
							//DB系エラー
							console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
							res.render('Unable to access DynamoDB. Error JSON:', { error: err });
						} else {
							console.log("Updated Item succeeded:", JSON.stringify(data, null, 2));
							callback(null, 0);
						}
					});
				} else {
					//新規追加
					var params = {
						TableName: 'Weekly',
						Item:{
							"id": 0,
							"updateDate":now
						},
					};
					console.log(params);

					docClient.put(params, function(err, data) {
						console.log("Put Item succeeded:", JSON.stringify(data, null, 2));
						callback(null, 0);
					});
				}
			},

			/*
			 * * PDF取得→解析→格納→次へ
			 * or 
			 * * DBからデータ取得→次へ
			 */
			function(data, callback) {
				if(data == 0) {
					// Webから取得

					var th_request = thunkify(request);
					var parser = new PDFParser();
					co(function* () {
						console.log("-----------------------------0");
						var options = {
							url: 'http://www.hotsukyo.or.jp/pdf/weekly.pdf',
							method: 'GET',
							encoding: null
						};
						var result = yield th_request(options);
						console.log("result1:", result[0].body);
						console.log("result2:", new Buffer(result[0].body));
						console.log("-----------------------------");

						//console.log("result3:",JSON.stringify(parser));
						parser.parsePDFData(result[0].body);
						//console.log(parsed);
						//console.log("result4:",JSON.stringify(parser));
						console.log("result4:",parser.getRawTextContent());
					}).catch(console.error);
					//process.on('unhandledRejection', console.dir);

					callback(null, {});
				} else {
					// DBから取得
					callback(null, {});
				}
			},

			function(data, callback) {
				//データ表示
				res.render('debug', {
					listTables: {},
					describeTable: {}
				});
			}
	], function(err, result) {
	});
});

module.exports = router;
