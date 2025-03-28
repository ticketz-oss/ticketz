import { makeStyles } from '@material-ui/core'

export const useStyles = makeStyles(theme => ({
  emojiButton: {
    cursor: "pointer",
    borderRadius: 5,
    '&:hover': {
      backgroundColor: '#888a'
    },
    flexBasis: '25%',
    margin: 0,
    textAlign: 'center',
  },
  flexContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
}))