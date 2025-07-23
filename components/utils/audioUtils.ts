// Audio processing utilities for timeline editor

export interface AudioProcessingResult {
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
}

export interface AudioFileInfo {
  path: string;
  trackId: string;
  color: string;
}

/**
 * Process raw audio file (.raw, .pcm) with hardcoded parameters
 */
export const processRawAudioFile = async (
  file: File,
  arrayBuffer: ArrayBuffer
): Promise<AudioProcessingResult> => {
  console.log(`🔄 Processing RAW audio file: ${file.name} (${arrayBuffer.byteLength} bytes)`);

  // Hardcoded parameters for raw audio processing
  const sampleRate = 44100;
  const channels = 1; // Mono
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;

  console.log(`📊 RAW format: ${sampleRate}Hz, ${channels} channel(s), ${bitDepth}-bit`);

  // Create audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Calculate expected sample count
  const expectedSamples = arrayBuffer.byteLength / bytesPerSample;
  const duration = expectedSamples / sampleRate;

  console.log(`⏱️ Expected duration: ${duration.toFixed(2)}s (${expectedSamples} samples)`);

  // Create audio buffer
  const audioBuffer = audioContext.createBuffer(channels, expectedSamples, sampleRate);

  // Convert raw bytes to float samples
  const int16Array = new Int16Array(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);

  // Convert from Int16 to Float32 (normalize to -1.0 to 1.0 range)
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0; // 32768 = 2^15 (max value for 16-bit signed)
  }

  console.log(`✅ RAW audio processed: ${duration.toFixed(2)}s, ${channels} channel(s), ${sampleRate}Hz`);

  return { audioBuffer, audioContext };
};

/**
 * Generate high-quality waveform data from audio buffer
 */
export const generateWaveformData = (
  audioBuffer: AudioBuffer,
  targetSamples: number = 1000
): Float32Array => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const duration = audioBuffer.duration;
  
  // Downsample for waveform visualization (target ~500-1000 points)
  const actualTargetSamples = Math.min(targetSamples, Math.max(500, Math.floor(duration * 20)));
  const blockSize = Math.floor(channelData.length / actualTargetSamples);
  const waveformData = new Float32Array(actualTargetSamples);
  
  // Calculate RMS values for each block for better visualization
  for (let i = 0; i < actualTargetSamples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    
    waveformData[i] = Math.sqrt(sum / (end - start));
  }
  
  return waveformData;
};

/**
 * Load default audio files with predefined configuration
 */
export const getDefaultAudioFiles = (): AudioFileInfo[] => {
  return [
    { path: './Roni.wav', trackId: 'track-1', color: '#E961FF' },
    { path: './Ingrid.wav', trackId: 'track-2', color: '#4CAF50' }
  ];
};

/**
 * Load audio file from URL and decode it
 */
export const loadAudioFromUrl = async (url: string): Promise<AudioProcessingResult> => {
  console.log(`🎵 Loading audio from URL: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  console.log(`✅ Audio loaded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz`);
  
  return { audioBuffer, audioContext };
};

/**
 * Check if a file is a supported audio type
 */
export const isAudioFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const isRawFile = fileName.endsWith('.raw') || fileName.endsWith('.pcm');
  const isWavFile = fileName.endsWith('.wav');
  const isStandardAudio = file.type.startsWith('audio/') || isWavFile;
  
  return isStandardAudio || isRawFile;
};

/**
 * Get file type label for logging
 */
export const getFileTypeLabel = (file: File): string => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.raw') || fileName.endsWith('.pcm')) return 'RAW';
  if (fileName.endsWith('.wav')) return 'WAV';
  if (file.type.includes('mp3')) return 'MP3';
  if (file.type.includes('flac')) return 'FLAC';
  if (file.type.includes('ogg')) return 'OGG';
  
  return 'AUDIO';
};

/**
 * Get cycling track colors for new tracks
 */
export const getTrackColors = (): string[] => {
  return [
    '#E961FF', '#4CAF50', '#FF9800', '#2196F3', '#F44336', 
    '#9C27B0', '#00BCD4', '#FFEB3B', '#795548', '#607D8B'
  ];
}; 