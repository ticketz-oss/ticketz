import { unparse } from 'papaparse';
import { toast } from "react-toastify";

export function exportCsv(data, filename) {
  const result = unparse(data);
  if (!result) {
    toast.error("Error generating CSV");
    return;
  }

  const blob = new Blob([result], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "report.csv";
  a.click();
  URL.revokeObjectURL(url);
}
