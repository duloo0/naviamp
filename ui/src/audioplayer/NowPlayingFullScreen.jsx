import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Collapse,
  useMediaQuery,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import QueueMusicIcon from '@material-ui/icons/QueueMusic'
import { LoveButton, RatingField } from '../common'
import subsonic from '../subsonic'
import config from '../config'
import LyricsPanel from './LyricsPanel'
import SignalPath from './SignalPath'

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1400,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  // Blurred background
  backgroundBlur: {
    position: 'absolute',
    top: '-20%',
    left: '-20%',
    right: '-20%',
    bottom: '-20%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(80px)',
    opacity: 0.5,
    transform: 'scale(1.4)',
    zIndex: 0,
  },
  // Dark gradient overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.7) 0%,
      rgba(0, 0, 0, 0.85) 50%,
      rgba(0, 0, 0, 0.95) 100%
    )`,
    zIndex: 1,
  },
  // Main content
  content: {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    paddingTop: theme.spacing(8),
    maxWidth: 1400,
    margin: '0 auto',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      paddingTop: theme.spacing(6),
    },
  },
  // Header with close button
  header: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    right: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 3,
  },
  closeButton: {
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  nowPlayingLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Main area with album art and info
  mainArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(6),
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
      gap: theme.spacing(3),
    },
  },
  // Album art
  albumArtContainer: {
    flexShrink: 0,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
  },
  albumArt: {
    width: 400,
    height: 400,
    borderRadius: 12,
    boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6)',
    objectFit: 'cover',
    [theme.breakpoints.down('lg')]: {
      width: 320,
      height: 320,
    },
    [theme.breakpoints.down('md')]: {
      width: 280,
      height: 280,
    },
    [theme.breakpoints.down('sm')]: {
      width: 240,
      height: 240,
    },
  },
  // Info section
  infoSection: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      alignItems: 'center',
      textAlign: 'center',
    },
  },
  songTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 3rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#fff',
    wordBreak: 'break-word',
  },
  artistName: {
    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.85)',
    cursor: 'pointer',
    '&:hover': {
      color: '#00FFFF',
    },
  },
  albumName: {
    fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    '&:hover': {
      color: 'rgba(255, 255, 255, 0.9)',
    },
  },
  // Metadata row (year, format, etc)
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    [theme.breakpoints.down('md')]: {
      justifyContent: 'center',
    },
  },
  metaItem: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  qualityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  qualityBadgeLossless: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    color: '#00FF88',
    borderColor: '#00FF88',
  },
  qualityBadgeHiRes: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    color: '#FFD700',
    borderColor: '#FFD700',
  },
  // Actions row
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('md')]: {
      justifyContent: 'center',
    },
  },
  // Progress section
  progressSection: {
    marginTop: 'auto',
    paddingTop: theme.spacing(3),
  },
  progressBar: {
    color: '#fff',
    height: 4,
    '& .MuiSlider-thumb': {
      width: 12,
      height: 12,
      '&:hover': {
        boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
      },
    },
    '& .MuiSlider-track': {
      height: 4,
    },
    '& .MuiSlider-rail': {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  timeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
  },
  timeText: {
    fontSize: '0.75rem',
    fontFamily: '"JetBrains Mono", monospace',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Expandable panels
  expandSection: {
    marginTop: theme.spacing(2),
  },
  expandHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    cursor: 'pointer',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  expandLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  lyricsContainer: {
    maxHeight: 300,
    overflow: 'auto',
    padding: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(1),
  },
}))

// Format time from seconds to mm:ss
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Check if format is lossless
const isLossless = (suffix) => {
  const losslessFormats = config.losslessFormats?.split(',') || ['flac', 'alac', 'wav', 'aiff', 'ape', 'dsd']
  return losslessFormats.includes(suffix?.toLowerCase())
}

// Check if hi-res (>44.1kHz or >16-bit)
const isHiRes = (song) => {
  const sampleRate = song?.sampleRate || 0
  const bitDepth = song?.bitDepth || 0
  return sampleRate > 44100 || bitDepth > 16
}

const NowPlayingFullScreen = ({ open, onClose, audioInstance }) => {
  const classes = useStyles()
  const history = useHistory()
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down('sm'))

  const playerState = useSelector((state) => state.player)
  const current = playerState?.current || {}
  const song = current?.song || {}

  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showLyrics, setShowLyrics] = useState(false)
  const [showSignalPath, setShowSignalPath] = useState(false)

  // Get cover art URL
  const coverArtUrl = useMemo(() => {
    if (song?.albumId) {
      return subsonic.getCoverArtUrl({ coverArt: song.albumId }, 600)
    }
    return null
  }, [song?.albumId])

  // Track audio progress
  useEffect(() => {
    if (!audioInstance) return

    const updateProgress = () => {
      setProgress(audioInstance.currentTime || 0)
      setDuration(audioInstance.duration || 0)
    }

    audioInstance.addEventListener('timeupdate', updateProgress)
    audioInstance.addEventListener('loadedmetadata', updateProgress)

    return () => {
      audioInstance.removeEventListener('timeupdate', updateProgress)
      audioInstance.removeEventListener('loadedmetadata', updateProgress)
    }
  }, [audioInstance])

  // Handle seek
  const handleSeek = useCallback((_, value) => {
    if (audioInstance && duration) {
      audioInstance.currentTime = value
      setProgress(value)
    }
  }, [audioInstance, duration])

  // Navigate to artist
  const handleArtistClick = useCallback(() => {
    if (song?.artistId) {
      onClose()
      history.push(`/artist/${song.artistId}/show`)
    }
  }, [song?.artistId, history, onClose])

  // Navigate to album
  const handleAlbumClick = useCallback(() => {
    if (song?.albumId) {
      onClose()
      history.push(`/album/${song.albumId}/show`)
    }
  }, [song?.albumId, history, onClose])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const subtitle = song?.tags?.['subtitle']
  const title = song?.title + (subtitle ? ` (${subtitle})` : '')
  const suffix = song?.suffix?.toUpperCase()
  const bitRate = song?.bitRate
  const sampleRate = song?.sampleRate
  const bitDepth = song?.bitDepth

  return (
    <div className={classes.root}>
      {/* Blurred background */}
      {coverArtUrl && (
        <div
          className={classes.backgroundBlur}
          style={{ backgroundImage: `url(${coverArtUrl})` }}
        />
      )}

      {/* Dark overlay */}
      <div className={classes.overlay} />

      {/* Header */}
      <div className={classes.header}>
        <Typography className={classes.nowPlayingLabel}>
          Now Playing
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            size="small"
            className={classes.closeButton}
            onClick={() => setShowSignalPath(!showSignalPath)}
            title="Signal Path"
          >
            <QueueMusicIcon fontSize="small" />
          </IconButton>
          <IconButton
            className={classes.closeButton}
            onClick={onClose}
            title="Close (Esc)"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </div>

      {/* Main content */}
      <div className={classes.content}>
        <div className={classes.mainArea}>
          {/* Album Art */}
          <div className={classes.albumArtContainer}>
            {coverArtUrl ? (
              <img
                src={coverArtUrl}
                alt={song?.album || 'Album Art'}
                className={classes.albumArt}
                onClick={handleAlbumClick}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <div className={classes.albumArt} style={{ backgroundColor: '#333' }} />
            )}
          </div>

          {/* Song Info */}
          <div className={classes.infoSection}>
            <Typography className={classes.songTitle}>
              {title || 'Unknown Title'}
            </Typography>

            <Typography
              className={classes.artistName}
              onClick={handleArtistClick}
            >
              {song?.artist || 'Unknown Artist'}
            </Typography>

            <Typography
              className={classes.albumName}
              onClick={handleAlbumClick}
            >
              {song?.album || 'Unknown Album'}
              {song?.year ? ` (${song.year})` : ''}
            </Typography>

            {/* Metadata */}
            <div className={classes.metaRow}>
              {suffix && (
                <span
                  className={`${classes.qualityBadge} ${
                    isHiRes(song) ? classes.qualityBadgeHiRes :
                    isLossless(suffix?.toLowerCase()) ? classes.qualityBadgeLossless : ''
                  }`}
                >
                  {suffix}
                  {bitRate && !isLossless(suffix?.toLowerCase()) ? ` ${bitRate}` : ''}
                </span>
              )}
              {sampleRate && (
                <span className={classes.metaItem}>
                  {(sampleRate / 1000).toFixed(1)}kHz
                </span>
              )}
              {bitDepth && (
                <span className={classes.metaItem}>
                  {bitDepth}-bit
                </span>
              )}
              {song?.playCount > 0 && (
                <span className={classes.metaItem}>
                  {song.playCount} plays
                </span>
              )}
            </div>

            {/* Actions */}
            <div className={classes.actionsRow}>
              <LoveButton
                record={song}
                resource="song"
                size="default"
                color="primary"
              />
              {config.enableStarRating && (
                <RatingField
                  record={song}
                  resource="song"
                  size="small"
                />
              )}
            </div>

            {/* Signal Path */}
            <Collapse in={showSignalPath}>
              <SignalPath song={song} />
            </Collapse>
          </div>
        </div>

        {/* Progress */}
        <div className={classes.progressSection}>
          <Slider
            className={classes.progressBar}
            value={progress}
            max={duration || 100}
            onChange={handleSeek}
          />
          <div className={classes.timeRow}>
            <Typography className={classes.timeText}>
              {formatTime(progress)}
            </Typography>
            <Typography className={classes.timeText}>
              {formatTime(duration)}
            </Typography>
          </div>
        </div>

        {/* Lyrics toggle */}
        {song?.lyrics && (
          <div className={classes.expandSection}>
            <div
              className={classes.expandHeader}
              onClick={() => setShowLyrics(!showLyrics)}
            >
              <Typography className={classes.expandLabel}>
                Lyrics
              </Typography>
              {showLyrics ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </div>
            <Collapse in={showLyrics}>
              <div className={classes.lyricsContainer}>
                <LyricsPanel
                  lyrics={song.lyrics}
                  currentTime={progress}
                />
              </div>
            </Collapse>
          </div>
        )}
      </div>
    </div>
  )
}

export default NowPlayingFullScreen
