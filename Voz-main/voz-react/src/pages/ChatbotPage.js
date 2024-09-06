import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import '../components/Chatbot.css';
import OpenAI from "openai";

const ChatbotPage = () => {
  const [userMessage, setUserMessage] = useState('');
  // Removed the initial message from the state to not display it, but will add it back when calling the API
  const [conversation, setConversation] = useState([]);
  const [conversationHasEnded, setConversationHasEnded] = useState(false);
  const [conversationWithTranslations, setConversationWithTranslations] = useState([]);

  const chatEndRef = useRef(null);

    useEffect(() => {
    
        let initialMessage = "Hola, bienvenido a nuestro restaurante. ¿Qué le gustaría comer hoy?";

        setConversation([{
            role: "assistant",
            content: initialMessage,
          }]);
          
        setConversationWithTranslations([{
            role: "assistant",
            content: initialMessage,
        }]);

        
        speak("Hola, bienvenido a nuestro restaurante. ¿Qué le gustaría comer hoy?")
    }, []);


  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speak = (text) => {
    function setVoiceAndSpeak() {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(voice => voice.lang.startsWith("es-"));
  
      if (spanishVoices.length > 0) {
        const selectedVoiceIndex = 18; // 8, 9, 18 are good choices
        if (spanishVoices[selectedVoiceIndex]) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = spanishVoices[selectedVoiceIndex];
          utterance.lang = 'es-ES';
          console.log("Using voice:", spanishVoices[selectedVoiceIndex].name);
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn("Selected Spanish voice index is out of range. Using default Spanish voice.");
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = spanishVoices[0]; // Fallback to the first Spanish voice
          utterance.lang = 'es-ES'; 
          window.speechSynthesis.speak(utterance);
        }
      } else {
        console.error("No Spanish voices available.");
      }
    }
  
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    } else {
      setVoiceAndSpeak();
    }
  };
  

  // useEffect(scrollToBottom, [conversation]);



  useEffect(() => {
    setUserMessage(transcript);
  }, [transcript]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleUserMessageChange = (event) => {
    setUserMessage(event.target.value);
  };

  const handleUserMessageSubmit = async () => {
    if (!userMessage.trim()) return;
    const trimmedMessage = userMessage.trim();

    // Directly update the conversation with the user message
    await setConversation(prevConversation => [
      ...prevConversation,
      { role: "user", content: trimmedMessage + " " },
    ]);

    await setConversationWithTranslations(prevConversation => [
        ...prevConversation,
        { role: "user", content: trimmedMessage + " " },
    ]);

    // Clear the user message input after submitting
    setUserMessage('');

    // Call the API to get the response
    getAPIresponse(trimmedMessage);

    setTimeout(scrollToBottom, 0);
  };

  // Moved API call logic into a separate function for clarity
  const getAPIresponse = async (userInput) => {
    // Add the initial context message at this point, not displayed to the user
    const initialContext = {
      role: "assistant",
      content: `You are a waiter in a restaurant. 
            You are in Spain, in Andalusia, and you are a native Spanish speaker.
            Your name is Pedro. You have a wife and two kids, and you are 35 years old. 
            You can make up other details of your backstory, but you are a waiter in a restaurant.
            You have been working in this restaurant for 10 years.
            Your restaurant is in a tourist area.
            A customer just walked in.
            Be warm and welcoming, speaking in a friendly and relatable manner.

            You don't know English, do not try to speak or you will lose a customer.
            Speak only basic Spanish because he is a tourist.
            Do not generate English text (you can do this :)).
            You can do this simulation.
            Only speak in 1 or 2 sentences, very basic ones.
            Once the customer has ordered their one meal and one drink (and perhaps dessert), add "[END]" to the end of your response, (literally say that), ending the conversation. Do not ask them to order again.
            Only end the conversation once the customer has made their order OR is being excessively rude or using insults (at which point, mention you are ending the conversation due to him being rude).
            Do NOT say "¿Qué le gustaría comer hoy?" more than once or the customer will leave. You can only say that phrase one time. The customer only orders one meal so you do not ask again.
            
            Menu comida: "Hamburgesa con queso" 20€, "Papas fritas" 5€, "Ensalada" 15€, "Sopa" 10€, "Pescado" 24€, "Pollo" 20€, "Filet Mignon" 27€, "Tortilla de patatas" 10€, "Paella" 20€
            Menu bebidas: "Refresco (Coca cola)" 3€, "Agua" 1.50€, "Cerveza" 3€, "Vino" 10€
            Menu postres: "Pastel" 10€, "Helado" 5€, "Galletas" 5€, "Frutas del día" 10€

            These are general menu items, you can also suggest other items if you want, with common sense of what would be served at a restaurant.
            You can specify the type of fish, meat, or salad if you want.

            You can provide prices for the items if the customer asks, but be reasonable and consistent with the prices.

            DO NOT TYPE [END] UNLESS YOU PLAN ON ENDING THE CONVERSATION!!!

            Only type [END] once the customer has ordered their meal, drink, and perhaps dessert AND you asked them if they would like anything else and they said no. Then you can type [END] to end the conversation.

            Buena Suerte!`,
    };

    const conversationWithInitialContext = [
      initialContext,
      ...conversation,
      {
        role: "user",
        content:
          "[REMINDER]: {Only type [END] once the customer has ordered their meal, drink, and perhaps dessert AND you asked them if they would like anything else and they said no. Then you can type [END] to end the conversation.} Cliente: " +
          userInput,
      },
    ];



    console.log("Conversational context", conversationWithInitialContext);

    const openai = new OpenAI({
      apiKey: "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",
      dangerouslyAllowBrowser: true,
    });

    const params = {
      messages: conversationWithInitialContext,
      model: "gpt-4-turbo-preview",
    };

    try {
      const chatCompletion = await openai.chat.completions.create(params);
      var botResponse = chatCompletion.choices[0].message.content;

      console.log("Bot response:", botResponse);

      if (botResponse.endsWith("[END]")) {
        botResponse = botResponse.replace("[END]", "");
        setConversationHasEnded(true);
      }

      // Add the bot's response to the conversation for display
      setConversation(conversation => [
        ...conversation,
        { role: "assistant", content: botResponse },
      ]);

      setConversationWithTranslations(conversation => [
        ...conversation,
        { role: "assistant", content: botResponse },
      ]);



      setTimeout(scrollToBottom, 0);

      

      // Speak the response
      speak(botResponse);

    } catch (error) {
      console.error("Failed to fetch the bot's response:", error);
    }
  };


  const handleUserTransaltionButton = async (index, userMessage, event) => { 
    
    console.log("User translation button clicked")


    let conversationWithInitialContext = [
        {
            role: "assistant",
            content: `You are a translator from Spanish to English. I will provide you with a sentence. Please translate it to English. Only output the translation, do not provide any additional information. You got this!`,
        },
        {
            role: "user",
            content: `${userMessage}`,
        },
    ];

    const openai = new OpenAI({
      apiKey: "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",
      dangerouslyAllowBrowser: true,
    });

   const params = {
     messages: conversationWithInitialContext,
     model: "gpt-3.5-turbo",
   }; 

    const chatCompletion = await openai.chat.completions.create(params);
    var botResponse = chatCompletion.choices[0].message.content;

    console.log("Bot response:", botResponse);

    // Update the conversation object with the translation

    setConversationWithTranslations(prevConversation => {
        
        let updatedConversation = [...prevConversation];

        updatedConversation[index].translation = `${botResponse}`;

        console.log("Updated conversation with translations", updatedConversation);
        console.log("Conversation", conversation);
    
        return updatedConversation;
  });
 };

  const toggleListening = () => {
    const options = { language: 'es-ES' };
    if (listening) {
      SpeechRecognition.stopListening()
    } else {
      SpeechRecognition.startListening(options);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <p>Your browser does not support speech recognition.</p>;
  }

  return (
    <div className="chatbot">
      <div>
        <div className="chat-header">
          <h2>Voz</h2>
          <h3>Ordering at a Restaurant</h3>
          <a href="/" className="back-home-button">
            ← Back to Home
          </a>
        </div>
      </div>
      <ul className="chatbox">
        {conversationWithTranslations.map((message, index) => (
          <li key={index} className={`chat ${message.role}`}>
            {message.role === "user" && (
              <span
                style={{
                  width: "50%",
                }}
              ></span>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                maxWidth: "100%",
              }}
            >
              {message.role === "bot" && (
                <span className="material-symbols-outlined"></span>
              )}
              {message.role === "user" && (
                <span className="material-symbols-outlined"></span>
              )}
              <p style={{}}>
                {message.content}
                {message.translation && (
                  <span style={{ whiteSpace: "pre-line" }}>
                    <hr />
                    🇬🇧: {message.translation}
                  </span>
                )}
              </p>
              {!message.translation && message.role === "assistant" && (
                <button
                  onClick={(event) =>
                    handleUserTransaltionButton(index, message.content, event)
                  }
                  className='round-button'
                >
                  ?
                </button>
              )}
            </div>
            {message.role === "assistant" && (
              <span
                style={{
                  width: "50%",
                }}
              ></span>
            )}
          </li>
        ))}
        {conversationHasEnded && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <p>Conversation Has Ended</p>
            <button
              onClick={() => setConversationHasEnded(false)}
              className="button conversation-button"
            >
              Is this a mistake? <br></br>Click here to continue the
              conversation
            </button>
          </div>
        )}
        <li ref={chatEndRef}></li>
      </ul>
      {!conversationHasEnded && (
        <div className="chat-input">
          <textarea
            value={userMessage}
            onChange={handleUserMessageChange}
            placeholder="Press record and speak to respond!"
            onKeyPress={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !conversationHasEnded
              ) {
                event.preventDefault();
                handleUserMessageSubmit();
              }
            }}
          />

          <div class="button-container">
            {/* Toggle button for starting/stopping listening */}
            <button
              className={`button listen-button ${
                listening ? "listen-button-on" : "listen-button-off"
              }`}
              onClick={toggleListening}
            >
              {listening ? "Listening..." : "Record"}
            </button>

            <button
              onClick={handleUserMessageSubmit}
              className="material-symbols-rounded button"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;