var krist   = require('./../src/krist.js'),
	utils   = require('./../src/utils.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.submitblock !== 'undefined') {
			if (!req.query.address || !(/^(?:k[a-z0-9]{9}|[a-f0-9]{10})/i.exec(req.query.address))) {
				res.status(400).send('Invalid address');

				return;
			}

			if (!req.query.nonce || req.query.nonce.length > 12) {
				res.status(400).send('Nonce is too large'); // idk man

				return;
			}

			krist.getLastBlock().then(function(lastBlock) {
				var last = lastBlock.hash.substr(0, 12);
				var difficulty = krist.getWork();
				var hash = utils.sha256(req.query.address + last + req.query.nonce);

				if (parseInt(hash.substr(0, 12), 16) <= difficulty) {
					krist.submit(hash, req.query.address, req.query.nonce).then(function() {
						res.send('Block solved');
					});
				} else {
					res.send(req.query.address + last + req.query.nonce);
				}
			});

			return;
		}

		next();
	});

	app.post('/submit', function(req, res) {
		if (!req.body.address) {
			res.status(400).json({
				ok: false,
				error: 'missing_address'
			});

			return;
		}

		if (!(/^(?:k[a-z0-9]{9}|[a-f0-9]{10})/i.exec(req.body.address))) {
			res.status(400).json({
				ok: false,
				error: 'invalid_address'
			});

			return;
		}

		if (!req.body.nonce) {
			res.status(400).json({
				ok: false,
				error: 'missing_nonce'
			});

			return;
		}

		if (req.body.nonce.length > 12) {
			res.status(400).json({
				ok: false,
				error: 'invalid_nonce'
			});

			return;
		}

		krist.getLastBlock().then(function(lastBlock) {
			var last = lastBlock.hash.substr(0, 12);
			var difficulty = krist.getWork();
			var hash = utils.sha256(req.body.address + last + req.body.nonce);

			if (parseInt(hash.substr(0, 12), 16) <= difficulty) {
				krist.submit(hash, req.body.address, req.body.nonce).then(function(result) {
					res.json({
						ok: true,
						success: true,
						work: result.work,
						address: result.address.address,
						balance: result.address.balance
					});
				});
			} else {
				res.json({
					ok: true,
					success: false,
					address: req.body.address.toLowerCase(),
					nonce: req.query.nonce,
					last_hash: last,
					psa: "child abuse is bad!!",
					schrodingers_cat: Math.round(Math.random()) == 1 ? "alive" : "dead"
				});
			}
		});
	});

	return app;
}
