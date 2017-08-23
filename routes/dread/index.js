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
	if ('production' === node_env) {
		res.redirect(302, './index');
		return;
	}
	res.render('check', {});
});
router.post('/check', function(req, res, next) {
	if ('production' === node_env) {
		res.redirect(302, './index');
		return;
	}
	let data = {};
	try {
		data = JSON.parse(req.body.checkData);
	} catch (err) {
		res.render('check', {data:req.body.checkData, error:err});
	}
	res.render('check', {data:req.body.checkData});
});

module.exports = router;
