'use strict';

const moment    = require('moment');
const co        = require('co');
const thunkify  = require('thunkify');
const pdf2table = require('pdf2table');

const request   = thunkify(require('request'));
pdf2table._parse= thunkify(pdf2table.parse);

module.exports = {
	get: co.wrap(function* () {

		const today = moment().format('YYYY-MM-DD');

		let response;
		/*
		 * Get weekly.pdf
		 * [ 200] Ok
		 * [!200] Error
		 */
		response = yield request({
			url     : 'http://www.hotsukyo.or.jp/pdf/weekly.pdf',
			method  : 'GET',
			encoding: null
		});
		if (response[0].statusCode != 200) {
			throw new Error('[http] Status Error:' + response[0].statusCode);
		}

		let list = [];
		const table = yield pdf2table._parse(response[0].body);
		/*
		 * table[0]: rows
		 * table[1]: rowsdebug
		 * table[2]: error
		 */
		if (table[2]) {
			throw new Error('[process] PDF parsing error:' + err);
		}

		const getStatus = function(str) {
			return str.length == 0?0:(str == '試験中'?1:3);
		}
		table[0].forEach(function(e, i, a) {
			let data = {
				id    : null,
				start : null,
				end   : null,
				update: today,
				guess : null,
				test  : [{
					status: null,
					start : null,
					end   : null,
				},{
					status: null,
					start : null,
					end   : null,
				},{
					status: null,
					start : null,
					end   : null,
				}]};
			if (e.length != 7 && e.length != 1) {
				data.id = Number(e[0]);
				data.test[0].status = getStatus(e[1]);
				data.test[1].status = getStatus(e[2]);

				// 性能試験が空白の場合から。
				data.test[2].status = 0;
				data.guess = e[3];
				if (e.length == 5) {
					data.test[2].status = getStatus(e[3]);
					data.guess = e[4];
				}
				if ((data.test[0].status + data.test[1].status
							+ data.test[2].status) == 9) {
					data.end = today;
				}
				list.push(data);
			}
		});
		return list;
	})
}
