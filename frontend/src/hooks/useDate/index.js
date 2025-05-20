const moment = window.ticketz.moment;

export function useDate() {
  function dateToClient(strDate) {
    const [year, month, day] = strDate.split("T")[0].split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
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
  
  function simpleRelativePastTime(strDate) {
    if (moment(strDate).isValid()) {
      return moment(strDate).calendar({
        sameDay: 'LT',
        nextDay: 'L',
        lastDay: 'dddd',
        lastWeek: 'dddd',
        sameElse: 'L'
      });
    }
  }

  return {
    dateToClient,
    datetimeToClient,
    dateToDatabase,
    relativePastTime,
    simpleRelativePastTime,
  };
}
