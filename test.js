import Player from "./player";
import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";
import { document } from "postcss";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type User = {
  uid: number;
  videoTrack: any;
  expanded: boolean;
};

const VideoRoom = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [expandedVideoId, setExpandedVideoId] = useState<any | null>(null);

  const uid = Math.floor(Math.random() * 10000);
  var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  var name = "secured";

  const handleUserJoined = async (user: any, mediaType: any) => {
    if (mediaType === "video") {
      await client.subscribe(user, mediaType);
      const remoteVideoTrack = user.videoTrack;
      setUsers((previousUsers) => [
        ...previousUsers,
        {
          uid: user.uid,
          videoTrack: remoteVideoTrack,
                              audioTrack: null,

          expanded: false, // Add the "expanded" property to track video frame size
        },
      ]);
    }
  };

  const handleUserLeft = (user: any) => {
    setUsers((previousUsers) =>
      previousUsers.filter((u) => u.uid !== user.uid)
    );
  };
  const expandVideoFrame = (userId: any) => {
    setExpandedVideoId((prevExpandedVideoId: any) => {
      if (prevExpandedVideoId === userId) {
        return userId; // Clicking on the same video again, so make it smaller (null)
      } else {
        // we need a logic to make the previously expanded video smaller and get recognised under the users array and condition to render the video for normal user
        const prevExpandedUser = users.find(
          (user) => user.uid === prevExpandedVideoId
        );
        const clickedUser = users.find((user) => user.uid === userId);

        if (prevExpandedUser) {
          // Update the users array to include the previously expanded user with smaller size
          setUsers((previousUsers) =>
            previousUsers.map((user) =>
              user.uid === prevExpandedVideoId
                ? { ...user, expanded: false }
                : user
            )
          );
        }
        // Update the current user with the expanded size
        setUsers((previousUsers) =>
          previousUsers.map((user) =>
            user.uid === userId ? { ...user, expanded: true } : user
          )
        );

        if (clickedUser) {
          // Update the current user with the expanded size
          setUsers((previousUsers) =>
            previousUsers.map((user) =>
              user.uid === userId
                ? { ...user, expanded: true }
                : { ...user, expanded: false }
            )
          );
        }

        return userId; // Expand the clicked video and make the previously expanded video smaller
      }
    });
  };
  useEffect(() => {
    let tracks: any = null;

    const fetchData = async () => {
      try {
        const response = await axios.get(`${baseUrl}/access_token`, {
          params: {
            channel: name,
            uid: uid,
          },
        });
        const data = response.data;
        console.log("token", data.token);

        client.on("user-published", handleUserJoined);
        client.on("user-left", handleUserLeft);
        client
          .join(data.appId, name, data.token, uid)
          .then((uid: any) =>
          //  Promise.all([AgoraRTC.createMicrophoneAndCameraTracks(), uid])
                     Promise.all([AgoraRTC.createMicrophoneAudioTrack(), AgoraRTC.createCameraVideoTrack(), uid])

                    )
          .then(([audioTrack, videoTrack, uid]) => {
          //  const [audioTrack, videoTrack] = tracks;
          //  setLocalTracks(tracks);
                       setLocalTracks([audioTrack, videoTrack]);

                        setUsers((previousUsers: any) => [
              ...previousUsers,
              {
                uid,
                videoTrack,
                audioTrack,
              },
            ]);
         //   client.publish(tracks);
         client.publish([audioTrack, videoTrack]);
                    });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    return () => {
      for (let localTrack of localTracks) {
        localTrack.stop();
        localTrack.close();
      }
      client.off("user-published", handleUserJoined);
      client.off("user-left", handleUserLeft);
      client.unpublish(tracks).then(() => client.leave());
    };
  }, []);

  return (
    <div>
      <div className="bg-gradient-to-b from-purple-gradient-start to-purple-gradient-end h-screen">
        <div id="stream-box">
          {expandedVideoId && (
            <div className="expanded-video absolute inset-0 flex items-center justify-center">
              {users.map((user) => {
                if (user.uid === expandedVideoId) {
                  return <Player key={user.uid} user={user} />;
                }
                return null;
              })}
            </div>
          )}{" "}
        </div>
        <div className="streams-container flex justify-center h-full ">
          {users &&
            users.map((user) => (
              <div
                key={user.uid}
                id={`user-container-${user.uid}`}
                className={`relative overflow-hidden border-2 border-solid border-purple ${
                  expandedVideoId === user.uid ? "w-4/5 h-4/5" : "w-2/5 h-2/5"
                }`}
                onClick={() => expandVideoFrame(user.uid)}
              >
                {user.expanded ? (
                  <div className="expanded-video absolute inset-0 flex items-center justify-center">
                    <Player key={user.uid} user={user} />
                  </div>
                ) : (
                  <Player key={user.uid} user={user} />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
