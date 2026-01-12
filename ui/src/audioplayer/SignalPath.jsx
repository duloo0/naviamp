import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import config from '../config'

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: theme.shape.borderRadius,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: theme.spacing(2),
  },
  pathContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  node: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.shape.borderRadius,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  nodeLabel: {
    fontSize: '0.6rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: theme.spacing(0.5),
  },
  nodeValue: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#fff',
    textAlign: 'center',
  },
  nodeSubValue: {
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 2,
  },
  arrow: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '1.2rem',
    fontWeight: 300,
  },
  // Quality indicators
  lossless: {
    borderColor: 'rgba(0, 255, 136, 0.4)',
    '& $nodeValue': {
      color: '#00FF88',
    },
  },
  hiRes: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    '& $nodeValue': {
      color: '#FFD700',
    },
  },
  lossy: {
    borderColor: 'rgba(255, 152, 0, 0.4)',
    '& $nodeValue': {
      color: '#FF9800',
    },
  },
  // Processing node
  processing: {
    backgroundColor: 'rgba(0, 200, 255, 0.08)',
    borderColor: 'rgba(0, 200, 255, 0.3)',
  },
  replayGain: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderColor: 'rgba(156, 39, 176, 0.4)',
    '& $nodeValue': {
      color: '#CE93D8',
    },
  },
  // Summary
  summary: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'center',
  },
  summaryText: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryHighlight: {
    fontWeight: 600,
  },
  losslessText: {
    color: '#00FF88',
  },
  lossyText: {
    color: '#FF9800',
  },
}))

// Check if format is lossless
const isLosslessFormat = (suffix) => {
  const losslessFormats = config.losslessFormats?.split(',') || ['flac', 'alac', 'wav', 'aiff', 'ape', 'dsd', 'dsf', 'dff']
  return losslessFormats.includes(suffix?.toLowerCase())
}

// Check if hi-res
const isHiResAudio = (sampleRate, bitDepth) => {
  return (sampleRate && sampleRate > 44100) || (bitDepth && bitDepth > 16)
}

// Format sample rate for display
const formatSampleRate = (rate) => {
  if (!rate) return null
  if (rate >= 1000) {
    return `${(rate / 1000).toFixed(1)}kHz`
  }
  return `${rate}Hz`
}

const SignalPath = ({ song }) => {
  const classes = useStyles()
  const gainInfo = useSelector((state) => state.replayGain)

  const pathNodes = useMemo(() => {
    if (!song) return []

    const nodes = []
    const suffix = song.suffix?.toUpperCase() || 'Unknown'
    const sampleRate = song.sampleRate
    const bitDepth = song.bitDepth
    const bitRate = song.bitRate
    const isLossless = isLosslessFormat(song.suffix)
    const isHiRes = isHiResAudio(sampleRate, bitDepth)

    // Source node
    nodes.push({
      id: 'source',
      label: 'Source',
      value: suffix,
      subValue: isLossless
        ? bitDepth && sampleRate
          ? `${bitDepth}-bit / ${formatSampleRate(sampleRate)}`
          : 'Lossless'
        : bitRate
          ? `${bitRate} kbps`
          : null,
      className: isHiRes ? classes.hiRes : isLossless ? classes.lossless : classes.lossy,
    })

    // Check for transcoding (if transcodedSuffix exists and differs from source)
    // This is a placeholder - actual transcoding detection depends on server config
    const transcodedFormat = config.defaultDownsamplingFormat
    const maxBitRate = config.maxBitRate
    const needsTranscode = maxBitRate && bitRate && bitRate > parseInt(maxBitRate, 10)

    if (needsTranscode) {
      nodes.push({
        id: 'transcode',
        label: 'Transcode',
        value: transcodedFormat?.toUpperCase() || 'MP3',
        subValue: `${maxBitRate} kbps`,
        className: classes.processing,
      })
    }

    // Replay Gain processing
    if (gainInfo.gainMode && gainInfo.gainMode !== 'none') {
      const gainType = gainInfo.gainMode === 'album' ? 'Album' : 'Track'
      const gain = gainInfo.gainMode === 'album' ? song.rgAlbumGain : song.rgTrackGain

      nodes.push({
        id: 'replayGain',
        label: 'Replay Gain',
        value: gainType,
        subValue: gain !== undefined
          ? `${gain >= 0 ? '+' : ''}${gain?.toFixed(2)} dB`
          : 'No data',
        className: classes.replayGain,
      })
    }

    // Output node (browser audio)
    nodes.push({
      id: 'output',
      label: 'Output',
      value: 'Browser',
      subValue: 'Web Audio API',
      className: '',
    })

    return nodes
  }, [song, gainInfo, classes])

  // Calculate signal path quality summary
  const pathSummary = useMemo(() => {
    if (!song) return null

    const isLossless = isLosslessFormat(song.suffix)
    const isHiRes = isHiResAudio(song.sampleRate, song.bitDepth)

    if (isHiRes) {
      return { text: 'Hi-Res Lossless Path', quality: 'hiRes' }
    } else if (isLossless) {
      return { text: 'Lossless Path', quality: 'lossless' }
    } else {
      return { text: 'Lossy Path', quality: 'lossy' }
    }
  }, [song])

  if (!song) {
    return null
  }

  return (
    <Box className={classes.container}>
      <Typography className={classes.title}>
        Signal Path
      </Typography>

      <Box className={classes.pathContainer}>
        {pathNodes.map((node, index) => (
          <React.Fragment key={node.id}>
            {index > 0 && (
              <span className={classes.arrow}>&rarr;</span>
            )}
            <Box className={`${classes.node} ${node.className}`}>
              <Typography className={classes.nodeLabel}>
                {node.label}
              </Typography>
              <Typography className={classes.nodeValue}>
                {node.value}
              </Typography>
              {node.subValue && (
                <Typography className={classes.nodeSubValue}>
                  {node.subValue}
                </Typography>
              )}
            </Box>
          </React.Fragment>
        ))}
      </Box>

      {pathSummary && (
        <Box className={classes.summary}>
          <Typography
            className={`${classes.summaryText} ${classes.summaryHighlight} ${
              pathSummary.quality === 'lossless' || pathSummary.quality === 'hiRes'
                ? classes.losslessText
                : classes.lossyText
            }`}
          >
            {pathSummary.text}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

SignalPath.propTypes = {
  song: PropTypes.object,
}

export default SignalPath
