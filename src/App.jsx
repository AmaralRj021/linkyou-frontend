// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';

// Componente para injetar os estilos CSS diretamente no DOM.
const GlobalStyles = () => (
  <style>{`
    /* src/App.css - Estilo Inspirado no Chatruletka e Chat de Texto Funcional */

    :root {
      /* Paleta Inspirada no Chatruletka (com tons da sua "Cibernético Elegante") */
      --bg-color: #121212; /* Fundo principal escuro */
      --sidebar-bg: #1e1e1e; /* Fundo da barra lateral */
      --video-bg: #000; /* Fundo para a área de vídeo sem imagem */
      --button-primary: #007bff; /* Azul vibrante para Iniciar */
      --button-primary-hover: #0056b3;
      --button-danger: #dc3545; /* Vermelho para Parar */
      --button-danger-hover: #bd2130;
      --button-secondary: #343a40; /* Botões secundários (controles de mídia, download) */
      --button-secondary-hover: #23272b;
      --text-color-light: #f8f9fa; /* Texto claro */
      --text-color-muted: #adb5bd; /* Texto secundário/status */
      --border-color: #333; /* Borda suave */
      --input-bg: #2b2b2b; /* Fundo de inputs */
      --input-text: #f8f9fa; /* Texto de inputs */
      --highlight-color: #4bc0c8; /* Cor de destaque (do seu ciano) */
      --shadow-color: rgba(0, 0, 0, 0.7);
      --button-text-color: #ffffff;
      --chat-bg: #252525;
      --primary-hover: #3ca9b3;
    }

    body {
      margin: 0;
      font-family: 'Inter', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: var(--bg-color);
      color: var(--text-color-light);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 0;
      box-sizing: border-box;
    }

    .app-container {
      background-color: var(--bg-color);
      width: 100vw;
      min-height: 100vh;
      display: flex;
      flex-direction: column; /* Mobile: empilhado */
      overflow: hidden;
    }

    .main-layout-wrapper {
      display: flex;
      flex-direction: column; /* Mobile: sidebar e vídeo empilhados */
      flex-grow: 1;
    }

    /* BARRA LATERAL ESQUERDA (SIDEBAR) */
    .sidebar-left {
      background-color: var(--sidebar-bg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 2px 0 10px var(--shadow-color);
      min-width: 280px;
      max-width: 100%;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border-color);
    }

    .app-logo-section {
      text-align: center;
      margin-bottom: 20px;
    }
    .app-logo {
        width: 80px;
        height: 80px;
        margin-bottom: 10px;
    }
    .app-title-sidebar {
      color: var(--highlight-color);
      font-size: 2.2em;
      margin: 0;
      font-weight: bold;
      text-shadow: 0 0 5px rgba(75, 192, 200, 0.7);
    }
    .users-online {
      color: #28a745;
      font-size: 0.9em;
      margin-top: 5px;
    }

    .download-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .download-btn {
      background-color: var(--button-secondary);
      color: var(--button-text-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      font-size: 0.9em;
      cursor: pointer;
      transition: background-color 0.2s ease;
      white-space: nowrap;
    }
    .download-btn:hover {
      background-color: var(--button-secondary-hover);
    }

    .local-volume-control {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-color-muted);
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .local-volume-control input[type="range"] {
      flex-grow: 1;
      -webkit-appearance: none;
      height: 6px;
      background: var(--border-color);
      border-radius: 3px;
      outline: none;
      opacity: 0.8;
      transition: opacity .2s;
    }
    .local-volume-control input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--highlight-color);
      cursor: pointer;
    }

    .main-action-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 20px;
    }
    #startButton, #stopButton {
      border: none;
      border-radius: 8px;
      padding: 15px;
      font-size: 1.2em;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.2s ease;
      color: var(--button-text-color);
    }
    #startButton {
      background-color: var(--button-primary);
    }
    #startButton:hover {
      background-color: var(--button-primary-hover);
      transform: translateY(-2px);
    }
    #stopButton {
      background-color: var(--button-danger);
    }
    #stopButton:hover {
      background-color: var(--button-danger-hover);
      transform: translateY(-2px);
    }

    .filter-sections {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .filter-button {
      background-color: var(--button-secondary);
      color: var(--text-color-light);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      font-size: 1em;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .filter-button:hover {
      background-color: var(--button-secondary-hover);
    }

    .rules-section {
      background-color: var(--input-bg);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .rules-text {
      font-size: 0.85em;
      color: var(--text-color-muted);
      line-height: 1.4;
      margin: 0;
    }
    .rules-text a {
      color: var(--highlight-color);
      text-decoration: none;
    }
    .rules-text a:hover {
      text-decoration: underline;
    }

    /* CHAT SECTION */
    .chat-section {
      background-color: var(--chat-bg);
      border-radius: 8px;
      padding: 15px;
      flex-grow: 1; /* Ocupa o espaço restante na sidebar */
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: inset 0 0 8px rgba(0,0,0,0.3);
    }
    .chat-section h3 {
      color: var(--text-color-muted);
      font-size: 0.9em;
      font-weight: normal;
      margin-top: 0;
      margin-bottom: 10px;
      text-align: left;
    }
    .chat-messages {
      flex-grow: 1;
      overflow-y: auto;
      padding-right: 5px;
      margin-bottom: 10px;
      font-size: 0.95em;
      color: var(--text-color-light);
      line-height: 1.4;
    }
    /* Estilos para mensagens de chat específicas */
    .chat-messages .chat-message.me {
        text-align: right;
        color: var(--highlight-color); /* Suas mensagens em ciano */
    }
    .chat-messages .chat-message.remote {
        text-align: left;
        color: var(--text-color-light); /* Mensagens do parceiro claras */
    }
    .chat-messages .chat-message.system {
        text-align: center;
        font-style: italic;
        font-size: 0.85em;
        color: var(--text-color-muted);
    }


    .chat-input {
      width: calc(100% - 22px); /* Ajusta largura */
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: 5px;
      background-color: var(--input-bg);
      color: var(--input-text);
      font-size: 0.9em;
      margin-bottom: 10px;
      box-sizing: border-box;
    }
    .send-button {
      background-color: var(--highlight-color);
      color: var(--button-text-color);
      border: none;
      border-radius: 5px;
      padding: 10px 15px;
      font-size: 0.9em;
      cursor: pointer;
      transition: background-color 0.2s ease;
      width: 100%;
    }
    .send-button:hover {
      background-color: var(--primary-hover);
    }


    /* ÁREA PRINCIPAL DO VÍDEO (DIREITA) */
    .video-main-area {
      flex-grow: 1; /* Ocupa o restante do espaço horizontal */
      position: relative;
      background-color: var(--video-bg);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px; /* Padding para o vídeo em mobile */
    }

    .connection-status {
      position: absolute;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      background-color: rgba(0, 0, 0, 0.6);
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 0.85em;
      color: var(--text-color-light);
      white-space: nowrap;
    }

    .remote-video-display-container {
      width: 100%;
      height: 100%;
      position: relative;
      background-color: var(--video-bg);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8px; /* Bordas arredondadas para o container do vídeo */
      overflow: hidden;
    }

    #remoteVideo {
      width: 100%;
      height: 100%;
      object-fit: contain; /* Ajusta o vídeo para caber, mostrando barras pretas se necessário */
      border-radius: 8px; /* Bordas arredondadas para o vídeo em si */
      background-color: var(--video-bg);
    }

    /* Seu vídeo menor no canto inferior direito do vídeo principal */
    #localVideo {
      position: absolute;
      bottom: 15px;
      right: 15px;
      width: 200px; /* Largura fixa */
      height: 112.5px; /* Proporção 16:9 */
      z-index: 10;
      border: 2px solid var(--highlight-color); /* Borda ciano */
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(75, 192, 200, 0.7);
      background-color: var(--video-bg);
      object-fit: cover;
    }

    /* Controles de Mídia Flutuantes sobre o vídeo principal */
    .media-controls-overlay {
      position: absolute;
      top: 15px; /* Posição no topo do vídeo principal */
      right: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 15px;
      background-color: rgba(0, 0, 0, 0.7);
      border-radius: 8px;
      z-index: 15;
    }

    .media-control-button {
        background-color: var(--button-secondary);
        color: var(--button-text-color);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 1.2em;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.2s ease;
    }
    .media-control-button:hover {
        background-color: var(--button-secondary-hover);
        transform: scale(1.1);
    }
    .media-control-button.report-button {
        background-color: var(--button-danger);
    }
    .media-control-button.report-button:hover {
        background-color: var(--button-danger-hover);
    }


    /* RESPONSIVIDADE PARA DESKTOP */
    @media (min-width: 768px) {
      .app-container {
        border-radius: 12px;
        width: 95vw;
        max-width: 1300px;
        height: 90vh;
        min-height: 600px;
        flex-direction: row; /* Desktop: sidebar e vídeo lado a lado */
      }

      .main-layout-wrapper {
        flex-direction: row;
      }

      .sidebar-left {
        min-width: 280px;
        max-width: 320px;
        height: 100%;
        border-radius: 12px 0 0 12px;
        border-right: 1px solid var(--border-color);
        box-shadow: none;
      }

      .app-logo-section {
        margin-top: 10px;
        margin-bottom: 30px;
      }
      .app-title-sidebar {
        font-size: 2.5em;
      }

      .video-main-area {
        flex-grow: 1;
        border-radius: 0 12px 12px 0;
        padding: 20px;
      }

      .remote-video-display-container {
        height: 100%;
        width: 100%;
        border-radius: 1rem;
      }

      #remoteVideo {
        object-fit: contain; /* Mantém o aspect ratio original do vídeo */
        border-radius: 1rem;
      }

      /* Seu vídeo pequeno no canto */
      #localVideo {
        bottom: 20px;
        right: 20px;
        width: 200px;
        height: 112.5px;
      }

      /* Controles de mídia sobre o vídeo principal */
      .media-controls-overlay {
        top: 20px;
        right: 20px;
        transform: none;
        left: auto;
      }
    }

    /* Ajustes para mobile (para garantir que o layout fique bom, já que o foco é desktop agora) */
    @media (max-width: 767px) {
        .sidebar-left {
            padding-bottom: 20px; /* Adiciona padding inferior para espaço */
            gap: 15px; /* Menos espaço entre seções */
            border-bottom: 1px solid var(--border-color); /* Borda para separar do vídeo */
        }
        .rules-section, .filter-sections, .download-buttons, .main-action-buttons, .local-volume-control {
            margin-bottom: 15px; /* Reduz margens inferiores para economizar espaço */
        }
        .chat-section {
            margin-top: 15px;
            min-height: 200px;
            height: auto;
        }
        .video-main-area {
            padding: 10px;
        }
        .remote-video-display-container {
            border-radius: 8px;
        }
        #remoteVideo, #localVideo {
            border-radius: 8px;
        }
        .media-controls-overlay {
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            gap: 5px;
        }
        .media-control-button {
            width: 35px;
            height: 35px;
            font-size: 1em;
        }
        .volume-slider {
            width: 60px;
        }
        /* NOVO: Ajuste para o app-title e connection-status em mobile */
        .app-title {
            position: static;
            margin: 15px 0 5px; /* Margem para separar de outros elementos */
            font-size: 2em;
        }
        .connection-status {
            position: static;
            margin-bottom: 15px;
            font-size: 0.9em;
        }

        /* Em mobile, o vídeo remoto pode ocupar a largura total e o local ficará dentro dele com object-fit: cover */
        .remote-video-display-container {
            width: 100%;
            padding-top: 56.25%; /* Mantém proporção 16:9 */
            margin-top: 15px; /* Espaço após status */
        }
        #remoteVideo {
            object-fit: cover; /* Preenche o espaço disponível, cortando se necessário */
        }
        #localVideo {
            width: 120px; /* Mini-vídeo menor em mobile */
            height: 67.5px; /* Proporção 16:9 */
            bottom: 10px;
            right: 10px;
            border-width: 1px;
            box-shadow: 0 0 5px rgba(75, 192, 200, 0.5);
        }
    }
  `}</style>
);


