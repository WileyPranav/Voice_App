import React, { useState, useEffect, useRef } from 'react';
import { generateResponse } from '../services/textInference';
import { synthesizeSpeech } from '../services/textToSpeech';
import { transcribeAudio } from '../services/speechToText';

import './VoiceAssistant.css';

function VoiceAssistant() {
  const [name, setName] = useState('');
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [introductionDone, setIntroductionDone] = useState(false);
  const [currentBotMessage, setCurrentBotMessage] = useState('');
  const audioRef = useRef(new Audio());
  const chatRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const startConversation = async () => {
    setConversationStarted(true);
    const introduction = await generateResponse("Introduce yourself very briefly in one short sentence.", true);
    await playAudioWithText(introduction);
    setIntroductionDone(true);
  };

  const startListening = () => {
    if ('MediaRecorder' in window) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const audioChunks = [];

          mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
          });

          mediaRecorder.addEventListener("stop", async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const transcript = await transcribeAudio(audioBlob);
            if (transcript.trim()) {
              handleUserInput(transcript);
            }
            setIsListening(false);
          });

          mediaRecorder.start();
          setIsListening(true);
        });
    } else {
      console.error('MediaRecorder is not supported in this browser');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const handleUserInput = async (transcript) => {
    addMessage('user', transcript);

    if (!name) {
      const nameMatch = transcript.match(/(?:my name is|I'm|I am) (\w+)/i);
      if (nameMatch) {
        setName(nameMatch[1]);
      }
    }

    await generateBotResponse(transcript);
  };

  const generateBotResponse = async (userInput = "") => {
    const aiResponse = await generateResponse(userInput);
    await playAudioWithText(aiResponse);
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  const parseMarkdown = (text) => {
    // Convert bullets
    text = text.replace(/^\s*[-*+]\s+/gm, '• ');
    
    // Convert numbered lists
    text = text.replace(/^\s*(\d+)\.\s+/gm, '$1. ');
    
    // Convert bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Convert newlines to <br>
    text = text.replace(/\n/g, '<br>');
    
    return text;
  };

  const playAudioWithText = async (text) => {
    setIsPlaying(true);
    setCurrentBotMessage('');
    addMessage('bot', text);
    const synthesizedAudioBlob = await synthesizeSpeech(text);
    if (synthesizedAudioBlob) {
      const audioUrl = URL.createObjectURL(synthesizedAudioBlob);
      audioRef.current.src = audioUrl;
      
      const words = text.split(' ');
      let currentTextLocal = '';
      
      audioRef.current.onplay = () => {
        let wordIndex = 0;
        const intervalId = setInterval(() => {
          if (wordIndex < words.length) {
            currentTextLocal += ' ' + words[wordIndex];
            setCurrentBotMessage(parseMarkdown(currentTextLocal.trim()));
            wordIndex++;
          } else {
            clearInterval(intervalId);
          }
        }, audioRef.current.duration * 1000 / words.length);
      };

      await audioRef.current.play();
    }
    setIsPlaying(false);
  };

  const cancelAndRestart = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    audioRef.current.pause();
    setIsPlaying(false);
    setIsListening(false);
    setMessages([]);
    setIntroductionDone(false);
    startConversation();
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, currentBotMessage]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!conversationStarted) {
    return (
      <div className="welcome-screen">
        <h1>Welcome to Chatty Bot!</h1>
        <button onClick={startConversation}>Start Chatting</button>
      </div>
    );
  }

  return (
    <div className="voice-assistant">
      <div className="sidebar">
        <h2>Chatty Bot</h2>
        {name && <p className="user-name">Hey, {name}! 👋</p>}
      </div>
      <div className="main-content">
        <div className="chat-header">
          <span className="chat-title">Fun Conversation</span>
          <button onClick={cancelAndRestart} className="cancel-button">
            Restart
          </button>
        </div>
        <div className="chat-container" ref={chatRef}>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.sender === 'bot' && <div className="avatar">🤖</div>}
              <div className="message-content">
                {message.sender === 'bot' ? 
                  (index === messages.length - 1 ? 
                    <div dangerouslySetInnerHTML={{ __html: currentBotMessage }} /> : 
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }} />
                  ) : 
                  message.text
                }
              </div>
              {message.sender === 'user' && <div className="avatar">😊</div>}
            </div>
          ))}
        </div>
        <div className="controls">
          <div className={`status-indicator ${isListening ? 'listening' : isPlaying ? 'playing' : ''}`}>
            {isListening ? '🎙️ Listening...' : isPlaying ? '🔊 Speaking...' : '🔇 Not listening'}
          </div>
          {introductionDone && !isListening && !isPlaying && (
            <button onClick={startListening} className="speak-button">
              🎙️ Speak
            </button>
          )}
          {isListening && (
            <button onClick={stopListening} className="stop-button">
              ⏹️ Stop Speaking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceAssistant;
