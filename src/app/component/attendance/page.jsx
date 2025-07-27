'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useEffect, useRef, useState } from "react";

// ===== 상수 정의 =====
const ATTENDANCE_STANDARD = "09:00";    // 출근 기준 시간 (09:00 이후는 지각)
const OTP_VALID_MINUTES = 10;           // 인증번호 유효 시간 (10분)
const LOGS_PER_PAGE = 10;               // 페이지당 표시할 기록 수

// API 서버 주소 (환경변수에서 가져오거나 기본값 사용)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ===== 유틸리티 함수들 =====

/**
 * 6자리 인증번호 생성 함수
 * @returns {string} 100000~999999 사이의 랜덤 숫자 문자열
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 시간 문자열을 Date 객체로 변환하는 함수
 * @param {string} timeStr - "HH:MM" 형식의 시간 문자열
 * @returns {Date} 해당 시간의 Date 객체
 */
function parseTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * 모달 컴포넌트
 * @param {boolean} isOpen - 모달 열림/닫힘 상태
 * @param {function} onClose - 모달 닫기 함수
 * @param {React.ReactNode} children - 모달 내부 컨텐츠
 */
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

/**
 * 백엔드에 인증번호 검증 요청을 보내는 함수
 * @param {string} userId - 사용자 ID
 * @param {string} inputCode - 사용자가 입력한 인증번호
 * @param {string} expectedCode - 예상되는 올바른 인증번호
 * @param {string} mode - "in"(출근) 또는 "out"(퇴근)
 * @returns {Promise<Object>} 백엔드 응답 결과
 */
