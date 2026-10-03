import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, DANGER, SUCCESS } from '@/components/ui/primitives';
import { Spacing } from '@/constants/theme';
import { authApi } from '@/lib/supabase';

export const VIDEO_SECONDS = 30;

type Props = {
  label: string;
  tripId?: string;
  type?: 'before' | 'after';
  driverId?: string | null;
  onDone: (videoUri: string | null) => void;
};

/**
 * Records the mandatory 30-sec car condition video with the device camera
 * and uploads it directly to Cloudflare R2 storage.
 */
export function CarVideoRecorder({
  label,
  tripId = 'quickdriver-demo',
  type = 'before',
  driverId,
  onDone,
}: Props) {
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [left, setLeft] = useState(VIDEO_SECONDS);
  const camera = useRef<CameraView>(null);

  const isWeb = Platform.OS === 'web';

  const handleFinishRecording = async (uri: string | null) => {
    setRecording(false);
    setUploading(true);

    try {
      const uploadRes = await authApi.uploadInspectionVideo(tripId, type, uri, driverId);
      setUploadSuccess(true);
      setTimeout(() => {
        onDone(uploadRes.video_url);
      }, 1000);
    } catch (err) {
      console.warn('R2 video upload warning:', err);
      // Fallback for offline/demo: proceed with local URI
      onDone(uri);
    } finally {
      setUploading(false);
    }
  };

  // Countdown display while recording (native recording auto-stops via maxDuration).
  useEffect(() => {
    if (!recording) return;
    const tickMs = isWeb ? 200 : 1000; // web fallback is simulated at 5× speed
    const interval = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(interval);
          if (isWeb) handleFinishRecording(null);
          return 0;
        }
        return l - 1;
      });
    }, tickMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const start = async () => {
    if (isWeb) {
      setRecording(true);
      return;
    }
    const cam = camPerm?.granted ? camPerm : await requestCamPerm();
    const mic = micPerm?.granted ? micPerm : await requestMicPerm();
    if (!cam?.granted || !mic?.granted) return;

    setRecording(true);
    setLeft(VIDEO_SECONDS);
    try {
      const video = await camera.current?.recordAsync({ maxDuration: VIDEO_SECONDS });
      await handleFinishRecording(video?.uri ?? null);
    } catch {
      // Recording fallback (e.g. simulator without camera)
      await handleFinishRecording(null);
    }
  };

  const permissionDenied =
    !isWeb &&
    ((camPerm && !camPerm.granted && !camPerm.canAskAgain) ||
      (micPerm && !micPerm.granted && !micPerm.canAskAgain));

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold" style={styles.center}>
        🎥 {label}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Walk around the car and capture all four sides, tyres and interiors. This protects you and
        the customer in any damage dispute.
      </ThemedText>

      {uploading && (
        <View style={styles.uploadingBox}>
          <ActivityIndicator color={DANGER} size="large" />
          <ThemedText type="smallBold" style={styles.center}>
            Uploading 30-sec inspection to Cloudflare R2...
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Securing immutable video proof for dispute protection.
          </ThemedText>
        </View>
      )}

      {uploadSuccess && (
        <View style={styles.successBox}>
          <ThemedText style={{ fontSize: 32 }}>🛡️</ThemedText>
          <ThemedText type="smallBold" style={{ color: SUCCESS }}>
            Inspection video secured in Cloudflare R2!
          </ThemedText>
        </View>
      )}

      {!isWeb && recording && !uploading && (
        <View style={styles.cameraWrap}>
          <CameraView ref={camera} style={styles.camera} mode="video" facing="back" />
          <View style={styles.recBadge}>
            <ThemedText type="smallBold" style={styles.recText}>
              ● REC 0:{String(left).padStart(2, '0')}
            </ThemedText>
          </View>
        </View>
      )}

      {isWeb && recording && !uploading && (
        <ThemedText type="subtitle" style={{ color: DANGER }}>
          ● 0:{String(left).padStart(2, '0')}
        </ThemedText>
      )}

      {recording && !uploading && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((VIDEO_SECONDS - left) / VIDEO_SECONDS) * 100}%` },
            ]}
          />
        </View>
      )}

      {!recording && !uploading && !uploadSuccess && (
        <>
          {permissionDenied ? (
            <ThemedText type="small" style={{ color: DANGER }}>
              Camera or microphone access is blocked. Enable both in your phone Settings to record the
              mandatory video.
            </ThemedText>
          ) : (
            <Button title="Start 30-sec recording" onPress={start} />
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  cameraWrap: {
    alignSelf: 'stretch',
    height: 320,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  recBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: 'rgba(12,17,28,0.7)',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  recText: {
    color: '#FF5C5C',
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: DANGER,
  },
  uploadingBox: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  successBox: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
});
