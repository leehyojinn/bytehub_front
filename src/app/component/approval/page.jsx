'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const ITEMS_PER_PAGE = 10; // 페이지당 표시할 항목 수
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);
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

export default function ApprovalSystem() {
  let userId = "";
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.id;
      } catch (e) {
        console.error("토큰 파싱 실패", e);
      }
    }
  }


  const [sortedApprovers, setSortedApprovers] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [toApproveList, setToApproveList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allApprovals, setAllApprovals] = useState([]); // 전체 결재 목록용
  const [userInfo, setUserInfo] = useState(null); // 사용자 정보 상태 추가
  const [activeTab, setActiveTab] = useState(() => {
    if (userInfo && Number(userInfo.lv_idx) === 1) return 2;
    return 0;
  });
  // 페이지네이션 상태 추가
  const [myPage, setMyPage] = useState(1);
  const [toApprovePage, setToApprovePage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  // 기안 폼 상태
  const [approvalType, setApprovalType] = useState("");
  const [vacStart, setVacStart] = useState("");
  const [vacEnd, setVacEnd] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // 파일 첨부 상태
  const [rejectReason, setRejectReason] = useState(""); // 반려 사유
  const [showRejectModal, setShowRejectModal] = useState(false); // 반려 사유 입력 모달
  const [currentRejectHistory, setCurrentRejectHistory] = useState(null); // 현재 반려할 결재 이력
  const [expandedReasons, setExpandedReasons] = useState(new Set()); // 확장된 반려 사유들
  const [remainDays, setRemainDays] = useState(0); // 잔여 연차

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${apiUrl}/mypage/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });

      const data = await response.json();
      if (data.success) {
        setUserInfo(data.data);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  // 잔여 연차 가져오기
  const fetchRemainDays = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      console.log('잔여 연차 조회 시작 - userId:', userId);
      console.log('API URL:', `${apiUrl}/leave/my`);

      const response = await fetch(`${apiUrl}/leave/my`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('응답 상태:', response.status);
      const result = await response.json();
      console.log('API 응답:', result);

      if (result.success) {
        // result.data가 배열이므로 첫 번째 요소의 remain_days 사용
        const remainDaysValue = result.data?.[0]?.remain_days || 0;
        console.log('설정할 잔여 연차:', remainDaysValue);
        setRemainDays(remainDaysValue);
      } else {
        console.error('API 응답 실패:', result.msg);
      }
    } catch (error) {
      console.error('잔여 연차 조회 실패:', error);
    }
  };

  // 레벨별 권한 체크 함수
  const canViewApprovalList = () => {
    if (!userInfo) return false;
    // lv_idx가 1, 2, 3인 경우만 true
    return Number(userInfo.lv_idx) >= 1 && Number(userInfo.lv_idx) <= 3;
  };

  // 사용자 목록 가져오기 (POST)
  const fetchUserList = async () => {
    try {
      const response = await fetch(`${apiUrl}/member/list`, { method: 'POST' });
      const data = await response.json();
      if (data.list) {
        return data.list;
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    }
    return [];
  };

  // 결재권자 설정
  const setApproversByUserLevel = async () => {
    if (!userInfo) return;
    const userList = await fetchUserList();

    if (Number(userInfo.lv_idx) === 1) {
      // lv_idx 1: 결재권자 없음 (기안만 가능)
      setSortedApprovers([]);
    } else if (Number(userInfo.lv_idx) === 2) {
      // lv_idx 2: lv_idx 1만 결재권자로 보임
      const approvers = userList.filter(
        user => Number(user.lv_idx) === 1
      );
      const sortedApprovers = approvers.map(user => ({
        id2: user.user_id,
        name: user.name,
        rank: user.lv_name,
        lv_idx: Number(user.lv_idx)
      })).sort((a, b) => a.lv_idx - b.lv_idx);
      setSortedApprovers(sortedApprovers);
    } else if (Number(userInfo.lv_idx) === 3) {
      // lv_idx 3: lv_idx 1,2인 사람들만 결재권자로 보여줌
      const approvers = userList.filter(
        user => [1, 2].includes(Number(user.lv_idx))
      );
      const sortedApprovers = approvers.map(user => ({
        id2: user.user_id,
        name: user.name,
        rank: user.lv_name,
        lv_idx: Number(user.lv_idx)
      })).sort((a, b) => a.lv_idx - b.lv_idx);
      setSortedApprovers(sortedApprovers);
    } else if ([4, 5, 6].includes(Number(userInfo.lv_idx))) {
      // lv_idx 4,5,6: lv_idx 1,2는 무조건, lv_idx 3은 같은 부서만
      const approvers = userList.filter(
        user => [1, 2].includes(Number(user.lv_idx)) || 
               (Number(user.lv_idx) === 3 && Number(user.dept_idx) === Number(userInfo.dept_idx))
      );
      const sortedApprovers = approvers.map(user => ({
        id2: user.user_id,
        name: user.name,
        rank: user.lv_name,
        lv_idx: Number(user.lv_idx)
      })).sort((a, b) => a.lv_idx - b.lv_idx);
      setSortedApprovers(sortedApprovers);
    }
  };

  // 페이지네이션 핸들러 함수들
  const handleMyPageChange = (newPage) => {
    const totalPages = Math.ceil(myApprovals.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    setMyPage(newPage);
  };

  const handleToApprovePageChange = (newPage) => {
    const totalPages = Math.ceil(toApproveList.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    setToApprovePage(newPage);
  };

  const handleAllPageChange = (newPage) => {
    const totalPages = Math.ceil(allApprovals.length / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    setAllPage(newPage);
  };

  // 결재 문서 조회
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/appr/my?writer_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (error) {
      console.error('결재 문서 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchToApproveList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/appr/toapprove?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setToApproveList(data.data);
      }
    } catch (error) {
      console.error('결재 처리 리스트 조회 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  // 결재 문서 상세 보기
  const fetchApprovalDetail = async (appr_idx) => {
    try {
      const response = await fetch(`${apiUrl}/appr/detail/${appr_idx}`);
      const data = await response.json();
      if (data.success) {
        let doc = data.data;
        const historyResponse = await fetch(`${apiUrl}/appr/history/${appr_idx}`);
        const historyData = await historyResponse.json();
        if (historyData.success) {
          doc = { ...doc, history: historyData.data };
        }
        setSelectedDoc(doc);
      }
    } catch (error) {
      console.error('결재 문서 상세 조회 실패:', error);
    }
  };

  // 파일 input 변경 핸들러
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // 결재 문서 생성 (파일 업로드 포함)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 연차 결재인 경우 잔여 연차 확인
    if (approvalType === "연차") {
      // 이미 조회된 잔여 연차 정보 사용
      const currentRemainDays = remainDays;
      
      // 실제 근무일 수 계산 (주말, 공휴일 제외)
      const workdays = calculateWorkdays(vacStart, vacEnd);
      
      if (workdays > currentRemainDays) {
        alert(`잔여 연차가 부족합니다.\n신청일수: ${workdays}일 (실제 근무일)\n잔여연차: ${currentRemainDays}일`);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("writer_id", userId);
      formData.append("subject", title);
      
      formData.append("content", content);
      formData.append("appr_type", approvalType);
      if (approvalType === "연차") {
        formData.append("vac_start", vacStart);
        formData.append("vac_end", vacEnd);
      }
      files.forEach((file, idx) => {
        formData.append("files", file);
      });

      const response = await fetch(`${apiUrl}/appr/create`, {
        method: 'POST',
        body: formData
      });

      // 결재 처리
      const data = await response.json();
      if (data.success) {
        alert('결재 문서가 등록되었습니다.');
        setTitle("");
        setContent("");
        setApprovalType("");
        setVacStart("");
        setVacEnd("");
        setFiles([]);
        fetchApprovals();
      } else {
        alert('등록 실패: ' + data.msg);
      }
    } catch (error) {
      console.error('결재 문서 등록 실패:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleApproval = async (appr_his_idx, status, reason = "") => {
    try {
      const response = await fetch(`${apiUrl}/appr/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appr_his_idx: appr_his_idx,
          status: status,
          reason: reason
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(status === '승인완료' ? '승인 처리되었습니다.' : '반려 처리되었습니다.');
        setSelectedDoc(null);
        fetchApprovals();
        fetchToApproveList();
        fetchAllApprovals(); // 결재 목록 리스트 갱신 추가
      } else {
        alert('처리 실패: ' + data.msg);
      }
    } catch (error) {
      console.error('결재 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 전체 결재 목록 보기
  const fetchAllApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/appr/all?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setAllApprovals(data.data);
      }
    } catch (error) {
      console.error('전체 결재 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 파일 다운로드 함수 (모달 등에서 사용 가능하게 ApprovalSystem 내부에 정의)
  const handleFileDownload = async (fileIdx, fileName) => {
    try {
      const response = await fetch(`${apiUrl}/appr/download/${fileIdx}`, {
        method: 'GET'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('파일 다운로드에 실패했습니다.');
      }
    } catch (error) {
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchApprovals();
    fetchToApproveList();
    fetchAllApprovals();
    fetchUserInfo(); // 사용자 정보 가져오기
    fetchRemainDays(); // 잔여 연차 가져오기
  }, [userId]);

  // 사용자 정보가 로드되면 탭 권한 체크 및 결재권자 설정
  useEffect(() => {
    if (userInfo) {
      // lv_idx가 1인 경우 처음 로드될 때만 결재 처리 리스트(탭2)로 이동
      if (Number(userInfo.lv_idx) === 1 && activeTab < 2) {
        setActiveTab(2);
      }
      // 현재 활성 탭이 권한이 없는 탭인 경우 첫 번째 탭으로 이동
      else if (!canViewApprovalList() && activeTab >= 2) {
        setActiveTab(0);
      }
      
      // 결재권자 설정
      setApproversByUserLevel();
    }
  }, [userInfo]);


  const getStatusDisplay = (final_status) => {
    switch (final_status) {
      case '반려': return '반려';
      case '승인완료': return '승인';
      case '대기중': return '상신';
      default: return '기안';
    }
  };

  const getStatusBadgeClass = (final_status) => {
    switch (final_status) {
      case '반려': return 'status_rejected';
      case '승인완료': return 'status_approved';
      case '대기중': return 'status_progress';
      default: return 'status_draft';
    }
  };

  // 연차 결재에서 날짜 정보 추출하는 함수
  const extractVacationDates = (content, vacStart, vacEnd) => {
    // 백엔드에서 받은 별도 필드 우선 사용
    if (vacStart && vacEnd) {
      return {
        startDate: vacStart,
        endDate: vacEnd
      };
    }
    
    // 백엔드 필드가 없는 경우 content에서 추출 (기존 데이터 호환성)
    if (content) {
      const startMatch = content.match(/시작일:\s*(\d{4}-\d{2}-\d{2})/);
      const endMatch = content.match(/종료일:\s*(\d{4}-\d{2}-\d{2})/);
      
      if (startMatch && endMatch) {
        return {
          startDate: startMatch[1],
          endDate: endMatch[1]
        };
      }
    }
    
    return null;
  };

  const myApprovals = approvals.filter(doc => doc.writer_id === userId);
  
  // 페이지네이션을 위한 데이터 처리
  const startMyIdx = (myPage - 1) * ITEMS_PER_PAGE;
  const endMyIdx = startMyIdx + ITEMS_PER_PAGE;
  const currentMyApprovals = myApprovals.slice(startMyIdx, endMyIdx);
  const calcTotalMyPages = Math.ceil(myApprovals.length / ITEMS_PER_PAGE);
  
  // 결재 처리 리스트 필터링 - lv_idx 3인 경우 같은 부서만, 나머지는 전체
  const filteredToApproveList = toApproveList.filter(doc => {
    // lv_idx 3인 경우 같은 부서만 보여줌
    if (userInfo && Number(userInfo.lv_idx) === 3) {
      return Number(doc.writer_dept_idx) === Number(userInfo.dept_idx);
    }
    
    // 나머지는 모든 문서 보여줌
    return true;
  });
  const startToApproveIdx = (toApprovePage - 1) * ITEMS_PER_PAGE;
  const endToApproveIdx = startToApproveIdx + ITEMS_PER_PAGE;
  const currentToApproveList = filteredToApproveList.slice(startToApproveIdx, endToApproveIdx);
  const calcTotalToApprovePages = Math.ceil(filteredToApproveList.length / ITEMS_PER_PAGE);
  
  const startAllIdx = (allPage - 1) * ITEMS_PER_PAGE;
  const endAllIdx = startAllIdx + ITEMS_PER_PAGE;


  // 결재 목록 리스트(탭 3) - lv_idx 3인 경우 같은 부서만, 나머지는 전체
  const filteredAllApprovals = allApprovals.filter(doc => {
    // lv_idx 3인 경우 같은 부서만 보여줌
    if (userInfo && Number(userInfo.lv_idx) === 3) {
      return Number(doc.writer_dept_idx) === Number(userInfo.dept_idx);
    }
    
    // 나머지는 모든 문서 보여줌
    return true;
  });
  const currentAllApprovals = filteredAllApprovals.slice(startAllIdx, endAllIdx);
  const calcTotalAllPages = Math.ceil(filteredAllApprovals.length / ITEMS_PER_PAGE);

  // 주말인지 확인하는 함수
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0: 일요일, 6: 토요일
  };

  // 공휴일 목록 (2024-2025년 주요 공휴일)
  const holidays = [
    '2024-01-01', // 신정
    '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', // 설날
    '2024-03-01', // 삼일절
    '2024-05-05', // 어린이날
    '2024-05-15', // 부처님 오신 날
    '2024-06-06', // 현충일
    '2024-08-15', // 광복절
    '2024-09-16', '2024-09-17', '2024-09-18', // 추석
    '2024-10-03', // 개천절
    '2024-10-09', // 한글날
    '2024-12-25', // 크리스마스
    '2025-01-01', // 신정
    '2025-01-28', '2025-01-29', '2025-01-30', // 설날
    '2025-03-01', // 삼일절
    '2025-05-05', // 어린이날
    '2025-05-03', // 부처님 오신 날
    '2025-06-06', // 현충일
    '2025-08-15', // 광복절
    '2025-10-05', '2025-10-06', '2025-10-07', // 추석
    '2025-10-03', // 개천절
    '2025-10-09', // 한글날
    '2025-12-25', // 크리스마스
  ];

  // 공휴일인지 확인하는 함수
  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
  };

  // 실제 근무일인지 확인하는 함수
  const isWorkday = (date) => {
    return !isWeekend(date) && !isHoliday(date);
  };

  // 두 날짜 사이의 실제 근무일 수를 계산하는 함수
  const calculateWorkdays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workdays = 0;
    
    // 시작일부터 종료일까지 하루씩 확인
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (isWorkday(date)) {
        workdays++;
      }
    }
    
    return workdays;
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex flex_column gap_30 align_center justify_center position_rel">
          <h2 className="card_title font_700">결재 시스템</h2>
                      <div className="approval_tabs flex gap_10 mb_20">
              {/* 기안작성 탭 */}
              {userInfo && Number(userInfo.lv_idx) !== 1 && (
                <button
                  className={`tab_btn${activeTab === 0 ? " active" : ""}`}
                  onClick={() => setActiveTab(0)}
                >
                  기안작성
                </button>
              )}
              
              {/* 내가 올린 결재 탭 */}
              {userInfo && Number(userInfo.lv_idx) !== 1 && (
                <button
                  className={`tab_btn${activeTab === 1 ? " active" : ""}`}
                  onClick={() => setActiveTab(1)}
                >
                  내가 올린 결재
                </button>
              )}
              
              {/* 결재 처리 리스트 탭 - 권한이 있는 경우만 표시 */}
              {canViewApprovalList() && (
                <button
                  className={`tab_btn${activeTab === 2 ? " active" : ""}`}
                  onClick={() => setActiveTab(2)}
                >
                  결재 처리 리스트
                </button>
              )}
              
              {/* 결재 목록 리스트 탭 - 권한이 있는 경우만 표시 */}
              {canViewApprovalList() && (
                <button
                  className={`tab_btn${activeTab === 3 ? " active" : ""}`}
                  onClick={() => setActiveTab(3)}
                >
                  결재 목록 리스트
                </button>
              )}
            </div>
          
          {/* 결재 올리는 페이지 */}
          {userInfo && userInfo.lv_idx !== 1 && userInfo.lv_name !== "사장" && activeTab === 0 && (
            <div className="approval_section width_100">
              <h3 className="card_title font_600 mb_10">결재 문서 기안</h3>
              <form className="approval_form" onSubmit={handleSubmit} encType="multipart/form-data">
                
                <select
                  className="approval_input"
                  required
                  value={approvalType}
                  onChange={e => setApprovalType(e.target.value)}
                >
                  <option value="">결재 종류 선택</option>
                  <option value="연차">연차</option>
                  <option value="지출">지출</option>
                  <option value="일반">일반</option>
                </select>
                {approvalType === "연차" && (
                  <div>
                    <div className="mb_10" style={{ fontSize: '14px', color: '#433878', fontWeight: 'bold' }}>
                      잔여 연차: {remainDays}일
                    </div>
                    <div className="flex gap_10">
                      <input
                        type="date"
                        className="approval_input"
                        value={vacStart}
                        onChange={e => {
                          const selectedDate = e.target.value;
                          setVacStart(selectedDate);
                          // 시작일이 변경되면 종료일이 시작일보다 이전이면 종료일을 시작일로 설정
                          if (vacEnd && selectedDate > vacEnd) {
                            setVacEnd(selectedDate);
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]} // 오늘 이전 날짜 선택 불가
                        required
                        style={{ flex: 1 }}
                        placeholder="시작일"
                      />
                      <span style={{ alignSelf: "center" }}>~</span>
                      <input
                        type="date"
                        className="approval_input"
                        value={vacEnd}
                        onChange={e => setVacEnd(e.target.value)}
                        min={vacStart || new Date().toISOString().split('T')[0]} // 시작일 이후 또는 오늘 이후만 선택 가능
                        required
                        style={{ flex: 1 }}
                        placeholder="종료일"
                      />
                    </div>
                    {vacStart && vacEnd && (
                      <div className="mt_5" style={{ fontSize: '12px', color: '#666' }}>
                        신청일수: {calculateWorkdays(vacStart, vacEnd)}일 (실제 근무일)
                        {calculateWorkdays(vacStart, vacEnd) > remainDays && (
                          <span style={{ color: '#f44336', marginLeft: '10px' }}>
                            ⚠️ 잔여 연차 부족
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                )}
                
                <input
                  className="approval_input"
                  type="text"
                  placeholder="제목"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className="approval_input"
                  rows={4}
                  placeholder="내용"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                {/* 파일 첨부 input */}
                <div className="mb_10">
                  <label className="font_600 small_text">파일 첨부: </label>
                  <label htmlFor="imageUpload" className="board_file_label">
                    파일 선택
                  </label>
                  <input
                    id="imageUpload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="board_write_file"
                    style={{ display: "none" }}
                  />
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    ※ 파일 크기 제한: 10MB 이하
                  </div>
                  {files.length > 0 && (
                    <div className="mt_5">
                      {files.map((file, idx) => (
                        <span key={idx} style={{ marginRight: 8 }}>{file.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="approval_approvers_list">
                <b>결재권자:</b>
                   {sortedApprovers.map((a, idx) => (
                    <span key={idx} className="approval_approver_chip">
                      <span style={{color: "#433878", fontWeight: 600}}>{a.name}</span> <span className="approval_rank">{a.rank}</span>
                    </span>
                  ))}
                </div>
                <button type="submit" className="approval_btn">기안 등록</button>
              </form>
            </div>
          )}

          {activeTab === 1 && (
            // 내가 올린 결재 페이지
            <div className="approval_section width_100">
              <h3 className="card_title font_600 mb_10">내가 올린 결재</h3>
              <div className="approval_status_legend mb_16 flex gap_10">
                <span className="approval_status_badge status_rejected">반려</span>
                <span className="approval_status_badge status_progress">상신</span>
                <span className="approval_status_badge status_approved">승인</span>
              </div>
              {loading ? (
                <div>로딩 중...</div>
              ) : (<>
              <div className="approval_table_container">

                <table className="approval_table">
                  <thead>
                    <tr>
                      <th>결재번호</th>
                      <th>제목</th>
                      <th>기안자</th>
                      <th>상태</th>
                      <th>종류</th>
                      <th>기안일</th>
                      <th>연차 기간</th>
                      <th>첨부파일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMyApprovals.map(doc => {
                      const vacationDates = doc.appr_type === "연차" ? extractVacationDates(doc.content, doc.vac_start, doc.vac_end) : null;
                      return (
                        <tr key={doc.appr_idx}>
                          <td>{doc.appr_idx}</td>
                          <td>
                            <button
                              className="approval_link"
                              onClick={() => fetchApprovalDetail(doc.appr_idx)}
                            >
                              {doc.subject}
                            </button>
                          </td>
                          <td>{doc.writer_id}</td>
                          <td>
                            <span className={`approval_status_badge ${getStatusBadgeClass(doc.final_status)}`}>
                              {getStatusDisplay(doc.final_status)}
                            </span>
                          </td>
                          <td>{doc.appr_type}</td>
                          <td>{doc.appr_date ? new Date(doc.appr_date).toLocaleDateString() : '-'}</td>
                          <td>
                            {vacationDates ? (
                              <span style={{ fontSize: '12px', color: '#433878' }}>
                                {vacationDates.startDate} ~ {vacationDates.endDate}
                              </span>
                            ) : (
                              <span style={{ color: '#999' }}>-</span>
                            )}
                          </td>
                          <td>
                            <span style={{ textAlign: "center" }}>
                              {doc.has_files === "있음" ? "O" : "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

                  <div className="board_pagination">
                    <button
                      className="board_btn"
                      onClick={() => handleMyPageChange(myPage - 1)}
                      disabled={myPage === 1}
                    >
                      이전
                    </button>
                    {[...Array(calcTotalMyPages)].map((_, idx) => (
                      <button
                        key={idx + 1}
                        className={`board_btn board_page_btn${myPage === idx + 1 ? " active" : ""}`}
                        onClick={() => handleMyPageChange(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="board_btn"
                      onClick={() => handleMyPageChange(myPage + 1)}
                      disabled={myPage === calcTotalMyPages}
                    >
                      다음
                    </button>
                  </div>
          </>
        )}
      </div>
      )}

          {activeTab === 2 && (
            // 내가 결재할 결재 처리리 페이지
            <div className="approval_section width_100">
              <h3 className="card_title font_600 mb_10">결재 처리 리스트</h3>
              <div className="approval_status_legend mb_16 flex gap_10">
                <span className="approval_status_badge status_rejected">반려</span>
                <span className="approval_status_badge status_progress">상신</span>
                <span className="approval_status_badge status_approved">승인</span>
              </div>
              {loading ? (
                <div>로딩 중...</div>
              ) : (
                <div className="approval_table_container">
                <table className="approval_table">
                  <thead>
                    <tr>
                      <th>결재번호</th>
                      <th>제목</th>
                      <th>기안자</th>
                      <th>상태</th>
                      <th>종류</th>
                      <th>기안일</th>
                      <th>연차 기간</th> 
                      <th>첨부파일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentToApproveList.map(doc => {
                      const vacationDates = doc.appr_type === "연차" ? extractVacationDates(doc.content, doc.vac_start, doc.vac_end) : null;
                      return (
                        <tr key={doc.appr_idx}>
                          <td>{doc.appr_idx}</td>
                          <td>
                            <button
                              className="approval_link"
                              onClick={() => fetchApprovalDetail(doc.appr_idx)}
                            >
                              {doc.subject}
                            </button>
                          </td>
                          <td>{doc.writer_id}</td>
                          <td>
                            <span className={`approval_status_badge ${getStatusBadgeClass(doc.final_status)}`}>{getStatusDisplay(doc.final_status)}</span>
                          </td>
                          <td>{doc.appr_type}</td>
                          <td>{doc.appr_date ? new Date(doc.appr_date).toLocaleDateString() : '-'}</td>
                          <td>
                            {vacationDates ? (
                              <span style={{ fontSize: '12px', color: '#433878' }}>
                                {vacationDates.startDate} ~ {vacationDates.endDate}
                              </span>
                            ) : (
                              <span style={{ color: '#999' }}>-</span>
                            )}
                          </td>
                          <td>
                            {doc.files && doc.files.length > 0 ? (
                              <div className="file_list">
                                {doc.files.map((file, idx) => (
                                  <span
                                    key={idx}
                                    onClick={() => handleFileDownload(file.file_idx, file.ori_filename)}
                                    style={{ color: "#433878", cursor: "pointer", marginRight: 15 }}
                                  >
                                    {file.ori_filename}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ textAlign: "center" }}>
                                {doc.has_files === "있음" ? "O" : "-"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                  <div className="board_pagination">
                    <button
                      className="board_btn"
                      onClick={() => handleToApprovePageChange(toApprovePage - 1)}
                      disabled={toApprovePage === 1}
                    >
                      이전
                    </button>
                    {[...Array(calcTotalToApprovePages)].map((_, idx) => (
                      <button
                        key={idx + 1}
                        className={`board_btn board_page_btn${toApprovePage === idx + 1 ? " active" : ""}`}
                        onClick={() => handleToApprovePageChange(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="board_btn"
                      onClick={() => handleToApprovePageChange(toApprovePage + 1)}
                      disabled={toApprovePage === calcTotalToApprovePages}
                    >
                      다음
                    </button>
                  </div>
              </div>
              )}
            </div>
          )}

          {activeTab === 3 && (
              // 결재목록 리스트 (전체)
              <div className="approval_section width_100">
                <h3 className="card_title font_600 mb_10">결재 목록 리스트</h3>
                <div className="approval_status_legend mb_16 flex gap_10">
                  <span className="approval_status_badge status_rejected">반려</span>
                  <span className="approval_status_badge status_progress">결재중</span>
                  <span className="approval_status_badge status_approved">승인</span>
                </div>
                {loading ? (
                    <div>로딩 중...</div>
                ) : (
                  <div className="approval_table_container">
                    <table className="approval_table">
                      <thead>
                      <tr>
                        <th>결재번호</th>
                        <th>제목</th>
                        <th>기안자</th>
                        <th>상태</th>
                        <th>종류</th>
                        <th>기안일</th>
                        <th>연차 기간</th>
                        <th>첨부파일</th>
                      </tr>
                      </thead>
                      <tbody>
                      {currentAllApprovals.map(doc => {
                        const vacationDates = doc.appr_type === "연차" ? extractVacationDates(doc.content, doc.vac_start, doc.vac_end) : null;
                        return (
                          <tr key={doc.appr_idx}>
                            <td>{doc.appr_idx}</td>
                            <td>
                              <button
                                  className="approval_link"
                                  onClick={() => fetchApprovalDetail(doc.appr_idx)}
                              >
                                {doc.subject}
                              </button>
                            </td>
                            <td>{doc.writer_id}</td>
                            <td>
                <span className={`approval_status_badge ${getStatusBadgeClass(doc.final_status)}`}>{getStatusDisplay(doc.final_status)}</span>
                            </td>
                            <td>{doc.appr_type}</td>
                            <td>{doc.appr_date ? new Date(doc.appr_date).toLocaleDateString() : '-'}</td>
                            <td>
                              {vacationDates ? (
                                <span style={{ fontSize: '12px', color: '#433878' }}>
                                  {vacationDates.startDate} ~ {vacationDates.endDate}
                                </span>
                              ) : (
                                <span style={{ color: '#999' }}>-</span>
                              )}
                            </td>
                            <td>
                              {doc.files && doc.files.length > 0 ? (
                                <div className="file_list">
                                  {doc.files.map((file, idx) => (
                                    <span
                                      key={idx}
                                      onClick={() => handleFileDownload(file.file_idx, file.ori_filename)}
                                      style={{ color: "#433878", cursor: "pointer", marginRight: 15 }}
                                    >
                                      {file.ori_filename}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ textAlign: "center" }}>
                                  {doc.has_files === "있음" ? "O" : "-"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>


                  <div className="board_pagination">
                    <button
                      className="board_btn"
                      onClick={() => handleAllPageChange(allPage - 1)}
                      disabled={allPage === 1}
                    >
                      이전
                    </button>
                    {[...Array(calcTotalAllPages)].map((_, idx) => (
                      <button
                        key={idx + 1}
                        className={`board_btn board_page_btn${allPage === idx + 1 ? " active" : ""}`}
                        onClick={() => handleAllPageChange(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="board_btn"
                      onClick={() => handleAllPageChange(allPage + 1)}
                      disabled={allPage === calcTotalAllPages}
                    >
                      다음
                    </button>
                  </div>
              </div>
            )}
          </div>
      )}

          {/* 결재 상세/결재 처리 모달 */}
          <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)}>
            {selectedDoc && (
              <div>
                <h3 className="card_title font_600 mb_10">{selectedDoc.subject}</h3>
                <div className="su_small_text mb_10">
                  기안자: {selectedDoc.writer_id} | 종류: {selectedDoc.appr_type} | 상태: {getStatusDisplay(selectedDoc.final_status)}
                </div>
                <div className="approval_modal_content">
                  <div className="mb_10">
                    <b>결재권자:</b>
                    {sortedApprovers.map(a => (
                      <span key={a.id2} className="approval_approver_chip">{a.name} <span className="approval_rank">{a.rank}</span></span>
                    ))}
                  </div>
                  <div className="mb_10">
                    <b>결재 내용:</b>
                    <div className="approval_content_box">
                      {selectedDoc.content}
                    </div>
                  </div>
                  {/* 연차 결재인 경우 날짜 정보 별도 표시 */}
                  {selectedDoc.appr_type === "연차" && (
                    <div className="mb_10">
                      <b>연차 기간:</b>
                      <div className="approval_content_box" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                        {(() => {
                          const vacationDates = extractVacationDates(selectedDoc.content, selectedDoc.vac_start, selectedDoc.vac_end);
                          return vacationDates ? (
                            <span style={{ fontSize: '14px', color: '#433878', fontWeight: 'bold' }}>
                              {vacationDates.startDate} ~ {vacationDates.endDate}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>날짜 정보를 찾을 수 없습니다.</span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  {/* 첨부파일 표시 */}
                  {selectedDoc.files && selectedDoc.files.length > 0 && (
                    <div className="mb_10">
                      <b>첨부파일:</b>
                      <div className="approval_files_list">
                        {selectedDoc.files.map((file, idx) => (
                          <div key={idx} className="approval_file_item">
                            <span className="approval_file_name">{file.ori_filename}</span>
                              <button
                                onClick={() => handleFileDownload(file.file_idx, file.ori_filename)}
                                style={{
                                  color: "#433878",
                                  cursor: "pointer",
                                  marginLeft: 15
                                }}>
                                다운로드
                              </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <b>결재 내역:</b>
                    {selectedDoc.history && selectedDoc.history.length > 0 ? (
                      <div className="approval_history_list">
                        {selectedDoc.history.map((history, index) => (
                          <div key={index} className="approval_history_item">
                            <span className="approval_step">Step {history.step}</span>
                            <span className="approval_checker">{history.checker_name} ({history.level_name})</span>
                            <span className={`approval_status ${history.status === '승인' ? 'status_approved' :
                              history.status === '반려' ? 'status_rejected' : 'status_progress'}`}>
                              {history.status}
                            </span>
                            {history.check_time && <span className="approval_time">
                              {new Date(history.check_time).toLocaleString()}
                            </span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>결재 내역이 없습니다.</span>
                    )}
                  </div>
                  
                  {/* 반려 사유 별도 표시 */}
                  {selectedDoc.history && selectedDoc.history.some(h => h.status === '반려' && h.reason) && (
                    <div className="mb_10">
                      <b>반려 사유:</b>
                      <div className="approval_reject_reasons">
                        {selectedDoc.history
                          .filter(h => h.status === '반려' && h.reason)
                          .map((history, index) => (
                            <div key={index} className="approval_reject_reason_item" style={{
                              marginBottom: '15px',
                              padding: '12px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              backgroundColor: '#f8f9fa'
                            }}>
                              <div className="approval_reject_header" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#433878'
                              }}>
                                <span className="approval_reject_checker">{history.checker_name} ({history.level_name})</span>
                                <span className="approval_reject_time">{new Date(history.check_time).toLocaleString()}</span>
                              </div>
                              <div className="approval_reject_content" style={{
                                fontSize: '14px',
                                lineHeight: '1.5',
                                color: '#333'
                              }}>
                                {history.reason.length > 50
                                  ? (
                                    <>
                                      {expandedReasons.has(index) 
                                        ? history.reason
                                        : `${history.reason.substring(0, 50)}...`
                                      }
                                      <button
                                        onClick={() => {
                                          if (expandedReasons.has(index)) {
                                            setExpandedReasons(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(index);
                                              return newSet;
                                            });
                                          } else {
                                            setExpandedReasons(prev => new Set([...prev, index]));
                                          }
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#433878',
                                          textDecoration: 'underline',
                                          cursor: 'pointer',
                                          marginLeft: 5,
                                          fontSize: '0.9rem'
                                        }}
                                      >
                                        {expandedReasons.has(index) ? '간략히 보기' : '더보기'}
                                      </button>
                                    </>
                                  )
                                  : history.reason
                                }
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="approval_modal_footer" style={{ display: "flex", justifyContent: "center" }}>
                  {activeTab === 1 ? (
                    <button
                      className="approval_btn"
                      onClick={() => setSelectedDoc(null)}
                    >
                      닫기
                    </button>
                  ) : (
                    <>
                      {/* 결재자이면서 대기중인 경우에만 승인/반려 버튼 노출 */}
                      {selectedDoc.history && selectedDoc.history.length > 0 && userId && (
                        selectedDoc.history
                          .filter(h => h.checker_id === userId && h.status === '대기중')
                          .map((myHistory, idx) => (
                            <React.Fragment key={idx}>
                              <button
                                className="approval_btn"
                                onClick={() => handleApproval(myHistory.appr_his_idx, '승인완료')}
                              >
                                결재 승인
                              </button>
                              <button
                                className="approval_btn approval_btn_reject"
                                onClick={() => {
                                  setCurrentRejectHistory(myHistory);
                                  setShowRejectModal(true);
                                }}
                              >
                                결재 반려
                              </button>
                            </React.Fragment>
                          ))
                      )}
                      <button
                        className="approval_btn approval_btn_secondary"
                        onClick={() => setSelectedDoc(null)}
                      >
                        닫기
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </Modal>

          {/* 반려 사유 입력 모달 */}
          <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
            <div>
              <h3 className="card_title font_600 mb_10">반려 사유 입력</h3>
              <div className="approval_modal_content">
                <div className="mb_10">
                  <b>반려 사유:</b>
                  <textarea
                    className="approval_input"
                    rows={4}
                    placeholder="반려 사유를 입력해주세요 (최대 100자)"
                    value={rejectReason}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        setRejectReason(e.target.value);
                      }
                    }}
                    maxLength={100}
                    style={{ marginTop: 8, width: '100%' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#666', marginTop: 4 }}>
                    {rejectReason.length}/100
                  </div>
                </div>
              </div>
              <div className="approval_modal_footer" style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <button
                  className="approval_btn"
                  onClick={() => {
                    if (currentRejectHistory) {
                      handleApproval(currentRejectHistory.appr_his_idx, '반려', rejectReason);
                    }
                    setShowRejectModal(false);
                    setRejectReason("");
                    setCurrentRejectHistory(null);
                  }}
                >
                  반려 처리
                </button>
                <button
                  className="approval_btn approval_btn_secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setCurrentRejectHistory(null);
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
      <Footer />
    </div>
  );
}
