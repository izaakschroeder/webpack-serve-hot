
function hot(io, compiler) {

	var _stats;

	function unchanged(stats) {
		return stats.assets && stats.assets.every(function(asset) {
			return !asset.emitted;
		});
	}

	function sendStats(socket, force) {
		var stats = _stats && _stats.toJson();
		if (!stats) {
			return;
		}

		if(!force && stats && unchanged(stats)) {
			socket.emit('still-ok');
		} else {
			socket.emit('hash', stats.hash);
			if(stats.errors.length > 0) {
				socket.emit('errors', stats.errors);
			} else if(stats.warnings.length > 0) {
				socket.emit('warnings', stats.warnings);
			} else {
				socket.emit('ok');
			}
		}
	}


	// Listening for events
	var invalidPlugin = function() {
		io.sockets.emit('invalid');
	};

	compiler.plugin('compile', invalidPlugin);
	compiler.plugin('invalid', invalidPlugin);

	compiler.plugin('done', function(stats) {
		_stats = stats;
		sendStats(io.sockets);
	});

	io.sockets.on('connection', function(socket) {
		sendStats(socket, true);
	});
}
