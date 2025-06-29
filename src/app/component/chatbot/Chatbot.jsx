'use client';

import React, { useRef, useEffect, useState } from "react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "안녕하세요! 무엇을 도와드릴까요?" }
  ]);
  const chatEndRef = useRef();

  // 채팅 스크롤 항상 아래로
  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  // 채팅 전송
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    // 실제 챗봇 연동 대신 예시 답변
    setTimeout(() => {
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: "AI 답변 예시: " + input }
      ]);
    }, 800);
    setInput("");
  };

  return (
    <>
      {/* 챗봇 버튼 */}
      <div
        className={`chatbot_fab${hover ? " chatbot_fab_hover" : ""}${open ? " chatbot_fab_open" : ""}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setOpen(true)}
        tabIndex={0}
        aria-label="챗봇 열기"
      >
        <span className="chatbot_fab_icon">🤖</span>
        <span className={`chatbot_fab_text${hover ? " show" : " dis_none"}`}>챗봇 상담</span>
      </div>
      {/* 챗봇 모달 */}
      {open && (
        <div className="chatbot_modal_overlay" onClick={() => setOpen(false)}>
          <div className="chatbot_modal" onClick={e => e.stopPropagation()}>
            <div className="chatbot_modal_header">
              <span>AI 챗봇 상담</span>
              <button className="chatbot_modal_close" onClick={() => setOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="chatbot_modal_body">
              <div className="chatbot_chat_area">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chatbot_msg chatbot_msg_${msg.from}`}
                  >
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form className="chatbot_input_form" onSubmit={handleSend} autoComplete="off">
                <input
                  className="chatbot_input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="메시지를 입력하세요"
                  autoFocus
                />
                <button type="submit" className="chatbot_send_btn">전송</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
