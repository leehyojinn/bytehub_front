'use client';

import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_API_KEY;

console.log(GEMINI_API_KEY);

const keywords = [
  { keyword: "인사", answer: "안녕하세요! 무엇을 도와드릴까요?" },
  { keyword: "연차", answer: "연차 신청은 근태 메뉴에서 가능합니다." },
  { keyword: "퇴근", answer: "퇴근 시간은 18:00입니다." },
  { keyword: "프로젝트", answer: "프로젝트 관련 문의는 팀장에게 연락하세요." },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "안녕하세요! 무엇을 도와드릴까요?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState("keyword"); // "keyword" or "ai"
  const chatEndRef = useRef();

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  // 키워드 검색
  function searchKeyword(userText) {
    const found = keywords.find(k =>
      userText.includes(k.keyword)
    );
    return found ? found.answer : "등록된 키워드가 없습니다. AI 검색을 이용해보세요.";
  }

  // Gemini API 호출 (axios)
  async function fetchGeminiAnswer(userText) {
    setLoading(true);
    try {
      const res = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          contents: [
            {
              parts: [{ text: userText }]
            }
          ]
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "죄송합니다, 답변을 생성하지 못했습니다.";
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: answer }
      ]);
    } catch (e) {
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: "오류가 발생했습니다. 다시 시도해 주세요." }
      ]);
    }
    setLoading(false);
  }

  // 채팅 전송
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setMessages([...messages, { from: "user", text: input }]);
    if (searchType === "keyword") {
      // 키워드 검색
      setTimeout(() => {
        setMessages(msgs => [
          ...msgs,
          { from: "bot", text: searchKeyword(input) }
        ]);
      }, 300);
    } else {
      // AI 검색
      fetchGeminiAnswer(input);
    }
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
        <span className="chatbot_fab_icon"><img style={{width:"40px", aspectRatio:"1/1"}} src="/chat.gif" alt="chatbot_img" /></span>
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
              {/* 검색 타입 셀렉트 */}
              <div className="chatbot_searchtype_row">
                <select
                  className="chatbot_searchtype_select"
                  value={searchType}
                  onChange={e => setSearchType(e.target.value)}
                  disabled={loading}
                >
                  <option value="keyword">키워드 검색</option>
                  <option value="ai">AI 검색</option>
                </select>
              </div>
              <div className="chatbot_chat_area">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chatbot_msg chatbot_msg_${msg.from}`}
                  >
                    {msg.text}
                  </div>
                ))}
                {loading && (
                  <div className="chatbot_msg chatbot_msg_bot" style={{opacity:0.6}}>AI 답변 생성중...</div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form className="chatbot_input_form" onSubmit={handleSend} autoComplete="off">
                <input
                  className="chatbot_input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={searchType === "keyword" ? "키워드를 입력하세요" : "메시지를 입력하세요"}
                  autoFocus
                  disabled={loading}
                />
                <button type="submit" className="chatbot_send_btn" disabled={loading}>전송</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
