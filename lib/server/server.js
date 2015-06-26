
function server(compiler, options) {

	var root = compiler.output.path;
	var fs = compiler.outputFileSystem;

	// Derp.
	function inWebpackOutputDirectory(request) {
		if (request.charAt(0) !== '/') {
			return false;
		} else {
			return request.substr(0, root.length) === root;
		}
	}

	// Derp.
	function isHotRequest(request) {
		return /^\.\/.*\.hot-update\.(json|js)$/.test(request);
	}

	// We only care about requests coming to things webpack generates; the
	// entrypoints are always absolute paths, so just check that they belong to
	// the root; handle hot-updates specially since they are requested relatively.
	function isWebpackAssetRequest(request, parent) {
		return isHotRequest(request) || inWebpackOutputDirectory(request);
	}

	// Note that memory-fs ONLY handles requests for absolute paths. This means
	// that whatever gets returned here has to be an absolute path. So if it's
	// already an absolute path return that, otherwise map the request to the
	// webpack output directory.
	function resolveWebpackAsset(request, parent) {
		if (request.charAt(0) === '/') {
			return request;
		} else {
			return path.resolve(path.dirname(parent.id), request);
		}
	}

	// No fancy loading; just the standard .js/.json types; the only difference is
	// that their data comes from the memory-fs.
	function handleWebpackAsset(module, filename) {
		var data = compiler.outputFileSystem.readFileSync(filename, 'utf8');
		if (path.extname(filename) === '.json') {
			module.exports = JSON.parse(data);
		} else {
			module._compile(data);
		}
	}

	// If the file system isn't the native node file system then we have to
	// start injecting hooks.
	if (fs !== nodefs) {
		hook({
			test: isWebpackAssetRequest,
			resolve: resolveWebpackAsset,
			handler: handleWebpackAsset
		});
	}

	// In-process HMR.
	compiler.plugin('done', function() {
		process.emit('hot-module-update');
	});


	return function middleware() {

	};
}

compiler.plugin('done', function(stats) {



	var map = stats.toJson({ assets: true}).assetsByChunkName;
	var modules = _.mapValues(map, function(asset) {
		return path.join(compiler.options.output.path, asset);
	});

	_.forEach(modules, function(module) {
		require(modules);
	});

});
