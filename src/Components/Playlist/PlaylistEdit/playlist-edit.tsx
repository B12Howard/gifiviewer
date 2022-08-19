import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../../../db';
import { IPlaylist } from '../../../Models/playlist';
import { IPlaylistRecord, PlaylistRecord } from '../../../Models/record';

interface Props {
    editPlaylist: IPlaylist | undefined;
    playlist: IPlaylist | undefined;
    setEditPlaylist: any;
}

const usePlaylistEdit = ({ editPlaylist, setEditPlaylist, playlist }: Props) => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('');
    const [playlistOrder, setPlaylistOrder] = useState<IPlaylistRecord[] | undefined>(undefined);
    const myPlaylists = useLiveQuery(() => db.playlists.toArray());

    useEffect(() => {
        setPlaylistOrder(editPlaylist?.record);
    }, [editPlaylist]);

    function getPlaylists() {
        return myPlaylists;
    }

    async function addGif(playlist: IPlaylist, url: string) {
        if (!playlist.id) return;
        if (!url) return;

        try {
            const id = playlist.id;
            const record = new PlaylistRecord(url);

            await db.playlists
                .where('id')
                .equals(playlist.id)
                .modify((playlist: IPlaylist) => (playlist.record ? playlist.record.push(record) : null));

            await refresh(id);

            setUrl('');
        } catch (error) {
            setStatus(`Failed to add ${playlist.name}: ${error}`);
        }
    }

    async function saveOrder(playlistOrder: IPlaylistRecord[], playlist: IPlaylist) {
        if (!playlist.id) return;
        if (!playlistOrder) return;

        try {
            convertToBlob(playlistOrder).then(async () => {
                if (!playlist.id) return;
                await db.playlists
                    .where('id')
                    .equals(playlist.id)
                    .modify((playlist: IPlaylist) => (playlist.record = [...playlistOrder]));
            });
        } catch (error) {
            setStatus(`Failed to update playlist order: ${error}`);
        }
    }

    async function deleteRecord(deletedIndex: number) {
        if (!editPlaylist || !editPlaylist?.id) return;
        if (!playlistOrder) return;

        const copyPlaylist = playlistOrder.filter((element, index) => index !== deletedIndex);
        try {
            await db.playlists
                .where('id')
                .equals(editPlaylist.id)
                .modify((playlist: IPlaylist) => (playlist.record = copyPlaylist));

            await refresh(editPlaylist.id);
        } catch (error) {
            setStatus(`Failed to delete`);
        }
    }

    async function refresh(id: number) {
        await db.playlists
            .where('id')
            .equals(id)
            .toArray()
            .then((x) => {
                if (!x.length) return;
                setEditPlaylist(x[0]);
            });
    }

    async function convertToBlob(playlistOrder: IPlaylistRecord[]) {
        for (let element of playlistOrder) {
            try {
                if (!element.blob) {
                    const res = await fetch(element.url);
                    const blob: Blob = await res.blob();

                    if (blob) {
                        element['blob'] = blob;
                    }
                }
            } catch (error) {}
        }
    }

    return {
        addGif,
        status,
        setStatus,
        url,
        setUrl,
        saveOrder,
        playlistOrder,
        setPlaylistOrder,
        deleteRecord,
        getPlaylists,
    };
};

export default usePlaylistEdit;
