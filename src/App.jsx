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
  const [localVolume, setLocalVolume] = useState(1);

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatMessagesRef = useRef(null);
  const dataChannel = useRef(null);

  // useEffect para scrollar o chat para o final automaticamente
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);


  // useEffect 1: Captura do Vídeo Local
  useEffect(() => {
    async function startLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.volume = localVolume;
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
          setConnectionStatus('A chamada foi encerrada pelo outro usuário. Clique em "Iniciar" para encontrar um novo.');
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
          }
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          isInitiator.current = false;
          iceCandidateQueue.current = [];
          setMessages([]); // Limpa as mensagens do chat ao encerrar a chamada
          if (dataChannel.current) { // Fecha o DataChannel
              dataChannel.current.close();
              dataChannel.current = null;
          }
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
      if (dataChannel.current) { // Garante que o DataChannel seja fechado na limpeza
          dataChannel.current.close();
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
    setMessages([]); // Limpa o chat ao iniciar nova conexão P2P
    if (dataChannel.current) { // Fecha o DataChannel anterior
        dataChannel.current.close();
        dataChannel.current = null;
    }


    peerConnection.current = new RTCPeerConnection(STUN_SERVER);
    console.log("RTCPeerConnection criado.");

    stream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, stream);
    });

    // Cria o DataChannel se este peer for o iniciador
    if (shouldCreateOffer) {
        dataChannel.current = peerConnection.current.createDataChannel("chat");
        console.log("DataChannel criado como iniciador.");
        setupDataChannelEvents(dataChannel.current);
    } else {
        // Se não for o iniciador, espera o DataChannel ser recebido
        peerConnection.current.ondatachannel = (event) => {
            dataChannel.current = event.channel;
            console.log("DataChannel recebido.");
            setupDataChannelEvents(dataChannel.current);
        };
    }

    // Função para configurar os eventos do DataChannel
    const setupDataChannelEvents = (dc) => {
        dc.onopen = () => {
            console.log("DataChannel aberto!");
            setMessages(prev => [...prev, { from: 'system', text: 'Chat conectado!' }]);
        };
        dc.onmessage = (event) => {
            console.log("Mensagem DataChannel recebida:", event.data);
            setMessages(prev => [...prev, { from: 'remote', text: event.data }]);
        };
        dc.onclose = () => {
            console.log("DataChannel fechado.");
            setMessages(prev => [...prev, { from: 'system', text: 'Chat desconectado.' }]);
        };
        dc.onerror = (err) => {
            console.error("Erro no DataChannel:", err);
            setMessages(prev => [...prev, { from: 'system', text: 'Erro no chat.' }]);
        };
    };


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
            setConnectionStatus('Conexão WebRTC perdida. Clique em "Iniciar" para tentar novamente.');
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            isInitiator.current = false;
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
            if (dataChannel.current) { // Fecha DataChannel se a conexão P2P cair
                dataChannel.current.close();
                dataChannel.current = null;
            }
            iceCandidateQueue.current = [];
            setMessages([]); // Limpa chat
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
    setMessages([]); // Limpa o chat ao iniciar nova busca
    if (dataChannel.current) {
        dataChannel.current.close();
        dataChannel.current = null;
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

  const handleLocalVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setLocalVolume(newVolume);
    if (localVideoRef.current) {
      localVideoRef.current.volume = newVolume;
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

  // FUNÇÕES DE CHAT
  const handleMessageChange = (event) => {
    setCurrentMessage(event.target.value);
  };

  const sendMessage = () => {
    if (dataChannel.current && dataChannel.current.readyState === 'open' && currentMessage.trim() !== '') {
      dataChannel.current.send(currentMessage.trim());
      setMessages(prev => [...prev, { from: 'me', text: currentMessage.trim() }]);
      setCurrentMessage(''); // Limpa o input
    } else {
        console.warn("DataChannel não está aberto para enviar mensagem ou mensagem vazia.");
        if (currentMessage.trim() !== '') { // Se a mensagem não está vazia, mas o chat não está aberto
            setMessages(prev => [...prev, { from: 'system', text: 'Chat não conectado. Tente iniciar uma chamada.' }]);
            setCurrentMessage('');
        }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="app-container">
      <div className="main-layout-wrapper">

        {/* BARRA LATERAL ESQUERDA (SIDEBAR) */}
        <div className="sidebar-left">
          <div className="app-logo-section">
            <img src="/linkyou_logo.png" alt="LinkYou Logo" className="app-logo" />
            <h1 className="app-title-sidebar">LinkYou</h1>
            <p className="users-online">427.816 usuários online</p>
          </div>

          <div className="download-buttons">
            <button className="download-btn">DISPONÍVEL NO <br/> Google Play</button>
            <button className="download-btn">Descarregar na <br/> App Store</button>
          </div>

          <div className="local-volume-control">
              <span className="volume-icon">🔊</span> Volume Local:
              <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localVolume}
                  onChange={handleLocalVolumeChange}
                  title="Volume Local"
              />
          </div>

          <div className="main-action-buttons">
            <button id="startButton" onClick={startNewCall}>Iniciar</button>
            <button id="stopButton">Parar</button>
          </div>

          <div className="filter-sections">
            <button className="filter-button">País 🌍</button>
            <button className="filter-button">Eu sou 👤</button>
          </div>

          <div className="rules-section">
            <p className="rules-text">Ao clicar em "Iniciar", você concorda em seguir nossas <a href="#" target="_blank">regras</a>. Qualquer violação resultará na suspensão da conta. Certifique-se de que seu rosto esteja claramente visível para o interlocutor.</p>
          </div>

          {/* Área de Chat */}
          <div className="chat-section">
            <h3>Escreva sua mensagem aqui e pressi...</h3>
            <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((msg, index) => (
                    <p key={index} className={`chat-message ${msg.from}`}>
                        {msg.from === 'me' ? 'Você: ' : msg.from === 'remote' ? 'Parceiro: ' : ''}
                        {msg.text}
                    </p>
                ))}
            </div>
            <input
                type="text"
                placeholder="Digite sua mensagem..."
                className="chat-input"
                value={currentMessage}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
            />
            <button className="send-button" onClick={sendMessage}>Enviar</button>
          </div>
        </div>

        {/* ÁREA PRINCIPAL DO VÍDEO (DIREITA) */}
        <div className="video-main-area">
          <p className="connection-status">{connectionStatus}</p>

          <div className="remote-video-display-container">
            <video id="remoteVideo" ref={remoteVideoRef} autoPlay playsInline></video>
            <video id="localVideo" ref={localVideoRef} autoPlay muted playsInline></video>
          </div>

          {/* Controles de Mídia Flutuantes sobre o vídeo principal */}
          <div className="media-controls-overlay">
              <button onClick={toggleMic} className="media-control-button" title={isMicMuted ? 'Ligar Microfone' : 'Desligar Microfone'}>
                  {isMicMuted ? '🔇' : '🎤'}
              </button>
              <button onClick={toggleCam} className="media-control-button" title={isCamOff ? 'Ligar Câmera' : 'Desligar Câmera'}>
                  {isCamOff ? '🎥' : '📷'}
              </button>
              <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  defaultValue="1"
                  onChange={handleRemoteVolumeChange}
                  title="Volume do Outro"
                  className="volume-slider"
              />
              <button onClick={toggleFullScreen} title="Tela Cheia" className="media-control-button">
                  [ ]
              </button>
              <button className="report-button media-control-button" title="Denunciar Usuário">
                  🚩
              </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;