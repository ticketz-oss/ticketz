import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';

const useStyles = makeStyles((theme) => ({
  
  root: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  
  tag: {
    margin: theme.spacing(0.5),
    color: '#fff',
    fontSize: 10,
    height: 20,
    marginTop: 0,
  },

}));

const TagsLine = ({ ticket }) => {
  const classes = useStyles();
  
  const tags = [...(ticket.tags || []), ...(ticket.contact?.tags || []) ];
  
  return (
    <div className={classes.root}>
      {tags?.map((tag, index) => (
        <Chip
          key={index}
          label={tag.name}
          style={{ backgroundColor: tag.color }}
          className={classes.tag}
        />
      ))}
    </div>
  );
};

export default TagsLine;
