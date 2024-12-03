import React, { useState } from "react";
import {
  Box,
  Fab,
  Paper,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

interface Message {
  text: string;
  isBot: boolean;
}

const chatbotApiEndpoint: string = import.meta.env.VITE_CHATBOT_API_ENDPOINT;

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I help you?", isBot: true },
  ]);

  const handleSend = async () => {
    console.log("sending");
    if (!message.trim()) return;
    if (waitingForResponse) return;
    if (!chatbotApiEndpoint) {
      console.error("Missing environment variable: CHATBOT_API_ENDPOINT");
    }

    setWaitingForResponse(true);
    setMessages((prev) => [
      ...prev,
      {
        text: message,
        isBot: false,
      },
    ]);

    setMessage("");

    try {
      const response = await fetch(`${chatbotApiEndpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      setMessages((prev) => [
        ...prev,
        {
          text: data,
          isBot: true,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: message,
          isBot: false,
        },
        {
          text: "Sorry, I encountered an error. Please try again later.",
          isBot: true,
        },
      ]);
    } finally {
      setWaitingForResponse(false);
    }
  };

  return (
    <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
      {isOpen ? (
        <Paper
          elevation={3}
          sx={{
            width: 350,
            height: 500,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: "primary.main",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Shop Assistant 🛒🤖</Typography>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.isBot ? "flex-start" : "flex-end",
                  maxWidth: "80%",
                  bgcolor: msg.isBot ? "grey.100" : "primary.main",
                  color: msg.isBot ? "text.primary" : "white",
                  borderRadius: 2,
                  p: 1,
                  px: 2,
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <TextField
              fullWidth
              size="small"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSend}>
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Paper>
      ) : (
        <Fab color="primary" onClick={() => setIsOpen(true)} aria-label="chat">
          <ChatIcon />
        </Fab>
      )}
    </Box>
  );
};

export default ChatBot;
