var MongoClient = require("mongodb").MongoClient;

// 接続文字列
var url = "mongodb://localhost:27017/hotsukyo";

// MongoDB へ 接続
MongoClient.connect(url, (error, db) => {
	// 接続メッセージを表示
	console.log("MongoDB へ 接続中...");

	db.createCollection("working");

	// コレクションの取得
	let collection = db.collection("working");

	console.log("collection:");
	collection.find().toArray((error, documents) => {
		for (var document of documents) {
			console.log(document.name, document.price);
		}
	});

	collection.insertOne({
		'id'   : 0,
		'start': null,
		'end'  : null,
	}, (error, result) => {
		if (error)
			console.error("MongoDB エラー", error);

		// MongoDB への 接続 を 切断
		db.close();
	});

});
