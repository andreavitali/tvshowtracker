angular.module('filters', [])
.filter('padding', function () {
    return function (input, char, n) {
        if (input === undefined)
            input = ""
        if (input.length >= n)
            return input
        return (new Array(n).join(char) + input).slice(-1 * n);
    };
})
.filter('episodeLabel', function () {
    return function (episode) {
        var s, e;
        if (episode.season < 10) s = "0" + episode.season;
        else s = episode.season;
        if (episode.episode < 10) e = "0" + episode.episode;
        else e = episode.episode;
        return "S"+s+"E"+e;
    }
})
.filter('fromNow', function () {
    return function (date) {
        if (!moment(date).isValid())
            return "date not available";
        if (moment(date).isSame(moment().startOf('day'))) {
            var momentTodayLocale = moment.localeData().calendar("sameDay");
            return momentTodayLocale.substring(1, momentTodayLocale.indexOf(' '));
        }
        else if(moment(date).isSame(moment().add(1,'d').startOf('day'))) {
            var momentTomorrowLocale = moment.localeData().calendar("nextDay");
            return momentTomorrowLocale.substring(1, momentTomorrowLocale.indexOf(' '));
        }
        else
            return moment.localeData().relativeTime(moment(date).add(1, 'd').diff(moment(), 'days'),true,'dd');
    }
});