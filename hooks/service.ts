import TrackPlayer, { Event, Capability, RepeatMode } from 'react-native-track-player';

export async function setupPlayer() {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
        stopWithApp: false,
        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious],
    });

    await TrackPlayer.setRepeatMode(RepeatMode.Queue);
}

export function registerPlaybackService() {
    TrackPlayer.registerPlaybackService(() => async () => {
        TrackPlayer.addEventListener(Event.RemotePlay, () => {
            TrackPlayer.play();
        });

        TrackPlayer.addEventListener(Event.RemotePause, () => {
            TrackPlayer.pause();
        });

        TrackPlayer.addEventListener(Event.RemoteNext, () => {
            TrackPlayer.skipToNext();
        });

        TrackPlayer.addEventListener(Event.RemotePrevious, () => {
            TrackPlayer.skipToPrevious();
        });
    });
}
