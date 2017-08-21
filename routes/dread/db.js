'use strict';

const co     = require('co');
const moment = require('moment');
const pdf    = require('./pdf');

const mongodb= require('mongodb');
const client = mongodb.MongoClient;

const dotenv = require('dotenv');
dotenv.load();
const node_env      = process.env.NODE_ENV;
const mongo_url     = process.env.MONGO_URL;
const mongo_working = process.env.MONGO_COLLECTION_WORKING;
const mongo_finished= process.env.MONGO_COLLECTION_FINISHED;

let _conn = null;
module.exports = {

	// create collections
	create: co.wrap(function* () {
		yield [
			_conn.createCollection(mongo_working),
			_conn.createCollection(mongo_finished),
		];
	}),
	// delete a document
	delete: co.wrap(function* () {
	}),
	// disconnect to MongoDB
	fin: co.wrap(function* () {
		yield _conn.close();
		_conn = null;
		return _conn;
	}),
	// connect to MongoDB
	init: co.wrap(function* () {
		_conn = yield client.connect(mongo_url);
		return _conn;
	}),
	// insert a document to MongoDB
	insert: co.wrap(function* (doc) {
		yield _conn.collection(mongo_working).insertOne(doc);
	}),
	// listing data
	list: co.wrap(function* () {
		return yield[
			_conn.collection(mongo_working).find({ 'id':0 }).toArray(),
			_conn.collection(mongo_working).find({ 'id':{$gt:0} }).toArray(),
		];
	}),

	/*
	 * 1 development環境で/setupがGETされた場合
	 * 2 /indexがGETされ、isUpdateの結果がfalseの場合
	 */
	setup: co.wrap(function* () {
		const now = moment();

		// 無条件に全データを削除、初期データを投入する
		yield _conn.collection(mongo_working).remove({});
		yield _conn.collection(mongo_working).insertMany(yield pdf.get(now));
		yield _conn.collection(mongo_working).insertOne({
			id    : 0,
			update: Number(now),
		});

		return yield[
			_conn.collection(mongo_working).find({ 'id':0 }).toArray(),
			_conn.collection(mongo_working).find({ 'id':{$gt:0} }).toArray(),
		];
	}),

	/*
	 * 更新確認用データの存在チェック
	 * true : 更新する
	 * false: 初期設定する
	 */
	isUpdate: co.wrap(function* () {
		const flagData = yield _conn.collection(mongo_working).find({ 'id':0 }).toArray();
		if(flagData[0]) {
			// データ有
			return true;
		}
		// データ無
		return false;
	}),
	/*
	 * 30分(development環境では1秒)間隔でPDFデータを取得し、データベースを更新する
	 */
	update: co.wrap(function* () {
		const now = moment();
		const diff = ('production' === node_env?(1000*60*30):1000);

		const flagData = yield _conn.collection(mongo_working).find({ 'id':0 }).toArray();

		//規定更新時間経過チェック
		if (now - moment(flagData[0].update) > diff) {
			//データ更新
			const pdfData = yield pdf.get(now);
			//pdfデータがDBに存在する場合は更新し、存在しない場合は挿入する
			let data = null;
			for (let item of pdfData) {
				data = yield _conn.collection(mongo_working).find({ 'id':item.id }).toArray();
				if (data[0]) {
					data = yield pdf.update(data[0], item);
				} else {
					data = item;
				}
				yield _conn.collection(mongo_working).update(
						{'id':item.id},
						{$set:data},
						{upsert:true});
			}
			//更新日時を更新
			yield _conn.collection(mongo_working).update(
					{'id':0},
					{$set: {update: Number(now)} },
					{upsert:true});
			//今回更新されなかったデータを削除
			const unupdated = yield _conn.collection(mongo_working).find({ 'update': {'$ne':Number(now)} }).toArray();
			if (unupdated) {
				const date = unupdated[0].update;
				yield _conn.collection(mongo_working).remove({ 'update':date });
			}
		}

		return yield[
			flagData,
			_conn.collection(mongo_working).find({ 'id':{$gt:0} }).toArray(),
		];
	}),
};

