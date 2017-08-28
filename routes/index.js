'use strict';

const express   = require('express');
const router    = express.Router();

const moment    = require('moment');
const fs        = require('fs');
const co        = require('co');

const db        = require('./db');

const dotenv    = require('dotenv');
dotenv.load();
const node_env  = process.env.NODE_ENV;

router.get('/setup', function(req, res, next) {
	if ('production' == process.env.NODE_ENV) {
		res.redirect(302, './');
	} else {
		co(function* () {
			yield db.init();
			const data = yield db.setup();
			yield db.fin();

			res.render('index', {
				title : '型式試験の実施状況（初期設定）',
				update: moment(data[0][0].update).format('YYYY年MM月DD日 HH時mm分'),
				list  : data[1],
				id    : [],
			});
		})
		.catch(console.error);
	}
});

router.use(function(req, res, next) {
	co(function* () {
		yield db.init();
		let data = null;
		let title = null;
		if(yield db.isUpdate()) {
			data = yield db.update();
			title = '型式試験の実施状況（更新）';
		} else {
			data = yield db.setup();
			title = '型式試験の実施状況（初期設定）';
		}
		yield db.fin();

		req.html = {};
		req.html.title = title;
		req.html.update= moment(data[0][0].update).format('YYYY年MM月DD日 HH時mm分');
		req.html.list  = data[1];
		next();
	})
	.catch(console.error);
});

/* GET home page. */
router.get('/', function(req, res, next) {
	const query_id = (req.query.id?req.query.id.split(','):[]);

	if (req.query.format &&
			'json' === req.query.format.toLowerCase()) {
		res.header('Content-Type', 'application/json; charset=utf-8');
		let jsonData = [];
		if (!req.query.id) {
			//全件
			jsonData.push(req.html.list);
		} else {

			//複数件
			if (query_id.length > 0) {
				for (let item of req.html.list) {
					let _id = '000000' + String(item.id);
					_id = _id.substring(_id.length - 6);
					if (query_id.indexOf(_id) >= 0) {
						jsonData.push(item);
					}
				}
			}
		}
		res.json({ list:jsonData });
	} else {
		res.render('index', {
			title : req.html.title,
			update: req.html.update,
			list  : req.html.list,
			id    : query_id,
		});
	}
});

router.get('/check', function(req, res, next) {
	res.render('check', {});
});
router.post('/check', function(req, res, next) {
	let list = req.html.list;
	let data = {};
	let ret = [];
	try {
		data = JSON.parse(req.body.checkData);
		data = (data.list?data.list:[]);

		while(data.length > 0) {
			let chkItem = data.shift();
			if ((chkItem.id && chkItem.id == 0) ||!chkItem.id || !chkItem.guess ||
					!chkItem.test || chkItem.test.length != 3) {
				// チェック用データの形式が正しくない（廃棄）
				console.error('Error format:', JSON.stringify(chkItem, null, 2));
				continue;
			}

			for (let i = 0; i < list.length; i++) {
				let dbItem = list[i];

				if (chkItem.id == dbItem.id) {
					// チェック対象がDBに存在する
					// ->DBから削除
					list.splice(i, 1);
					if (chkItem.guess == dbItem.guess &&
							chkItem.test[0].status == dbItem.test[0].status &&
							chkItem.test[1].status == dbItem.test[1].status &&
							chkItem.test[2].status == dbItem.test[2].status) {
						// 一致（無色）
						dbItem.check = 1;
						chkItem.check = 1;
					} else {
						// 不一致（赤）
						dbItem.check = 2;
						chkItem.check = 2;
					}
					ret.push(dbItem);
					break;
				}
			}
			//DBには存在しなかった（緑:DBに存在せず、チェックデータに存在）
			if (!chkItem.check) {
				chkItem.check = 3;
				ret.push(chkItem);
			}
		}

		// listに残ったデータ（青:DBに存在、チェックデータに存在せず）
		while(list.length > 0) {
			let dbItem = list.shift();
			dbItem.check = 4;
			ret.push(dbItem);
		}

		res.render('checkresult', {title:'チェック結果', list:ret});
	} catch (err) {
		res.render('check', {data:req.body.checkData, error:err});
	}
});

module.exports = router;
