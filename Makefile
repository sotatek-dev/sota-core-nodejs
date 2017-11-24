check-syntax:
	node_modules/.bin/eslint \
	--config="node-style-guide/.eslintrc" \
	--parser-options="{ecmaVersion:6}" \
	--rule="{ \
						'max-len':[1, 100, {'ignoreComments':true}],\
						'max-depth': [1, 4], \
						'max-statements': [1, 100], \
						'no-unused-vars': [1, { 'vars': 'all', 'args': 'none' }], \
						'camelcase':[1,{'properties': 'never'}] \
					}" \
	./

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

check-style:
	jscs .

test:
	node_modules/.bin/mocha test/*

coverage:
	istanbul cover _mocha -R test/*
	open coverage/lcov-report/index.html
