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

/* GET home page. */
router.get('/', function(req, res, next) {
	co(function* () {
		yield db.init();
		let data = null;
		if(yield db.isUpdate()) {
			data = db.update();
		} else {
			data = db.setup();
		}
		yield db.fin();
		res.render('index', {
			update: moment(data[0][0].update).format('YYYY年MM月DD日 HH時mm分'),
			list: data[1],
		});
	})
	.catch(console.error);
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
