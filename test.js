const { DateTime, Interval } = require('luxon');

da = DateTime.local()
daa = da.plus({days: 1, minutes: 1})

duration = Interval.fromDateTimes(da, daa).toDuration(['days', 'hours', 'minutes']).toObject()

console.log(Math.ceil(0.1))