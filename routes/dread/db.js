'use strict';

const co     = require('co');
const moment = require('moment');

const mongodb= require('mongodb');
const client = mongodb.MongoClient;

const dotenv = require('dotenv');
dotenv.load();
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
		const docs = _conn.collection(mongo_working).find().toArray();
		return docs;
	}),

	setup: co.wrap(function* (list) {
		const now = moment();

		// id==0(更新日時)が存在しないときだけ初期データを投入する
		const flagData = yield _conn.collection(mongo_working).find({ 'id':0 }).toArray();
		if (!flagData[0]) {
			yield _conn.collection(mongo_working).remove({});
			yield _conn.collection(mongo_working).insertMany(list);
			yield _conn.collection(mongo_working).insertOne({
				id    : 0,
				update: Number(now),
			});
		}
		return yield[
			_conn.collection(mongo_working).find({ 'id':0 }).toArray(),
			_conn.collection(mongo_working).find({ 'id':{$gt:0} }).toArray(),
		];
	}),

	update: co.wrap(function* () {
	}),
	updateAll: co.wrap(function* () {
	}),
};