function App() {
  // Constantes movidas para dentro do componente para garantir o escopo correto.
  const STUN_SERVER = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };
  const WEBSOCKET_URL = 'wss://linkyou-server.onrender.com';

  // Refs para elementos e objetos que não devem causar re-renderizações
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const ws = useRef(null);
  const dataChannel = useRef(null);
  const iceCandidateQueue = useRef([]);
  const isNegotiating = useRef(false); // Previne "glare" e múltiplas negociações
  const chatMessagesRef = useRef(null);
  const isInitiator = useRef(false);

  // Estados que controlam a UI
  const [connectionStatus, setConnectionStatus] = useState('Iniciando...');
  const [localStream, setLocalStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [localVolume, setLocalVolume] = useState(1);

  // Efeito para rolar o chat para o fundo
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Efeito para obter a mídia local (câmera/microfone) - corre uma vez
  useEffect(() => {
    async function startLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setConnectionStatus('Câmera pronta. Conectando ao servidor...');
      } catch (error) {
        console.error("[ERRO] Não foi possível acessar a mídia local: ", error);
        alert("Não foi possível acessar sua câmera e microfone. Verifique as permissões do navegador e recarregue a página.");
        setConnectionStatus('Erro ao acessar mídia.');
      }
    }
    startLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efeito principal para gerir WebSocket e sinalização - corre quando localStream está pronto
  useEffect(() => {
    if (!localStream) return;

    ws.current = new WebSocket(WEBSOCKET_URL);
    console.log('[SINALIZAÇÃO] Conectando ao servidor...');

    ws.current.onopen = () => {
      console.log('[SINALIZAÇÃO] Conectado ao servidor.');
      setConnectionStatus('Conectado. Clique em "Iniciar" para encontrar um parceiro.');
    };

    ws.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log(`[SINALIZAÇÃO] Mensagem recebida: ${message.type}`, message);

      switch (message.type) {
        case 'start_call':
          setConnectionStatus(`Pareando com o usuário ${message.peerId}...`);
          // A lógica do iniciador é crucial aqui.
          isInitiator.current = message.ownId < message.peerId;
          console.log(`Sou o iniciador? ${isInitiator.current} (Meu ID: ${message.ownId}, Peer ID: ${message.peerId})`);
          createPeerConnection(isInitiator.current);
          break;
        case 'offer':
          handleOffer(message.offer);
          break;
        case 'answer':
          handleAnswer(message.answer);
          break;
        case 'candidate':
          handleCandidate(message.candidate);
          break;
        case 'call_ended':
          setConnectionStatus('O outro usuário encerrou a chamada.');
          cleanupConnection();
          break;
        default:
          console.warn('[SINALIZAÇÃO] Tipo de mensagem desconhecido:', message.type);
      }
    };

    ws.current.onclose = () => {
      console.log('[SINALIZAÇÃO] Desconectado do servidor.');
      setConnectionStatus('Desconectado. Recarregue a página para reconectar.');
      cleanupConnection();
    };

    ws.current.onerror = (error) => {
      console.error('[SINALIZAÇÃO] Erro no WebSocket:', error);
      setConnectionStatus('Erro de conexão com o servidor.');
    };

    const createPeerConnection = async (shouldCreateOffer) => {
        cleanupConnection();
        
        console.log('[WebRTC] Criando nova RTCPeerConnection...');
        peerConnection.current = new RTCPeerConnection(STUN_SERVER);
    
        localStream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, localStream);
        });
        
        if (shouldCreateOffer) {
          console.log('[WebRTC] Sou o iniciador. Criando Data Channel...');
          dataChannel.current = peerConnection.current.createDataChannel("chat");
          setupDataChannelEvents();
          
          console.log('[WebRTC] Criando oferta (offer)...');
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          console.log('[SINALIZAÇÃO] Enviando oferta...');
          ws.current.send(JSON.stringify({ type: 'offer', offer: peerConnection.current.localDescription }));
        } else {
          console.log('[WebRTC] Não sou o iniciador. Aguardando oferta e Data Channel...');
          peerConnection.current.ondatachannel = (event) => {
            dataChannel.current = event.channel;
            setupDataChannelEvents();
          };
        }

        peerConnection.current.ontrack = (event) => {
          console.log('[WebRTC] Faixa remota recebida!');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionStatus('Conectado! Chamada ativa.');
          }
        };
    
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[SINALIZAÇÃO] Enviando ICE candidate...');
            ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
          }
        };
    
        peerConnection.current.oniceconnectionstatechange = () => {
          if (peerConnection.current) {
            console.log('[ESTADO] Estado da conexão ICE:', peerConnection.current.iceConnectionState);
            if (['disconnected', 'failed', 'closed'].includes(peerConnection.current.iceConnectionState)) {
              setConnectionStatus('Conexão perdida.');
              cleanupConnection();
            }
          }
        };
      };
    
      const handleOffer = async (offer) => {
        if (!peerConnection.current) {
            console.log('[WebRTC] Recebi oferta, mas não tenho PeerConnection. Criando um como não-iniciador.');
            await createPeerConnection(false);
        }
    
        console.log('[WebRTC] Processando oferta recebida...');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        
        console.log('[WebRTC] Criando resposta (answer)...');
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        console.log('[SINALIZAÇÃO] Enviando resposta...');
        ws.current.send(JSON.stringify({ type: 'answer', answer: peerConnection.current.localDescription }));
    
        processIceCandidateQueue();
      };
    
      const handleAnswer = async (answer) => {
        if (!peerConnection.current) return console.error('[ERRO] Resposta recebida mas não há PeerConnection.');
        
        console.log('[WebRTC] Processando resposta recebida...');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        processIceCandidateQueue();
      };
    
      const handleCandidate = async (candidate) => {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
            console.log('[WebRTC] Candidato recebido cedo, guardando na fila...');
            iceCandidateQueue.current.push(candidate);
        }
      };
    
      const processIceCandidateQueue = async () => {
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          console.log('[WebRTC] Processando candidato da fila...');
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      };

    return () => {
      if (ws.current) ws.current.close();
      cleanupConnection();
    };
  }, [localStream, WEBSOCKET_URL, STUN_SERVER]);

  const cleanupConnection = () => {
    console.log('[LIMPEZA] Limpando conexão anterior.');
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    iceCandidateQueue.current = [];
    setMessages([]);
  };

  const setupDataChannelEvents = () => {
    if (!dataChannel.current) return;
    dataChannel.current.onopen = () => {
      console.log('[CHAT] Data Channel aberto!');
      setMessages([{ from: 'system', text: 'Chat conectado!' }]);
    };
    dataChannel.current.onmessage = (event) => {
      setMessages(prev => [...prev, { from: 'remote', text: event.data }]);
    };
    dataChannel.current.onclose = () => {
      console.log('[CHAT] Data Channel fechado.');
      setMessages(prev => [...prev, { from: 'system', text: 'Chat desconectado.' }]);
    };
  };
  
  const startNewCall = () => {
    setConnectionStatus('Buscando novo usuário...');
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'request_new_peer' }));
    } else {
      setConnectionStatus('Erro: Não conectado ao servidor. Recarregue a página.');
    }
  };

  const sendMessage = () => {
    const messageText = currentMessage.trim();
    if (dataChannel.current && dataChannel.current.readyState === 'open' && messageText) {
      dataChannel.current.send(messageText);
      setMessages(prev => [...prev, { from: 'me', text: messageText }]);
      setCurrentMessage('');
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
  
  const handleReportUser = () => {
      alert("Função de denúncia ainda não implementada.");
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="app-container">
        <div className="main-layout-wrapper">
          <div className="sidebar-left">
            <div className="app-logo-section">
              <img src="https://placehold.co/80x80/1e1e1e/4bc0c8?text=L" alt="Logótipo da LinkYou" className="app-logo" />
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
              <button id="stopButton" onClick={cleanupConnection}>Parar</button>
            </div>
            <div className="filter-sections">
              <button className="filter-button">País 🌍</button>
              <button className="filter-button">Eu sou 👤</button>
            </div>
            <div className="rules-section">
              <p className="rules-text">Ao clicar em "Iniciar", você concorda em seguir nossas <a href="/#" target="_blank">regras</a>.</p>
            </div>
            <div className="chat-section">
              <h3>Escreva sua mensagem aqui...</h3>
              <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((msg, index) => (
                  <p key={index} className={`chat-message ${msg.from}`}>
                    <strong>{msg.from === 'me' ? 'Você' : msg.from === 'remote' ? 'Parceiro' : 'Sistema'}:</strong> {msg.text}
                  </p>
                ))}
              </div>
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                className="chat-input"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="send-button" onClick={sendMessage}>Enviar</button>
            </div>
          </div>
          <div className="video-main-area">
            <p className="connection-status">{connectionStatus}</p>
            <div className="remote-video-display-container">
              <video id="remoteVideo" ref={remoteVideoRef} autoPlay playsInline></video>
              <video id="localVideo" ref={localVideoRef} autoPlay muted playsInline></video>
            </div>
            <div className="media-controls-overlay">
              <button onClick={toggleMic} className="media-control-button" title={isMicMuted ? 'Ligar Microfone' : 'Desligar Microfone'}>
                {isMicMuted ? '🔇' : '🎤'}
              </button>
              <button onClick={toggleCam} className="media-control-button" title={isCamOff ? 'Ligar Câmera' : 'Desligar Câmera'}>
                {isCamOff ? '🚫📷' : '📷'}
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              </button>
              <button className="report-button media-control-button" title="Denunciar Usuário" onClick={handleReportUser}>
                🚩
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
