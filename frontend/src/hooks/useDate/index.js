const moment = window.ticketz.moment;

export function useDate() {
  function dateToClient(strDate) {
    if (moment(strDate).isValid()) {
      return moment(strDate).format("DD/MM/YYYY");
    }
    return strDate;
  }

  function datetimeToClient(strDate) {
    if (moment(strDate).isValid()) {
      return moment(strDate).format("DD/MM/YYYY HH:mm");
    }
    return strDate;
  }

  function dateToDatabase(strDate) {
    if (moment(strDate, "DD/MM/YYYY").isValid()) {
      return moment(strDate).format("YYYY-MM-DD HH:mm:ss");
    }
    return strDate;
  }
  
  function relativePastTime(strDate) {
    if (moment(strDate).isValid()) {
      return moment(strDate).calendar({
        sameDay: 'LT',
        nextDay: 'L LT',
        nextWeek: '[Next] dddd LT',
        lastDay: 'dddd LT',
        lastWeek: 'dddd LT',
        sameElse: 'L LT'
      });
    }
  }

  return {
    dateToClient,
    datetimeToClient,
    dateToDatabase,
    relativePastTime,
  };
}
