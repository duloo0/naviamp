import React, { useRef, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
  },
  line: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: 'rgba(255, 255, 255, 0.4)',
    transition: 'all 300ms ease',
    cursor: 'default',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  activeLine: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  passedLine: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  instrumental: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    padding: theme.spacing(2, 0),
  },
  noLyrics: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    padding: theme.spacing(4, 0),
    fontStyle: 'italic',
  },
}))

// Parse LRC format lyrics into array of {time, text} objects
const parseLrcLyrics = (lyrics) => {
  if (!lyrics) return []

  const lines = lyrics.split('\n')
  const parsed = []

  // LRC timestamp pattern: [mm:ss.xx] or [mm:ss]
  const timestampRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g

  for (const line of lines) {
    // Skip metadata lines like [ar:Artist], [al:Album], etc.
    if (/^\[[a-z]{2}:/.test(line)) continue

    // Extract all timestamps from line
    const timestamps = []
    let match
    while ((match = timestampRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0
      timestamps.push(minutes * 60 + seconds + ms / 1000)
    }

    // Get the text after all timestamps
    const text = line.replace(timestampRegex, '').trim()

    // Add entry for each timestamp (some lines have multiple for repeating lyrics)
    for (const time of timestamps) {
      if (text) {
        parsed.push({ time, text })
      }
    }
  }

  // Sort by timestamp
  return parsed.sort((a, b) => a.time - b.time)
}

// Check if lyrics are in LRC format (have timestamps)
const isLrcFormat = (lyrics) => {
  if (!lyrics) return false
  return /\[\d{2}:\d{2}/.test(lyrics)
}

const LyricsPanel = ({ lyrics, currentTime, onLineClick }) => {
  const classes = useStyles()
  const containerRef = useRef(null)
  const activeLineRef = useRef(null)

  // Parse lyrics based on format
  const { parsedLyrics, isSynced } = useMemo(() => {
    if (!lyrics) return { parsedLyrics: [], isSynced: false }

    if (isLrcFormat(lyrics)) {
      return {
        parsedLyrics: parseLrcLyrics(lyrics),
        isSynced: true,
      }
    }

    // Plain text lyrics - split by newline
    const lines = lyrics.split('\n')
      .map((text, index) => ({ time: null, text: text.trim() }))
      .filter((line) => line.text)

    return { parsedLyrics: lines, isSynced: false }
  }, [lyrics])

  // Find current line index based on time
  const currentLineIndex = useMemo(() => {
    if (!isSynced || currentTime === undefined) return -1

    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLyrics[i].time) {
        return i
      }
    }
    return -1
  }, [parsedLyrics, currentTime, isSynced])

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current
      const line = activeLineRef.current

      const lineTop = line.offsetTop - container.offsetTop
      const lineHeight = line.offsetHeight
      const containerHeight = container.clientHeight
      const scrollTop = container.scrollTop

      // Calculate ideal scroll position (center the line)
      const idealScroll = lineTop - containerHeight / 2 + lineHeight / 2

      // Smooth scroll if not too far
      const distance = Math.abs(idealScroll - scrollTop)
      if (distance < containerHeight * 2) {
        container.scrollTo({
          top: idealScroll,
          behavior: 'smooth',
        })
      } else {
        container.scrollTop = idealScroll
      }
    }
  }, [currentLineIndex])

  if (!lyrics) {
    return (
      <Typography className={classes.noLyrics}>
        No lyrics available
      </Typography>
    )
  }

  if (parsedLyrics.length === 0) {
    return (
      <Typography className={classes.instrumental}>
        Instrumental
      </Typography>
    )
  }

  return (
    <div ref={containerRef} className={classes.container}>
      {parsedLyrics.map((line, index) => {
        const isActive = index === currentLineIndex
        const isPassed = isSynced && index < currentLineIndex

        return (
          <Typography
            key={`${index}-${line.time}`}
            ref={isActive ? activeLineRef : null}
            className={`${classes.line} ${
              isActive ? classes.activeLine : ''
            } ${isPassed ? classes.passedLine : ''}`}
            onClick={() => onLineClick && isSynced && onLineClick(line.time)}
          >
            {line.text}
          </Typography>
        )
      })}
    </div>
  )
}

LyricsPanel.propTypes = {
  lyrics: PropTypes.string,
  currentTime: PropTypes.number,
  onLineClick: PropTypes.func,
}

LyricsPanel.defaultProps = {
  currentTime: 0,
}

export default LyricsPanel
