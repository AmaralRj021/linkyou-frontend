let peerConnection;
let localStream;
let remoteVideo = document.getElementById('remoteVideo');
let localVideo = document.getElementById('localVideo');

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;

    socket.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'start_call':
          if (!peerConnection) createPeerConnection();
          if (data.ownId < data.peerId) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: 'offer', offer }));
          }
          break;

        case 'offer':
          if (!peerConnection) createPeerConnection();
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.send(JSON.stringify({ type: 'answer', answer }));
          break;

        case 'answer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          break;

        case 'ice_candidate':
          if (data.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
          break;

        case 'call_ended':
          endCall();
          break;
      }
    });

  }).catch(error => {
    console.error('Erro ao acessar câmera/microfone:', error);
  });

function createPeerConnection() {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: 'ice_candidate', candidate: event.candidate }));
    }
  };

  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === 'disconnected') {
      endCall();
    }
  };
}

function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  remoteVideo.srcObject = null;
}
