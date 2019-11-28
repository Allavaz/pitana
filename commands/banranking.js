const banranking = require('../banranking');

module.exports = {
	name: 'banranking',
	description: 'Muestra los top 10 baneados',
	usage: '',
	execute(message) {
		banranking(message);
	}
};