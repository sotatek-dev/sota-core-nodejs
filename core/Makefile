check-syntax:
	node_modules/.bin/eslint \
	--config="node-style-guide/.eslintrc" \
	--rule="{'max-len':[1, 100, {'ignoreComments':true}],\
					'max-depth': [1, 4], \
					'camelcase':[1,{'properties': 'never'}]}" \
	common/ controller/ data/ entity/ error/ model/ service/ util/

check-syntax-error:
	node_modules/.bin/eslint \
	--quiet=true \
	--config="node-style-guide/.eslintrc" \
	common/ controller/ data/ entity/ error/ model/ service/ util/

check-syntax-jshint:
	node_modules/jshint/bin/jshint \
	--reporter="node_modules/jshint-stylish" \
	--config="node-style-guide/.jshintrc" \
	common/ controller/ data/ entity/ error/ model/ service/ util/

unittest:
	node_modules/.bin/mocha test/*

covertest:
	istanbul cover _mocha -R test/*
	open coverage/lcov-report/index.html
