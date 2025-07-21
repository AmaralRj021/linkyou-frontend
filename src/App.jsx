// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const STUN_SERVER = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const ws = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState('Iniciando...');
  const [localStream, setLocalStream] = useState(null);
  const [isWaitingForCall, setIsWaitingForCall] = useState(false);
  const isNegotiating = useRef(false);
  const isInitiator = useRef(false);

  const iceCandidateQueue = useRef([]);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  // useEffect 1: Captura do Vídeo Local
  useEffect(() => {
    async function startLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setConnectionStatus('Câmera e microfone prontos. Conectando ao servidor...');
      } catch (error) {
        console.error("Erro ao acessar a mídia local: ", error);
        alert("Não foi possível acessar sua câmera e microfone. Verifique as permissões do navegador.");
        setConnectionStatus('Erro ao acessar mídia.');
      }
    }
    startLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // useEffect 2: Conexão com o Servidor de Sinalização e Lógica de Mensagens
  useEffect(() => {
    if (!localStream) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket já aberto, reusando.');
        return;
    }
    if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket já conectando.');
        return;
    }

    ws.current = new WebSocket('wss://linkyou-server.onrender.com');

    ws.current.onopen = () => {
      console.log('Conectado ao servidor de sinalização.');
      setConnectionStatus('Conectado ao servidor, aguardando outro usuário...');
    };

    ws.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('Mensagem do servidor:', message.type);

      switch (message.type) {
        case 'waiting':
          setConnectionStatus('Aguardando por outro usuário...');
          setIsWaitingForCall(true);
          isInitiator.current = false;
          break;
        case 'start_call':
          setConnectionStatus(`Pareando com o usuário ${message.peerId}...`);
          setIsWaitingForCall(false);

          isInitiator.current = message.ownId < message.peerId;
          console.log(`Sou o iniciador? ${isInitiator.current} (Meu ID: ${message.ownId}, Peer ID: ${message.peerId})`);

          if (!peerConnection.current) {
            await createPeerConnection(localStream, isInitiator.current);
          } else {
              console.log("PeerConnection já existe.");
          }
          break;
        case 'offer':
          if (peerConnection.current && peerConnection.current.signalingState === 'stable' && !isNegotiating.current) {
            isNegotiating.current = true;
            try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.offer));
                while (iceCandidateQueue.current.length > 0) {
                    const candidate = iceCandidateQueue.current.shift();
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log('Candidato ICE em fila adicionado.');
                    } catch (e) {
                        console.error('Erro ao adicionar candidato ICE da fila:', e);
                    }
                }

                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                ws.current.send(JSON.stringify({ type: 'answer', answer: answer }));
                console.log('Oferta recebida e resposta enviada.');
            } catch (e) {
                console.error('Erro ao processar oferta:', e);
            } finally {
                isNegotiating.current = false;
            }
          } else {
              console.warn('Recebida oferta em estado inválido ou durante negociação.', peerConnection.current?.signalingState, 'isNegotiating:', isNegotiating.current);
          }
          break;
        case 'answer':
          if (peerConnection.current && peerConnection.current.signalingState === 'have-local-offer' && !isNegotiating.current) {
             isNegotiating.current = true;
             try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.answer));
                while (iceCandidateQueue.current.length > 0) {
                    const candidate = iceCandidateQueue.current.shift();
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log('Candidato ICE em fila adicionado.');
                    } catch (e) {
                        console.error('Erro ao adicionar candidato ICE da fila:', e);
                    }
                }
                console.log('Resposta recebida.');
            } catch (e) {
                console.error('Erro ao processar resposta:', e);
            } finally {
                isNegotiating.current = false;
            }
          } else {
              console.warn('Recebida resposta em estado inválido ou durante negociação.', peerConnection.current?.signalingState, 'isNegotiating:', isNegotiating.current);
          }
          break;
        case 'candidate':
          if (peerConnection.current) {
            if (peerConnection.current.remoteDescription) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.candidate));
                    console.log('Candidato ICE adicionado.');
                } catch (e) {
                    console.error('Erro ao adicionar candidato ICE:', e);
                }
            } else {
                console.warn('Candidato ICE recebido antes da descrição remota. Armazenando na fila...');
                iceCandidateQueue.current.push(message.candidate);
            }
          }
          break;
        case 'call_ended':
          setConnectionStatus('A chamada foi encerrada pelo outro usuário. Clique em "Próximo" para encontrar um novo.');
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
          }
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          isInitiator.current = false;
          iceCandidateQueue.current = [];
          break;
        default:
          console.warn('Tipo de mensagem desconhecido:', message.type);
      }
    };

    ws.current.onclose = () => {
      console.log('Desconectado do servidor de sinalização.');
      setConnectionStatus('Desconectado do servidor.');
    };

    ws.current.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
      setConnectionStatus('Erro na conexão com o servidor. Verifique o console.');
    };

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      iceCandidateQueue.current = [];
    };
  }, [localStream]);

  const createPeerConnection = async (stream, shouldCreateOffer) => {
    if (peerConnection.current) {
        peerConnection.current.close();
    }
    peerConnection.current = null;

    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
    }

    peerConnection.current = new RTCPeerConnection(STUN_SERVER);
    console.log("RTCPeerConnection criado.");

    stream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus('Conectado! Chamada ativa.');
        console.log('Stream remoto adicionado com sucesso!');
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        console.log('Candidato ICE enviado.');
      }
    };

    peerConnection.current.oniceconnectionstatechange = () => {
        console.log('Estado da conexão ICE:', peerConnection.current.iceConnectionState);
        if (peerConnection.current.iceConnectionState === 'disconnected' || peerConnection.current.iceConnectionState === 'failed') {
            setConnectionStatus('Conexão WebRTC perdida. Clique em "Próximo" para tentar novamente.');
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            isInitiator.current = false;
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
            iceCandidateQueue.current = [];
        } else if (peerConnection.current.iceConnectionState === 'connected') {
            setConnectionStatus('Conectado! Chamada ativa.');
        }
    };

    peerConnection.current.onnegotiationneeded = async () => {
        if (!shouldCreateOffer || peerConnection.current.localDescription) {
             console.warn('onnegotiationneeded disparado mas oferta já foi criada ou não sou o iniciador. Ignorando.', peerConnection.current.signalingState, 'shouldCreateOffer param:', shouldCreateOffer);
             return;
        }

        if (peerConnection.current.signalingState === 'stable' && !isNegotiating.current) {
            isNegotiating.current = true;
            console.log('onnegotiationneeded disparado, criando oferta (fallback)...');
            try {
                const offer = await peerConnection.current.createOffer();
                if (peerConnection.current.signalingState !== 'stable') {
                    console.warn('Estado mudou antes de setar a oferta local. Abortando negociação.');
                    return;
                }
                await peerConnection.current.setLocalDescription(offer);
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: 'offer', offer: offer }));
                    console.log('Oferta WebRTC enviada via WS (fallback).');
                }
            } catch (err) {
                console.error('Erro ao criar ou enviar oferta (fallback):', err);
            } finally {
                isNegotiating.current = false;
            }
        }
    };

    if (shouldCreateOffer) {
        try {
            isNegotiating.current = true;
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'offer', offer: offer }));
                console.log('Oferta WebRTC criada e enviada explicitamente como iniciador.');
            }
        } catch (err) {
            console.error('Erro ao criar ou enviar oferta explicitamente:', err);
        } finally {
            isNegotiating.current = false;
        }
    }
  };

  const startNewCall = async () => {
    setConnectionStatus('Buscando novo usuário...');
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
    }
    isInitiator.current = false;
    iceCandidateQueue.current = [];

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'request_new_peer' }));
        setIsWaitingForCall(true);
    } else {
        console.error("WebSocket não está pronto para enviar 'request_new_peer'");
        setConnectionStatus('Erro: WebSocket não conectado. Tente recarregar a página.');
    }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMicMuted(!track.enabled);
      });
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCamOff(!track.enabled);
      });
    }
  };

  const handleRemoteVolumeChange = (event) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = event.target.value;
    }
  };

  const toggleFullScreen = () => {
    if (remoteVideoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        remoteVideoRef.current.requestFullscreen().catch(err => {
          console.error(`Erro ao tentar tela cheia: ${err.message}`);
        });
      }
    }
  };

  return (
    <div className="app-container">
      <div className="main-content-wrapper"> {/* Novo wrapper para o conteúdo principal */}
        <div className="video-and-controls"> {/* Contém vídeos e controles */}
          <h1 className="app-title">LinkYou</h1> {/* Título do app */}
          <p className="connection-status">Status: {connectionStatus}</p>

          <div className="video-section-wrapper">
            <div className="video-wrapper">
                {/* <h2>Seu Vídeo</h2> Removido o H2 para um layout mais limpo */}
                <video id="localVideo" ref={localVideoRef} autoPlay muted playsInline></video>
                <div className="media-controls local-controls"> {/* Adicionado classe para controle local */}
                    <button onClick={toggleMic}>
                        {isMicMuted ? '🎤 Ligar' : '🔇 Mic'}
                    </button>
                    <button onClick={toggleCam}>
                        {isCamOff ? '🎥 Ligar' : '📷 Cam'}
                    </button>
                </div>
            </div>
            <div className="video-wrapper remote-video-wrapper"> {/* Adicionado classe para vídeo remoto */}
                {/* <h2>Vídeo do Outro</h2> Removido o H2 para um layout mais limpo */}
                <video id="remoteVideo" ref={remoteVideoRef} autoPlay playsInline></video>
                <div className="media-controls remote-controls"> {/* Adicionado classe para controle remoto */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue="1"
                        onChange={handleRemoteVolumeChange}
                        title="Volume do Outro"
                    />
                    <button onClick={toggleFullScreen} title="Tela Cheia">
                        [ ]
                    </button>
                    {/* Botão de Denúncia (placeholder por enquanto) */}
                    <button className="report-button" title="Denunciar Usuário">
                        🚩
                    </button>
                </div>
            </div>
          </div>
        </div>

        <div className="sidebar-controls"> {/* Nova barra lateral para o botão "Próximo" e chat */}
            <div className="next-user-section">
                <button id="nextButton" onClick={startNewCall}>Próximo Usuário</button>
            </div>
            {/* Área para o Chat (será implementado na próxima etapa) */}
            <div className="chat-section">
                <h3>Chat</h3>
                <div className="chat-messages">
                    <p>Bem-vindo ao chat!</p>
                    {/* Mensagens do chat aparecerão aqui */}
                </div>
                <input type="text" placeholder="Digite sua mensagem..." className="chat-input" />
                <button className="send-button">Enviar</button>
            </div>
        </div>
      </div> {/* Fim do main-content-wrapper */}
    </div>
  );
}

export default App;