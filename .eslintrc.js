module.exports = {
	env: {
		browser: true,
		greasemonkey: true,
		es6: true
	},
	rules: {
		"no-use-before-define": [2, "nofunc"]
	},
	extends: "eslint:recommended"
};