async function verifyOtp(userId, inputCode, expectedCode, mode) {
  const res = await fetch(`${apiUrl}/attendance/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      input_code: inputCode,
      expected_code: expectedCode,
      mode: mode
    })
  });
  return await res.json();
}

/**
 * 백엔드에서 인증 잠금 상태를 확인하는 함수
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 잠금 상태 정보
 */
async function checkAuthStatus(userId) {
  const res = await fetch(`${apiUrl}/attendance/auth-status?user_id=${userId}`);
  return await res.json();
}

// ===== 메인 컴포넌트 =====
export default function Attendance() {
  // ===== 상태 관리 =====
  
  // 인증번호 관련 상태
  const [otpIn, setOtpIn] = useState("");           // 출근용 인증번호
  const [otpOut, setOtpOut] = useState("");         // 퇴근용 인증번호
  const [expireIn, setExpireIn] = useState(null);   // 출근 인증번호 만료 시간
  const [expireOut, setExpireOut] = useState(null); // 퇴근 인증번호 만료 시간

  // 입력 및 모드 상태
  const [input, setInput] = useState("");            // 사용자 입력 인증번호
  const [mode, setMode] = useState("in");           // 현재 모드 ("in" 또는 "out")

  // 출퇴근 기록 데이터 (실제 백엔드에서 가져올 데이터)
  const [logs, setLogs] = useState([]);
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  
  // 인증번호 사용 여부 상태
  const [usedOtpIn, setUsedOtpIn] = useState(false);   // 출근 인증번호 사용 여부
  const [usedOtpOut, setUsedOtpOut] = useState(false); // 퇴근 인증번호 사용 여부

  // 인증 잠금 관련 상태
  const [isLocked, setIsLocked] = useState(false);     // 잠금 상태
  const [lockMessage, setLockMessage] = useState("");  // 잠금 메시지
  const [remainingMinutes, setRemainingMinutes] = useState(0); // 잠금 남은 시간

  // 페이징 관련 상태
  const [page, setPage] = useState(1);                 // 현재 페이지 번호
  const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE); // 전체 페이지 수

  // 타이머 관련 상태
  const [remain, setRemain] = useState(0);             // 남은 시간 (초)
  const timerRef = useRef();                           // 타이머 참조

  // UI 상태
  const [modalOpen, setModalOpen] = useState(false);   // 모달 열림/닫힘 상태
  const [isSending, setIsSending] = useState(false);   // 인증번호 발송 중 상태

  // ===== useEffect 훅들 =====

  /**
   * 컴포넌트 마운트 시 실행되는 초기화 로직
   * - 인증번호 생성
   * - 자정에 페이지 새로고침 설정
   * - 백엔드에서 출퇴근 기록 로드
   */
  useEffect(() => {
    createOtps(); // 초기 인증번호 생성
    
    // 자정에 페이지 새로고침 (새로운 날짜 시작)
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msToMidnight = midnight - new Date();
    const midnightTimer = setTimeout(() => window.location.reload(), msToMidnight);
    
    // 백엔드에서 출퇴근 기록 로드
    loadAttendanceData();
    
    return () => clearTimeout(midnightTimer); // 컴포넌트 언마운트 시 타이머 정리
  }, []);

  /**
   * 인증번호 만료 시간이 변경될 때마다 실행되는 타이머 로직
   * - 1초마다 남은 시간 업데이트
   * - 만료 시 새로운 인증번호 생성
   */
  useEffect(() => {
    timerRef.current && clearInterval(timerRef.current); // 기존 타이머 정리
    
    if (expireIn && expireOut) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const remainIn = Math.max(0, Math.floor((expireIn - now) / 1000));
        const remainOut = Math.max(0, Math.floor((expireOut - now) / 1000));
        setRemain(mode === "in" ? remainIn : remainOut); // 현재 모드에 따른 남은 시간 설정
        
        // 인증번호 만료 시 새로운 인증번호 생성
        if (remainIn === 0 || remainOut === 0) createOtps();
      }, 1000);
    }
    
    return () => clearInterval(timerRef.current); // 컴포넌트 언마운트 시 타이머 정리
  }, [expireIn, expireOut, mode]);

  // ===== 이벤트 핸들러 함수들 =====

  /**
   * 인증 잠금 상태를 확인하는 함수
   * - 모달 열기 전에 잠금 상태 체크
   * - 잠금 상태면 모달 열지 않고 메시지 표시
   */
  async function checkAndOpenModal(mode) {
    let userId = sessionStorage.getItem('userId');
    
    if (!userId) {
      alert('로그인 정보가 없습니다. 다시 로그인 해주세요.');
      return;
    }

    try {
      // 백엔드에서 잠금 상태 확인
      const lockStatus = await checkAuthStatus(userId);
      
      if (lockStatus.success && lockStatus.locked) {
        // 잠금 상태인 경우
        setIsLocked(true);
        setLockMessage(lockStatus.message);
        setRemainingMinutes(lockStatus.remainingMinutes || 0);
        alert(`🔒 인증이 잠금되었습니다.\n${lockStatus.message}`);
        return;
      } else {
        // 잠금 상태가 아닌 경우 정상적으로 모달 열기
        setIsLocked(false);
        setLockMessage("");
        setRemainingMinutes(0);
        setMode(mode);
        setModalOpen(true);
      }
    } catch (error) {
      console.error('잠금 상태 확인 오류:', error);
      // 오류 시에도 모달은 열되, 잠금 상태는 false로 설정
      setIsLocked(false);
      setMode(mode);
      setModalOpen(true);
    }
  }

  /**
   * 백엔드에서 출퇴근 기록을 가져오는 함수
   * - 사용자 ID로 출퇴근 기록 조회
   * - 성공 시 로컬 상태 업데이트
   */
  async function loadAttendanceData() {
    setIsLoading(true);
    try {
      // 세션스토리지에서 사용자 ID 가져오기
      let userId = sessionStorage.getItem('userId');
      
      if (!userId) {
        console.log('사용자 ID가 없어서 기록을 불러올 수 없습니다.');
        setIsLoading(false);
        return;
      }

      // 백엔드에서 출퇴근 기록 조회
      const response = await fetch(`${apiUrl}/attendance/list?user_id=${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        // 백엔드 데이터를 프론트엔드 형식으로 변환
        const formattedLogs = result.data.map(att => {
          const date = new Date(att.att_date);
          
          // 출근/퇴근 구분: in_time이 있으면 출근, out_time이 있으면 퇴근
          const isInRecord = att.in_time != null;
          const time = isInRecord ? new Date(att.in_time) : new Date(att.out_time);
          
          return {
            date: date.toISOString().slice(0, 10),
            type: isInRecord ? "출근" : "퇴근", // 출근/퇴근 구분
            time: time.getHours().toString().padStart(2, "0") + ":" + time.getMinutes().toString().padStart(2, "0"),
            status: att.att_type, // 백엔드에서 계산한 상태 그대로 사용
            originalTime: time // 정렬을 위한 원본 시간
          };
        });
        
        // 날짜와 시간순으로 정렬 (최신순)
        formattedLogs.sort((a, b) => {
          // 먼저 날짜로 정렬
          if (a.date !== b.date) {
            return new Date(b.date) - new Date(a.date);
          }
          // 같은 날짜면 시간으로 정렬
          return b.originalTime - a.originalTime;
        });
        
        setLogs(formattedLogs);
      } else {
        console.log('출퇴근 기록 조회 실패:', result.msg);
        // 실패 시 빈 배열로 설정
        setLogs([]);
      }
    } catch (error) {
      console.error('출퇴근 기록 로드 오류:', error);
      // 오류 시 빈 배열로 설정
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }



  /**
   * 이메일로 인증번호 발송하는 함수
   * - 백엔드 API 호출
   * - 발송 성공 시 인증번호와 만료 시간 설정
   */
  async function sendEmailOtp() {
    setIsSending(true); // 발송 중 상태 설정
    
    try {
      // 세션스토리지에서 사용자 ID 가져오기
      let userId = sessionStorage.getItem('userId');
      console.log('최종 전송할 user_id:', userId);

      if (!userId) {
        alert('로그인 정보가 없습니다. 다시 로그인 해주세요.');
        setIsSending(false);
        return;
      }

      // 백엔드에 인증번호 발송 요청
      const response = await fetch(`${apiUrl}/email/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const result = await response.json();

      // 발송 성공 시 인증번호와 만료 시간 설정
      if (result.msg && result.msg.includes("발송")) {
        setOtpIn(result.authCode);
        setOtpOut(result.authCode);
        const now = new Date();
        const expire = new Date(now.getTime() + OTP_VALID_MINUTES * 60000);
        setExpireIn(expire);
        setExpireOut(expire);
        setUsedOtpIn(false);
        setUsedOtpOut(false);
        setInput("");
        alert("인증번호가 이메일로 발송되었습니다.");
      } else {
        alert("인증번호 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error('인증번호 발송 오류:', error);
      alert("인증번호 발송 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false); // 발송 중 상태 해제
    }
  }

  /**
   * 새로운 인증번호를 생성하고 초기화하는 함수
   * - 출근/퇴근용 인증번호 각각 생성
   * - 만료 시간 설정
   * - 사용 여부 초기화
   */
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

  /**
   * 인증번호 제출 처리 함수
   * - 인증번호 유효성 검사
   * - 백엔드에 인증 요청
   * - 성공 시 출퇴근 기록 추가
   */
  async function handleSubmit(e) {
    e.preventDefault();
    
    const now = new Date();
    const expectedCode = mode === "in" ? otpIn : otpOut;
    const usedOtp = mode === "in" ? usedOtpIn : usedOtpOut;
    const expire = mode === "in" ? expireIn : expireOut;
    let userId = sessionStorage.getItem('userId');

    // 유효성 검사
    if (usedOtp) return alert(mode === "in" ? "이미 출근 처리됨" : "이미 퇴근 처리됨");
    if (now > expire) return alert("인증번호가 만료되었습니다. 새로고침 후 시도하세요.");
    if (!userId) return alert('로그인 정보가 없습니다. 다시 로그인 해주세요.');

    // 백엔드에 인증번호 검증 및 기록 요청
    const result = await verifyOtp(userId, input, expectedCode, mode);
    
    if (!result.success) {
      // 인증 실패 시 처리
      if (result.locked) {
        // 잠금 상태인 경우
        setIsLocked(true);
        setLockMessage(result.msg);
        setRemainingMinutes(result.remainingMinutes || 0);
        alert(`🔒 ${result.msg}`);
        setModalOpen(false); // 모달 닫기
      } else {
        // 일반적인 실패
        alert(result.msg || "인증번호가 일치하지 않습니다.");
        setInput(""); // 입력 필드만 초기화
      }
      return;
    }

    // 성공 시 처리
    setIsLocked(false); // 잠금 상태 해제
    if (mode === "in") {
      setUsedOtpIn(true);
    } else {
      setUsedOtpOut(true);
    }
    
    // 상태 초기화
    setInput("");
    setPage(1);
    setModalOpen(false);
    
    // 인증 성공 후 기록 다시 로드
    setTimeout(() => {
      loadAttendanceData();
    }, 1000);
    
    alert(mode === "in" ? "출근이 기록되었습니다." : "퇴근이 기록되었습니다.");
  }

  /**
   * 남은 시간을 "분:초" 형식으로 포맷팅하는 함수
   * @param {number} sec - 초 단위 시간
   * @returns {string} "분:초" 형식의 문자열
   */
  function formatRemain(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ===== 계산된 값들 =====
  
  // 현재 페이지에 표시할 기록들
  const pagedLogs = logs.slice((page - 1) * LOGS_PER_PAGE, page * LOGS_PER_PAGE);

  // ===== 렌더링 =====
  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="width_100 main_box flex flex_column gap_20 align_center justify_center position_rel">
          <div className="card_title font_700">근태 관리</div>

          {/* 출근/퇴근 버튼 */}
          <div className="flex gap_20" style={{ marginBottom: 10 }}>
            <button
              className="att_btn"
              onClick={() => checkAndOpenModal("in")}
              disabled={usedOtpIn}
            >
              출근
            </button>
            <button
              className="att_btn"
              onClick={() => checkAndOpenModal("out")}
              disabled={usedOtpOut}
            >
              퇴근
            </button>
            
          </div>

          {/* 출/퇴근 기록 테이블 + 페이징 */}
          <div className="attendance_log_wrap width_100" style={{ marginTop: 30 }}>
            <div className="card_title font_600 text_center" style={{ marginBottom: 8 }}>근태 내역</div>
            
            {/* 로딩 상태 표시 */}
            {isLoading && (
              <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                기록을 불러오는 중...
              </div>
            )}
            
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
                {!isLoading && pagedLogs.length === 0 ? (
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

          {/* 잠금 상태 표시 */}
          {isLocked && (
            <div style={{
              backgroundColor: "#ffebee",
              border: "1px solid #f44336",
              borderRadius: "8px",
              padding: "15px",
              textAlign: "center",
              color: "#d32f2f",
              marginBottom: "10px",
              width: "100%"
            }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</div>
              <div style={{ fontWeight: "600", marginBottom: "5px" }}>인증이 잠금되었습니다</div>
              <div style={{ fontSize: "14px" }}>{lockMessage}</div>
              {remainingMinutes > 0 && (
                <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.8 }}>
                  약 {remainingMinutes}분 후 다시 시도 가능
                </div>
              )}
            </div>
          )}

          {/* 인증번호 발송 버튼 */}
          <div className="flex align_center">
            <button
              type="button"
              className="att_btn"
              onClick={sendEmailOtp}
              disabled={isSending || isLocked}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: (isSending || isLocked)
                  ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontWeight: "700",
                fontSize: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                border: "none",
                cursor: (isSending || isLocked) ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                textAlign: "center",
                lineHeight: "1.2"
              }}
              onMouseOver={e => {
                if (!isSending && !isLocked) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.4)";
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
              }}
            >
              <span style={{fontSize: "24px"}}>📱</span>
              <span>{isLocked ? "잠금됨" : (isSending ? "발송중..." : "인증\n번호 발송")}</span>
            </button>
          </div>

          {/* 유효시간 표시 */}
          {!isLocked && (
            <div className="su_small_text" style={{ color: "#ff6f61" }}>
              유효시간 : {formatRemain(remain)} (분:초)
            </div>
          )}

          {/* 인증번호 입력 폼 */}
          <form onSubmit={handleSubmit} className="flex gap_10 align_center">
            <input
              className="otp_input"
              type="text"
              placeholder={isLocked ? "인증이 잠금되었습니다" : "인증번호 입력"}
              value={input}
              onChange={e => setInput(e.target.value.replace(/[^0-9]/g, ""))} // 숫자만 입력 가능
              maxLength={6}
              disabled={isLocked || (mode === "in" ? usedOtpIn : usedOtpOut)}
              autoComplete="off"
              required={!isLocked}
              style={{
                backgroundColor: isLocked ? "#f5f5f5" : "white",
                color: isLocked ? "#999" : "black"
              }}
            />
            <button
              type="submit"
              className="att_btn"
              disabled={isLocked || (mode === "in" ? usedOtpIn : usedOtpOut)}
              style={{
                backgroundColor: isLocked ? "#ccc" : "",
                cursor: isLocked ? "not-allowed" : "pointer"
              }}
            >
              {isLocked ? "잠금됨" : (mode === "in" ? (usedOtpIn ? "출근 완료" : "출근 처리") : (usedOtpOut ? "퇴근 완료" : "퇴근 처리"))}
            </button>
          </form>
        </div>
      </Modal>
      <Footer />
    </div>
  );
}

