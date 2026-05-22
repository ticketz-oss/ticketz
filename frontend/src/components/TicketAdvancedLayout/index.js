import { styled } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

const TicketAdvancedLayout = styled(Paper)(({ theme }) => ({
  height: `calc(100% - 48px)`,
  display: "grid",
  gridTemplateRows: "56px 1fr",
  borderRadius: 0,
  backgroundColor: theme.palette.background.default,
  borderTop: `1px solid ${theme.palette.backgroundContrast.border}`,
  overflow: "hidden"
}));

export default TicketAdvancedLayout;
