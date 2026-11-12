import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Chip,
  IconButton,
  Popover,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  makeStyles
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";

const useStyles = makeStyles(theme => ({
  root: {
    position: "relative",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[4]
    }
  },
  clickable: {
    cursor: "pointer"
  },
  menuButton: {
    position: "absolute",
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
    zIndex: 1,
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      backgroundColor: theme.palette.action.hover
    }
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    paddingRight: theme.spacing(5),
    marginBottom: theme.spacing(1)
  },
  title: {
    flex: 1,
    fontWeight: 600,
    minWidth: 0
  },
  titleEllipsis: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  titleWrap: {
    wordBreak: "break-word"
  },
  statusChip: {
    marginLeft: theme.spacing(1),
    fontWeight: 600,
    flexShrink: 0
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    "&:last-child": {
      paddingBottom: theme.spacing(1)
    }
  },
  menuItem: {
    minWidth: 160
  },
  menuIcon: {
    minWidth: 36
  }
}));

const ActionCard = ({
  children,
  actions,
  onClick,
  className,
  title,
  titleEllipsis,
  statusChip,
  cardProps,
  contentProps,
  "data-testid": dataTestId
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action, event) => {
    event.stopPropagation();
    handleCloseMenu();
    if (action.onClick) {
      action.onClick(event);
    }
  };

  const handleCardClick = event => {
    if (onClick) {
      onClick(event);
    }
  };

  const hasActions = actions && actions.length > 0;
  const open = Boolean(anchorEl);
  const titleClass = titleEllipsis ? classes.titleEllipsis : classes.titleWrap;

  const renderActionItem = (action, index) => {
    if (React.isValidElement(action)) {
      return (
        <React.Fragment key={index}>
          {action}
          {index < actions.length - 1 && <Divider />}
        </React.Fragment>
      );
    }

    if (action.divider) {
      return <Divider key={`divider-${index}`} />;
    }

    const { icon, label, onClick: actionOnClick, disabled, ...rest } = action;

    return (
      <MenuItem
        key={index}
        onClick={e => handleActionClick(action, e)}
        disabled={disabled}
        className={classes.menuItem}
        {...rest}
      >
        {icon && (
          <ListItemIcon className={classes.menuIcon}>{icon}</ListItemIcon>
        )}
        <ListItemText>
          <Typography variant="body2">{label}</Typography>
        </ListItemText>
      </MenuItem>
    );
  };

  return (
    <Card
      className={`${classes.root} ${onClick ? classes.clickable : ""} ${className || ""}`}
      variant="outlined"
      onClick={handleCardClick}
      data-testid={dataTestId}
      {...cardProps}
    >
      {hasActions && (
        <>
          <IconButton
            size="small"
            onClick={handleOpenMenu}
            aria-label="actions"
            aria-haspopup="true"
            className={classes.menuButton}
          >
            <MoreVertIcon />
          </IconButton>
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right"
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right"
            }}
            onClick={e => e.stopPropagation()}
          >
            <MenuList dense>
              {actions.map((action, index) => renderActionItem(action, index))}
            </MenuList>
          </Popover>
        </>
      )}

      <CardContent className={classes.content} {...contentProps}>
        {title && (
          <div className={classes.header}>
            <Typography
              variant="h6"
              component="h2"
              className={`${classes.title} ${titleClass}`}
            >
              {title}
            </Typography>
            {statusChip && (
              <Chip
                size="small"
                className={classes.statusChip}
                {...statusChip}
              />
            )}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

ActionCard.propTypes = {
  children: PropTypes.node.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.shape({
        icon: PropTypes.element,
        label: PropTypes.string,
        onClick: PropTypes.func,
        disabled: PropTypes.bool,
        divider: PropTypes.bool
      })
    ])
  ),
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string,
  titleEllipsis: PropTypes.bool,
  statusChip: PropTypes.shape({
    label: PropTypes.node,
    className: PropTypes.string
  }),
  cardProps: PropTypes.object,
  contentProps: PropTypes.object,
  "data-testid": PropTypes.string
};

ActionCard.defaultProps = {
  actions: [],
  onClick: null,
  className: "",
  title: null,
  titleEllipsis: false,
  statusChip: null,
  cardProps: {},
  contentProps: {},
  "data-testid": undefined
};

export default ActionCard;
