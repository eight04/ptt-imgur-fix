/* eslint-env node */
module.exports = {
	env: {
		browser: true,
		greasemonkey: true,
		es2021: true
	},
	rules: {
		"no-use-before-define": [2, "nofunc"]
	},
	extends: "eslint:recommended"
};
