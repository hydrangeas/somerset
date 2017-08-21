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
router.get('/:id(\\d{6})/', function(req, res, next) {
	co(function* () {
		yield db.init();
		const data = yield db.findOne(req.params.id);
		yield db.fin();
		console.log(data);

		res.render('index', {
			title : req.html.title,
			update: moment(data[0][0].update).format('YYYY年MM月DD日 HH時mm分'),
			list  : data[1],
		});
	})
	.catch(console.error);
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title : req.html.title,
		update: req.html.update,
		list  : req.html.list,
	});
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
