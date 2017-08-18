'use strict';

const express   = require('express');
const router    = express.Router();

const moment    = require('moment');
const fs        = require('fs');
const co        = require('co');
const thunkify  = require('thunkify');
const pdf2table = require('pdf2table');

const request   = thunkify(require('request'));
fs._writeFile   = thunkify(fs.writeFile);
fs._readFile    = thunkify(fs.readFile);
pdf2table._parse= thunkify(pdf2table.parse);

const db        = require('./db');
const pdf       = require('./pdf');

/* GET home page. */
router.get('/', function(req, res, next) {

	co(function *() {
		/*
		 * Get weekly.pdf
		 */
		let response = yield request({
			url:       'http://www.hotsukyo.or.jp/pdf/weekly.pdf',
			method:    'GET',
			encoding:  null
		});
		if (response[0].statusCode != 200) {
			throw new Error('[http] status code:', response[0].statusCode);
		}

		// Get PDF Data Binary
		const pdf = response[0].body;
		/*
		 * Save weekly.pdf
		 */
		const savePath = './tmp/weekly.pdf';
		response = yield fs._writeFile(savePath, pdf, 'binary');

		// Load weekly.pdf
		response = yield fs._readFile(savePath);
		response = yield pdf2table._parse(response);
		const working_list = response[0];

		yield db.init();
		yield db.create();
		working_list.forEach(function(e, i, a) {
			if (e.length != 7 && e.length != 1) {
				db.insert(
						{
							'id'   : e[0],
							'start': null,
							'end'  : null,
							'dTest': {
								'status': 0,
								'start' : null,
								'end'   : null
							},
							'cTest': {
								'status': 0,
								'start' : null,
								'end'   : null
							},
							'pTest': {
								'status': 0,
								'start' : null,
								'end'   : null
							},
						}
				);
			}
		});
		yield db.fin();

		res.render('index', {title: 'Express'});
	})
	.catch(console.error);

});

router.get('/list', function(req, res, next) {
	co(function* () {
		yield db.init();

		console.log('--list');
		console.log(yield db.list());

		yield db.fin();
		res.render('index', {title: 'Express'});
	})
	.catch(console.error);
});

router.get('/setup', function(req, res, next) {
	co(function* () {
		yield db.init();
		const data = yield db.setup(yield pdf.get());
		yield db.fin();

		res.render('index', {
			update: moment(data[0][0].update).format('YYYY年MM月DD日 HH時mm分'),
			list: data[1],
		});
	})
	.catch(console.error);
});

module.exports = router;
