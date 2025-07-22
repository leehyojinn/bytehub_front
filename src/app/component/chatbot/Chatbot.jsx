'use client';

import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "안녕하세요! 무엇을 도와드릴까요?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState("keyword");
  const chatEndRef = useRef();
  const [keywords, setKeywords] = useState([]);
  const [faqList, setFaqList] = useState([]);
  const [meetingList, setMeetingList] = useState([]);
  const [myInfo, setMyInfo] = useState([]);
  const [cloudInfo, setCloudInfo] = useState([]);

  // 키워드 목록 불러오기
  async function keyword_list() {
    let { data } = await axios.post(`${api_url}/keyword/list`);
    const list = data.list.filter((list) => list.status == 0);
    setKeywords(list);
  }

  // FAQ 전체 불러오기
  async function fetchFAQList() {
    const { data } = await axios.post(`${api_url}/keyword/faq/list`, {});
    setFaqList(data.list || []);
  }

  async function MeetingBoardList() {
    let {data} = await axios.post(`${api_url}/board/allList`);
    console.log(data);
    setMeetingList(data.list || []);
  }

  async function myInfoList() {
    const token = sessionStorage.getItem('token');
    let {data} = await axios.get(`${api_url}/mypage/info`,{
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }});
      setMyInfo(data.data);
  }

  async function cloudList() {
    let {data} = await axios.post(`${api_url}/colud/allList`);
    console.log(data);
    setCloudInfo(data);
  }

  useEffect(() => {
    keyword_list();
    fetchFAQList();
    MeetingBoardList();
    myInfoList();
    cloudList();
  }, []);

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
    return found ? found.response : "등록된 키워드가 없습니다. AI 검색을 이용해보세요.";
  }

  // Gemini + FAQ JSON 포함, 그리고 FAQ insert
  async function fetchGeminiWithFAQJson(userText) {
    setLoading(true);
    try {
      const faqJson = JSON.stringify(faqList, null, 2);
      const prompt = `
      다음은 자주 묻는 질문(FAQ) 목록입니다.
      아래 JSON 데이터를 참고해서, 사용자의 요청에 가장 적합한 답변을 안내해줘.
      목록을 전체 보여줘야해.

      [FAQ 목록]
      ${faqJson}

      [사용자 요청]
      ${userText}
      `.trim();

      const res = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          contents: [
            { parts: [{ text: prompt }] }
          ]
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "FAQ 안내에 실패했습니다.";

      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: answer }
      ]);

      // FAQ insert (질문/답변 저장)
      await axios.post(`${api_url}/keyword/faq/insert`, {
        question: userText,
        answer: answer
      });
    } catch (e) {
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: "FAQ AI 안내 중 오류가 발생했습니다." }
      ]);
    }
    setLoading(false);
  }

  async function fetchGeminiWithMeetingJson(userText) {
    setLoading(true);
    try {
      const meetingJson = JSON.stringify(meetingList, null, 2);
      const prompt = `
      다음은 회의록 목록입니다.
      내 ${myInfo} 정보 포함된 회의록에서
      아래 JSON 데이터를 참고해서, 사용자의 요청에 가장 적합한 답변을 안내해줘.
      목록을 전체 보여줘야해.

      [게시판 목록]
      ${meetingJson}

      [사용자 요청]
      ${userText}
      `.trim();

      const res = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          contents: [
            { parts: [{ text: prompt }] }
          ]
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "게시판 안내에 실패했습니다.";

      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: answer }
      ]);

      // FAQ insert (질문/답변 저장)
      await axios.post(`${api_url}/keyword/faq/insert`, {
        question: userText,
        answer: answer
      });
    } catch (e) {
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: "게시판 AI 안내 중 오류가 발생했습니다." }
      ]);
    }
    setLoading(false);
  }

  async function fetchGeminiWithCloudJson(userText) {
    setLoading(true);
    try {
      const cloudJson = JSON.stringify(cloudInfo, null, 2);
      const prompt = `
      다음은 클라우드 및 링크 목록입니다.
      내 ${myInfo} 정보 포함된 클라우드 및 링크에서
      아래 JSON 데이터를 참고해서, 사용자의 요청에 가장 적합한 답변을 안내해줘.
      목록을 전체 보여줘야해.

      [클라우드 및 링크 목록]
      ${cloudJson}

      [사용자 요청]
      ${userText}
      `.trim();

      const res = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          contents: [
            { parts: [{ text: prompt }] }
          ]
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "클라우드 안내에 실패했습니다.";

      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: answer }
      ]);

      // FAQ insert (질문/답변 저장)
      await axios.post(`${api_url}/keyword/faq/insert`, {
        question: userText,
        answer: answer
      });
    } catch (e) {
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: "클라우드 AI 안내 중 오류가 발생했습니다." }
      ]);
    }
    setLoading(false);
  }

  // Gemini 일반 AI 검색 + FAQ insert
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
      // FAQ insert (질문/답변 저장)
      await axios.post(`${api_url}/keyword/faq/insert`, {
        question: userText,
        answer: answer
      });
    } catch (e) {
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: "오류가 발생했습니다. 다시 시도해 주세요." }
      ]);
    }
    setLoading(false);
  }

  const normalized = input.replace(/\s/g, '').toLowerCase();

  // 채팅 전송
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setMessages([...messages, { from: "user", text: input }]);

    // "자주묻는 질문" 입력 시 FAQ JSON 전체를 AI에 넘기고 insert
    if (normalized.includes("자주묻는질문")) {
      await fetchGeminiWithFAQJson(input);
      setInput("");
      return;
    }

    if(normalized.includes("클라우드") || normalized.includes("링크")){
      await fetchGeminiWithCloudJson(input);
      setInput("");
      return;
    }

    if(normalized.includes("회의록")){
      await fetchGeminiWithMeetingJson(input);
      setInput("");
      return;
    }

    if (searchType === "keyword") {
      setTimeout(() => {
        setMessages(msgs => [
          ...msgs,
          { from: "bot", text: searchKeyword(input) }
        ]);
      }, 300);
    } else {
      await fetchGeminiAnswer(input);
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
        <span className="chatbot_fab_icon"><img style={{ width: "40px", aspectRatio: "1/1" }} src="/chat.gif" alt="chatbot_img" /></span>
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
                  <div className="chatbot_msg chatbot_msg_bot" style={{ opacity: 0.6 }}>AI 답변 생성중...</div>
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
