import { styled } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

const TicketAdvancedLayout = styled(Paper)({
  height: `calc(100% - var(--altura-cabecalho, 60px))`,
  display: "grid",
  gridTemplateRows: "56px 1fr"
});

export default TicketAdvancedLayout;
