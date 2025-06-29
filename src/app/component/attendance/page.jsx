'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useEffect, useRef, useState } from "react";

const ATTENDANCE_STANDARD = "09:00";
const OTP_VALID_MINUTES = 10;
const LOGS_PER_PAGE = 10;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function parseTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal_overlay">
      <div className="modal_content">
        <button className="modal_close" onClick={onClose} aria-label="닫기">×</button>
        {children}
      </div>
    </div>
  );
}

export default function Attendance() {
  const [otpIn, setOtpIn] = useState("");
  const [otpOut, setOtpOut] = useState("");
  const [expireIn, setExpireIn] = useState(null);
  const [expireOut, setExpireOut] = useState(null);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState("in"); 

  const [logs, setLogs] = useState([
    { date: "2025-06-28", type: "출근", time: "09:10", status: "정상" },
    { date: "2025-06-28", type: "퇴근", time: "18:03", status: "정상" },
    { date: "2025-06-27", type: "출근", time: "09:24", status: "지각" },
    { date: "2025-06-27", type: "퇴근", time: "18:12", status: "정상" },
    { date: "2025-06-26", type: "출근", time: "09:01", status: "정상" },
    { date: "2025-06-26", type: "퇴근", time: "18:00", status: "정상" },
    { date: "2025-06-25", type: "출근", time: "09:15", status: "정상" },
    { date: "2025-06-25", type: "퇴근", time: "18:02", status: "정상" },
    { date: "2025-06-24", type: "출근", time: "09:30", status: "지각" },
    { date: "2025-06-24", type: "퇴근", time: "18:07", status: "정상" },
    { date: "2025-06-23", type: "출근", time: "09:05", status: "정상" },
    { date: "2025-06-23", type: "퇴근", time: "18:11", status: "정상" },
  ]);
  const [usedOtpIn, setUsedOtpIn] = useState(false);
  const [usedOtpOut, setUsedOtpOut] = useState(false);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);

  const [remain, setRemain] = useState(0);
  const timerRef = useRef();

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    createOtps();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msToMidnight = midnight - new Date();
    const midnightTimer = setTimeout(() => window.location.reload(), msToMidnight);
    return () => clearTimeout(midnightTimer);
  }, []);

  useEffect(() => {
    timerRef.current && clearInterval(timerRef.current);
    if (expireIn && expireOut) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const remainIn = Math.max(0, Math.floor((expireIn - now) / 1000));
        const remainOut = Math.max(0, Math.floor((expireOut - now) / 1000));
        setRemain(mode === "in" ? remainIn : remainOut);
        if (remainIn === 0 || remainOut === 0) createOtps();
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [expireIn, expireOut, mode]);

  function createOtps() {
    const now = new Date();
    const expire = new Date(now.getTime() + OTP_VALID_MINUTES * 60000);
    setOtpIn(generateOtp());
    setOtpOut(generateOtp());
    setExpireIn(expire);
    setExpireOut(expire);
    setUsedOtpIn(false);
    setUsedOtpOut(false);
    setInput("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const now = new Date();
    if (mode === "in") {
      if (usedOtpIn) return alert("이미 출근 처리됨");
      if (input !== otpIn) return alert("출근 인증번호가 일치하지 않습니다.");
      if (now > expireIn) return alert("인증번호가 만료되었습니다. 새로고침 후 시도하세요.");
      const standard = parseTime(ATTENDANCE_STANDARD);
      const status = now <= standard ? "정상" : "지각";
      setLogs((prev) => [
        { type: "출근", time: now.toLocaleTimeString().slice(0, 5), date: now.toISOString().slice(0, 10), status },
        ...prev,
      ]);
      setUsedOtpIn(true);
      setInput("");
      setPage(1);
      setModalOpen(false);
      alert("출근이 기록되었습니다.");
    } else {
      if (usedOtpOut) return alert("이미 퇴근 처리됨");
      if (input !== otpOut) return alert("퇴근 인증번호가 일치하지 않습니다.");
      if (now > expireOut) return alert("인증번호가 만료되었습니다. 새로고침 후 시도하세요.");
      setLogs((prev) => [
        { type: "퇴근", time: now.toLocaleTimeString().slice(0, 5), date: now.toISOString().slice(0, 10), status: "정상" },
        ...prev,
      ]);
      setUsedOtpOut(true);
      setInput("");
      setPage(1);
      setModalOpen(false);
      alert("퇴근이 기록되었습니다.");
    }
  }

  function formatRemain(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const pagedLogs = logs.slice((page - 1) * LOGS_PER_PAGE, page * LOGS_PER_PAGE);

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="width_100 main_box flex flex_column gap_20 align_center justify_center position_rel">
          <div className="card_title font_700">근태 관리</div>

          <div className="flex gap_20" style={{ marginBottom: 10 }}>
            <button
              className="att_btn"
              onClick={() => { setMode("in"); setModalOpen(true); }}
              disabled={usedOtpIn}
            >
              출근
            </button>
            <button
              className="att_btn"
              onClick={() => { setMode("out"); setModalOpen(true); }}
              disabled={usedOtpOut}
            >
              퇴근
            </button>
          </div>

          {/* 출/퇴근 기록 + 페이징 */}
          <div className="attendance_log_wrap width_100" style={{ marginTop: 30 }}>
            <div className="card_title font_600 text_center" style={{ marginBottom: 8 }}>근태 내역</div>
            <table className="attendance_log_table width_100">
              <thead>
                <tr>
                  <th className="su_small_text">날짜</th>
                  <th className="su_small_text">구분</th>
                  <th className="su_small_text">시간</th>
                  <th className="su_small_text">상태</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ color: "#aaa", padding: "18px 0" }}>기록 없음</td>
                  </tr>
                ) : (
                  pagedLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td>{log.date}</td>
                      <td>{log.type}</td>
                      <td>{log.time}</td>
                      <td>
                        <span className={`att_status att_status_${log.status}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* 페이지네이션 */}
            <div className="board_pagination">
              <button
                className="board_btn"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                이전
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx + 1}
                  className={`board_btn board_page_btn${page === idx + 1 ? " active" : ""}`}
                  onClick={() => setPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                className="board_btn"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 출/퇴근 인증 모달 */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="otp_box flex flex_column align_center gap_10">
          <div className="small_text font_600">
            {mode === "in" ? "출근 인증번호" : "퇴근 인증번호"}
          </div>
          <div className="otp_code font_700">{mode === "in" ? otpIn : otpOut}</div>
          <div className="su_small_text" style={{ color: "#ff6f61" }}>
            유효시간 : {formatRemain(remain)} (분:초)
          </div>
          <form onSubmit={handleSubmit} className="flex gap_10 align_center">
            <input
              className="otp_input"
              type="text"
              placeholder="인증번호 입력"
              value={input}
              onChange={e => setInput(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={6}
              disabled={mode === "in" ? usedOtpIn : usedOtpOut}
              autoComplete="off"
              required
            />
            <button
              type="submit"
              className="att_btn"
              disabled={mode === "in" ? usedOtpIn : usedOtpOut}
            >
              {mode === "in" ? (usedOtpIn ? "출근 완료" : "출근 처리") : (usedOtpOut ? "퇴근 완료" : "퇴근 처리")}
            </button>
          </form>
        </div>
      </Modal>
      <Footer />
    </div>
  );
}

