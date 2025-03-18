import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import TrackPlayer, { State } from 'react-native-track-player';

export default function Notif() {
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active') {
                await updateNotification();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    async function updateNotification() {
        const track = await TrackPlayer.getCurrentTrack();
        if (track !== null) {
            const trackObject = await TrackPlayer.getTrack(track);
            const playbackState = await TrackPlayer.getState();

            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: false,
                    shouldPlaySound: false,
                    shouldSetBadge: false,
                }),
            });

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: trackObject?.title || 'Musique en cours',
                    body: trackObject?.artist || 'Artiste inconnu',
                    sound: false,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    sticky: true, // Garde la notification persistante
                },
                trigger: null,
            });
        }
    }

    return null;
}
