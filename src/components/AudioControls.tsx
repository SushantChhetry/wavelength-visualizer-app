import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paper,
  Button,
  Slider,
  Text,
  Stack,
  Group,
  Alert,
  Badge,
} from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconVolume } from '@tabler/icons-react';
import { Loader } from './Loader';
import './AudioControls.css';

interface AudioControlsProps {
  onFileUpload: (file: File) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loadedFileName: string | null;
  isLoading: boolean;
  error: string | null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioControls({
  onFileUpload,
  onPlayPause,
  onStop,
  onSeek,
  onVolumeChange,
  isPlaying,
  currentTime,
  duration,
  volume,
  loadedFileName,
  isLoading,
  error,
}: AudioControlsProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = (files: FileWithPath[]) => {
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleSeekChange = (value: number) => {
    onSeek(value);
  };

  return (
    <motion.div
      className="audio-controls-container"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <Paper
        p="md"
        className="audio-controls-paper"
      >
        <Stack gap="md">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Text size="xl" fw={700} className="controls-title">
              Wavelength Visualizer
            </Text>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert color="red" title="Error" className="error-alert">
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Dropzone
              onDrop={handleDrop}
              onReject={() => {}}
              accept={['audio/*']}
              loading={isLoading}
              onDragEnter={() => setIsDragActive(true)}
              onDragLeave={() => setIsDragActive(false)}
              className={`audio-dropzone ${isDragActive ? 'drag-active' : ''}`}
            >
              <Stack align="center" gap="xs">
                {isLoading ? (
                  <Loader variant="spinner" size="medium" />
                ) : (
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <IconUpload size={32} className="upload-icon" />
                  </motion.div>
                )}
                <Text size="sm" ta="center" className="dropzone-text">
                  {isLoading ? 'Loading audio...' : 'Drag audio file here or click to select'}
                </Text>
                {loadedFileName && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Badge color="cyan" variant="light" className="file-badge">
                      {loadedFileName}
                    </Badge>
                  </motion.div>
                )}
              </Stack>
            </Dropzone>
          </motion.div>

          <AnimatePresence>
            {loadedFileName && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Stack gap="md">
                  <Group gap="xs">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                        onClick={onPlayPause}
                        disabled={!loadedFileName}
                        className="play-button"
                        variant="gradient"
                        gradient={{ from: '#00ffff', to: '#00cccc', deg: 135 }}
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        leftSection={<IconPlayerStop size={16} />}
                        onClick={onStop}
                        disabled={!loadedFileName}
                        variant="outline"
                        className="stop-button"
                      >
                        Stop
                      </Button>
                    </motion.div>
                  </Group>

                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" className="time-text">{formatTime(currentTime)}</Text>
                      <Text size="sm" className="time-text">{formatTime(duration)}</Text>
                    </Group>
                    <Slider
                      value={duration > 0 ? (currentTime / duration) * 100 : 0}
                      onChange={(value) => handleSeekChange((value / 100) * duration)}
                      disabled={!loadedFileName || duration === 0}
                      label={(value) => formatTime((value / 100) * duration)}
                      className="seek-slider"
                      color="cyan"
                    />
                  </Stack>

                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconVolume size={16} className="volume-icon" />
                      <Text size="sm" style={{ flex: 1 }} className="volume-text">
                        Volume: {Math.round(volume * 100)}%
                      </Text>
                    </Group>
                    <Slider
                      value={volume * 100}
                      onChange={(value) => onVolumeChange(value / 100)}
                      min={0}
                      max={100}
                      label={(value) => `${value}%`}
                      className="volume-slider"
                      color="cyan"
                    />
                  </Stack>
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </Paper>
    </motion.div>
  );
}

