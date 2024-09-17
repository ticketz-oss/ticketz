import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faBackward, faForward } from '@fortawesome/free-solid-svg-icons';
import { IconButton, makeStyles, Slider } from '@material-ui/core';
const ogv = require('ogv');
ogv.OGVLoader.base = '/ogv/dist';

window.currentPlayerControllers = null;

const useStyles = makeStyles((theme) => ({
  iconButton: {
    color: "black",
    padding: 0,
    width: 20,
    height: 20,
    margin: 10,
    color: theme.palette.primary.main
  },
  playerLine: {
    display: 'flex'
  },
  timer: {
    paddingLeft: 95,
    fontSize: 11,
    color: theme.mode === 'light' ? "#999" : "#d0d0d0"
  },
  childrenBox: {
    width: 40,
    height: 40,
    minWidth: 40,
    padding: 0,
    margin: 0,
    marginLeft: 5
  },

  rateButton: {
    color: theme.palette.primary.contrastText,
    cursor: "pointer",
    height: 20,
    maxWidth: 35,
    borderRadius: 10,
    backgroundColor: theme.palette.primary.light,
    marginTop: 10,
    textAlign: "center"
  },

  playerProgress: {
    width: 200,
    marginLeft: 10,
    marginRight: 10
  },

  sliderRoot: {
    marginTop: 3,
    width: 200,
    color: theme.palette.primary.main,
  },
  sliderThumb: {
    height: 16,
    width: 16,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    marginTop: -4,
    marginLeft: -8,
    '&:focus, &:hover, &$active': {
      boxShadow: 'inherit',
    },
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
  },
  sliderRail: {
    height: 8,
    borderRadius: 4,
  },
}));

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function OggAudioPlayer({ src, children }) {
  const classes = useStyles();
  const playerRef = useRef();
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  let thisPlayerControllers = null;

  const playAudio = () => {
    if (window.currentPlayerControllers && window.currentPlayerControllers !== thisPlayerControllers) {
      window.currentPlayerControllers.pauseAudio();
    }
    const storedPlaybackRate = localStorage.getItem('playbackRate');
    if (storedPlaybackRate) {
      player.playbackRate = parseFloat(storedPlaybackRate);
      setPlaybackRate(parseFloat(storedPlaybackRate));
    }
    player.play();
    window.currentPlayerControllers = thisPlayerControllers;
    setIsPlaying(true);
  };

  const pauseAudio = () => {
    player?.pause();
    setIsPlaying(false);
  };

  const changePlaybackRate = () => {
    const newPlaybackRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    player.playbackRate = newPlaybackRate;
    setPlaybackRate(newPlaybackRate);
    localStorage.setItem('playbackRate', newPlaybackRate);
  };

  const handleProgressChange = (newTime) => {
    player.currentTime = newTime;
    setCurrentTime(newTime);
  };

  thisPlayerControllers = { pauseAudio };

  useEffect(() => {
    const ogvPlayer = new ogv.OGVPlayer();
    ogvPlayer.src = src;
    ogvPlayer.load();
    ogvPlayer.addEventListener('loadedmetadata', () => setDuration(ogvPlayer.duration));
    ogvPlayer.addEventListener('ended', () => setIsPlaying(false));

    setPlayer(ogvPlayer);
    playerRef.current.appendChild(ogvPlayer);

    const updateProgress = () => {
      setCurrentTime(ogvPlayer.currentTime);
      requestAnimationFrame(updateProgress);
    };

    ogvPlayer.addEventListener('play', updateProgress);

    return () => {
      ogvPlayer.removeEventListener('play', updateProgress);
    };
  }, [src]);

  return (
    <div>
      <div style={{display: "none"}} ref={playerRef} />
      <div className={classes.playerBox}>
        <div className={classes.playerLine}>
          <div className={classes.childrenBox}>
            {isPlaying ? (
              <div className={classes.rateButton} onClick={changePlaybackRate}>
                {playbackRate}x
              </div>
            ) : children}
          </div>
          <IconButton className={classes.iconButton}
            aria-label="upload"
            component="span"
            onClick={isPlaying ? pauseAudio : playAudio}>
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </IconButton>
          <Slider
            value={currentTime}
            max={duration}
            onChange={(e, newValue) => handleProgressChange(newValue)}
            className={classes.playerProgress}
            classes={{
              root: classes.sliderRoot,
              thumb: classes.sliderThumb,
              track: classes.sliderTrack,
              rail: classes.sliderRail,
            }}
          />
        </div>
        <div className={classes.timer}>{isPlaying ? formatTime(currentTime) : formatTime(duration)}</div>
      </div>
    </div>
  );
}
