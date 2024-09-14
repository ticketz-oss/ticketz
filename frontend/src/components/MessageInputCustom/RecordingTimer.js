import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
  timerBox: {
    display: "flex",
    flexDirection: "column", // Add this line
    marginLeft: 10,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center", // Add this line
  },

  timer: {
    position: "absolute",
    marginTop: "30px",
    fontSize: "10px",
    backgroundColor: "red",
    color: "white",
    borderRadius: "5px",
    paddingLeft: "5px",
    paddingRight: "5px",
    zIndex: 100,
  },
  
  '@global': {
    '@keyframes wave': {
      '0%, 60%, 100%': {
        transform: 'initial',
      },
      '30%': {
        transform: 'translateY(-15px)',
      },
    },
    '@keyframes quiet': {
      '25%': {
        transform: 'scaleY(.6)'
      },
      '50%': {
        transform: 'scaleY(.4)',
      },
      '75%': {
        transform: 'scaleY(.8)',
      }
    },
    '@keyframes normal': {
      '25%': {
        transform: 'scaleY(.1)'
      },
      '50%': {
        transform: 'scaleY(.4)',
      },
      '75%': {
        transform: 'scaleY(.6)',
      }
    },
    '@keyframes loud': {
      '25%': {
        transform: 'scaleY(1)'
      },
      '50%': {
        transform: 'scaleY(.4)',
      },
      '75%': {
        transform: 'scaleY(1.2)',
      }
    },
  },
  wave: {
    position: 'relative',
    textAlign: 'center',
    height: "30px",
    marginTop: "10px",
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  wavebarsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    height: "30px",
    marginTop: "5px",
    marginBottom: "5px",
    marginLeft: "auto",
    marginRight: "auto",
    "--boxSize": "5px",
    "--gutter": "4px",
    width: "calc((var(--boxSize) + var(--gutter)) * 5)",
  },

  wavebars: {
    transform: "scaleY(.4)",
    height: "100%",
    width: "var(--boxSize)",
    animationDuration: "1.2s",
    backgroundColor: theme.mode === 'light' ? "#303030" : "#ffffff",
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    borderRadius: '8px',
  },

  wavebar1: {
    animationName: 'quiet'
  },
  wavebar2: {
    animationName: 'normal'
  },
  wavebar3: {
    animationName: 'quiet'
  },
  wavebar4: {
    animationName: 'loud'
  },
  wavebar5: {
    animationName: 'quiet'
  },


}));

const RecordingTimer = () => {
	const classes = useStyles();
	const initialState = {
		minutes: 0,
		seconds: 0,
	};
	const [timer, setTimer] = useState(initialState);

	useEffect(() => {
		const interval = setInterval(
			() =>
				setTimer(prevState => {
					if (prevState.seconds === 59) {
						return { ...prevState, minutes: prevState.minutes + 1, seconds: 0 };
					}
					return { ...prevState, seconds: prevState.seconds + 1 };
				}),
			1000
		);
		return () => {
			clearInterval(interval);
		};
	}, []);

	const addZero = n => {
		return n < 10 ? "0" + n : n;
	};

  return (
    <div className={classes.timerBox}>
      <div className={classes.timer}>{`${addZero(timer.minutes)}:${addZero(timer.seconds)}`}</div>
      <div className={classes.wavebarsContainer}>
        <div className={clsx(classes.wavebars, classes.wavebar1)}></div>
        <div className={clsx(classes.wavebars, classes.wavebar2)}></div>
        <div className={clsx(classes.wavebars, classes.wavebar3)}></div>
        <div className={clsx(classes.wavebars, classes.wavebar4)}></div>
        <div className={clsx(classes.wavebars, classes.wavebar5)}></div>
      </div>
    </div>
  );

};

export default RecordingTimer;
