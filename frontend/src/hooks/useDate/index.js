import moment from "moment";

export function useDate() {
  function dateToClient(strDate) {
    if (!strDate) {
      return "";
    }
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

  return {
    dateToClient,
    datetimeToClient,
    dateToDatabase,
  };
}
