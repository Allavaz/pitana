module.exports = (duration) => {
	let remaining = '';
	if (Math.ceil(duration.days) > 0) {
		remaining = remaining + `${Math.ceil(duration.days)} día${Math.ceil(duration.days) > 1 ? 's' : ''} `
	} if (Math.ceil(duration.hours) > 0) {
		remaining = remaining + `${Math.ceil(duration.hours)} hora${Math.ceil(duration.hours) > 1 ? 's' : ''} `
	} if (Math.ceil(duration.minutes) > 0) {
		remaining = remaining + `${Math.ceil(duration.minutes)} minuto${Math.ceil(duration.minutes) > 1 ? 's' : ''} `
	}
	return remaining;
}