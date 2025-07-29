'use client';

import React, { useState, useEffect } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import {checkAuthStore, useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "@/app/component/alertmodal/page";

// API 서버 주소 (환경변수에서 가져오거나 기본값 사용)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// 부서 목록
const departments = [
  { id: 1, name: "개발팀" },
  { id: 2, name: "경영지원팀" },
  { id: 3, name: "디자인팀" },
];
// 근태 상태 목록
const attendanceStates = [
  { value: "정상출근", label: "정상출근" },
  { value: "지각", label: "지각" },
  { value: "정상퇴근", label: "정상퇴근" },
  { value: "조퇴", label: "조퇴" },
  { value: "결석", label: "결석" },
  { value: "설정오류", label: "설정오류" },
];

// 출퇴근 정책 초기값 - 설정이 없을 때 사용할 빈 값
const initialPolicy = {
  workStart: "",
  workEnd: "",
  term: 0, // 유효시간(분) - 설정 전까지 0
};

// 부서명 반환 함수
function getDeptName(id) {
  return departments.find(d => d.id === id)?.name || "-";
}

// 근태 관리 메인 컴포넌트
export default function AttendanceManagePage() {
  // 정책 상태
  const [policy, setPolicy] = useState(initialPolicy);
  const [editPolicy, setEditPolicy] = useState(false);
  const [policyExists, setPolicyExists] = useState(false); // 정책 존재 여부
  // 근태 데이터 상태
  const [attendance, setAttendance] = useState([]);
  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState(null);
  // 검색 상태
  const [search, setSearch] = useState({ name: "", id: "", dept: "", date: "" });
  // 근태 수정 모달 상태
  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  // 결석 처리 상태 (현재 미사용)
  // const [isProcessingAbsence, setIsProcessingAbsence] = useState(false);
  const blockId = checkAuthStore();
  const alertModal = useAlertModalStore();

  // 출근/퇴근 정책 정보 불러오기 (최초 1회)
  useEffect(() => {

    const userId = sessionStorage.getItem('userId');
    blockId.redirect({session:sessionStorage, alert:alertModal});

    if (!userId) return;
    const url = apiUrl ? `${apiUrl}/attendance/setting/current` : `/attendance/setting/current`;
    fetch(url)
      .then(res => res.json())
      .then(result => {
        console.log('정책 조회 결과:', result); // ← 디버깅용
        if (result.success && result.data) {
          // 모든 필드 저장 (PK 포함)
          setPolicy({
            ...result.data,
            workStart: result.data.set_in_time?.split('T')[1]?.slice(0,5) || "",
            workEnd: result.data.set_out_time?.split('T')[1]?.slice(0,5) || "",
            term: result.data.term || 0
          });
          setPolicyExists(true);
        } else {
          setPolicy(initialPolicy);
          setPolicyExists(false);
          // 설정이 없으면 관리자에게 알림
          alert("출퇴근 기준 시간이 설정되지 않았습니다.\n관리자 패널에서 기준 시간을 설정해주세요.");
        }
      });
  }, []);

  // 전체 직원 출퇴근 기록 불러오기 함수
  const fetchAttendanceData = () => {
    fetch(`${apiUrl}/attendance/list/all`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setAttendance(result.data);
        }
        if (result.user_info) {
          setUserInfo(result.user_info);
        }
      })
      .catch(err => {
        console.error('전체 근태 조회 실패:', err);
      });
  };

  // 컴포넌트 마운트 시 전체 직원 출퇴근 기록 불러오기
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // 근태 수정 모달 열기
  const openEditModal = async (row) => {
    try {
      const res = await fetch(`${apiUrl}/attendance/detail?att_idx=${row.att_idx}`);
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        setEditRow({
          ...row,
          start_time: data.in_time ? data.in_time.slice(11, 16) : "",
          end_time: data.out_time ? data.out_time.slice(11, 16) : "",
          status: data.att_type || "",
        });
        setEditModal(true);
      } else {
        alert('상세 정보를 불러오지 못했습니다.');
      }
    } catch (e) {
      alert('상세 정보 조회 중 오류가 발생했습니다.');
    }
  };
  // 근태 수정 저장 함수
  const handleEditSave = async (e) => {
    e.preventDefault();
    const body = {
      att_idx: editRow.att_idx,
      user_id: editRow.user_id,
      att_date: editRow.att_date,
      in_time: editRow.start_time ? `2024-01-01T${editRow.start_time}:00` : null,
      out_time: editRow.end_time ? `2024-01-01T${editRow.end_time}:00` : null,
      att_type: editRow.status || null,
    };
    try {
      const res = await fetch(`${apiUrl}/attendance/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionStorage.getItem('token'), 
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        alert('근태 정보가 수정되었습니다.');
        setEditModal(false);
        // 전체 리스트 새로고침
        fetch(`${apiUrl}/attendance/list/all`)
          .then(res => res.json())
          .then(result => {
            if (result.success && result.data) setAttendance(result.data);
          })
          .catch(err => {
            console.error('근태 데이터 새로고침 실패:', err);
          });
      } else {
        alert(result.msg || '수정에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류');
    }
  };

  // 출근/퇴근 기준 시간 설정 저장
  const handlePolicySave = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!policy.workStart || !policy.workEnd || !policy.term) {
      alert("모든 필드를 입력해주세요.\n(출근시간, 퇴근시간, 유효시간)");
      return;
    }
    
    if (policy.term <= 0) {
      alert("유효시간은 1분 이상 입력해주세요.");
      return;
    }
    
    // 현재 로그인한 관리자 ID로 기준 시간 설정
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      alert('로그인 정보가 없습니다.');
      return;
    }
    try {
      const url = apiUrl
        ? `${apiUrl}${policyExists ? '/attendance/setting/update' : '/attendance/setting/create'}`
        : (policyExists ? '/attendance/setting/update' : '/attendance/setting/create');
      const method = policyExists ? 'PUT' : 'POST';
      // time_set_idx가 있으면 같이 보냄
      const body = {
        user_id: userId,
        set_in_time: `2024-01-01T${policy.workStart}:00`,
        set_out_time: `2024-01-01T${policy.workEnd}:00`,
        term: Number(policy.term) || 10 // 유효시간(분)
      };
      if (policy.time_set_idx) body.time_set_idx = policy.time_set_idx;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.success) {
        alert('출퇴근 기준 시간이 저장되었습니다.');
        setEditPolicy(false);
        setPolicyExists(true); // 저장 성공 시 존재 플래그 true
      } else {
        alert(result.msg || '저장에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 오류');
    }
  };

  // 검색 필터
  const filtered = attendance.filter(a =>
    (search.name === "" || (a.name || "-").includes(search.name)) &&
    (search.id === "" || (a.user_id || "").includes(search.id)) &&
    (search.dept === "" || (a.dept_name|| "").includes(search.dept)) &&
    (search.date === "" || a.att_date === search.date)
  );

  // 시간 포맷팅 함수 추가
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    
    try {
      const date = new Date(dateTimeStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      return `${month}월 ${day}일 ${hours.toString().padStart(2, '0')}시 ${minutes.toString().padStart(2, '0')}분 ${seconds.toString().padStart(2, '0')}초`;
    } catch (error) {
      return dateTimeStr; // 파싱 실패시 원본 반환
    }
  };

  // 결석 자동 처리 함수 (현재 미사용 - 언젠가 구현 예정)
  /*
  const handleProcessAbsence = async () => {
    console.log('결석 처리 버튼 클릭됨'); // 디버깅용
    
    if (isProcessingAbsence) {
      console.log('이미 처리 중입니다.');
      return;
    }
    
    const targetDate = prompt("결석 처리할 날짜를 입력하세요 (YYYY-MM-DD 형식, 빈 값이면 전날 처리):");
    console.log('입력받은 날짜:', targetDate); // 디버깅용
    
    // 취소한 경우
    if (targetDate === null) {
      console.log('사용자가 취소함');
      return;
    }
    
    setIsProcessingAbsence(true);
    
    try {
      const requestBody = targetDate.trim() ? { targetDate: targetDate.trim() } : {};
      console.log('요청 본문:', requestBody); // 디버깅용
      console.log('API URL:', `${apiUrl}/attendance/process-absence`); // 디버깅용
      
      const response = await fetch(`${apiUrl}/attendance/process-absence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': sessionStorage.getItem('token')
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('응답 상태:', response.status); // 디버깅용
      const result = await response.json();
      console.log('응답 결과:', result); // 디버깅용
      
      if (result.success) {
        alert(result.msg);
        // 성공 시 데이터 새로고침
        fetchAttendanceData();
      } else {
        alert(result.msg || "결석 처리에 실패했습니다.");
      }
      
    } catch (error) {
      console.error('결석 처리 중 오류:', error);
      alert("결석 처리 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsProcessingAbsence(false);
    }
  };
  */

  // 렌더링
  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 attendance_manage_box">
          <div className="card_title font_700 mb_20">직원 근태 정보 조회/수정</div>
          <div className="flex justify_between align_center mb_20">
            {/* 검색 폼 */}
            <form onSubmit={e => e.preventDefault()} className="flex gap_10">
              <input
                className="board_write_input"
                style={{width: 120}}
                placeholder="이름"
                value={search.name}
                onChange={e => setSearch(s => ({ ...s, name: e.target.value }))}
              />
              <input
                className="board_write_input"
                style={{width: 120}}
                placeholder="아이디"
                value={search.id}
                onChange={e => setSearch(s => ({ ...s, id: e.target.value }))}
              />
              <input
                className="board_write_input"
                style={{width: 120}}
                placeholder="부서"
                value={search.dept}
                onChange={e => setSearch(s => ({ ...s, dept: e.target.value }))}
              />
              <input
                className="board_write_input"
                type="date"
                style={{width: 140}}
                value={search.date}
                onChange={e => setSearch(s => ({ ...s, date: e.target.value }))}
              />
            </form>
            {/* 정책 수정 버튼 */}
            <div className="flex gap_10">
              <button className="board_btn" onClick={() => setEditPolicy(true)}>출근/퇴근 설정</button>
              {/* 결석 처리 기능은 별도 페이지에서 구현 예정
              <button 
                className="board_btn board_btn_danger" 
                onClick={handleProcessAbsence}
                disabled={isProcessingAbsence}
              >
                {isProcessingAbsence ? "처리중..." : "결석 처리"}
              </button>
              */}
            </div>
          </div>
          {/* 근태 테이블 */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="attendance_table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>부서</th>
                  <th>날짜</th>
                  <th>출근</th>
                  <th>퇴근</th>
                  <th>근태상태</th>
                  <th>수정</th>
                </tr>
              </thead>
              <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{textAlign: 'center', color: '#aaa'}}>검색 결과가 없습니다.</td>
                </tr>
              )}
              {filtered.map(row => (
                <tr key={row.att_idx}>
                  <td>{row.name || '-'}</td>
                  <td>{row.user_id}</td>
                  <td>{row.dept_name || '-'}</td>
                  <td>{row.att_date}</td>
                  <td>{formatDateTime(row.in_time)}</td>
                  <td>{formatDateTime(row.out_time)}</td>
                  <td>{row.att_type}</td>
                  <td>
                    <button className="board_btn board_btn_small" onClick={() => openEditModal(row)}>수정</button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        {/* 출근/퇴근 설정 모달 */}
        {editPolicy && (
          <div className="modal_overlay" onClick={() => setEditPolicy(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">출근/퇴근 시간 설정</h3>
              <form onSubmit={handlePolicySave} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">출근 설정시간</label>
                  <input
                    type="time"
                    className="board_write_input"
                    value={policy.workStart}
                    onChange={e => setPolicy(p => ({ ...p, workStart: e.target.value }))}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">퇴근 설정시간</label>
                  <input
                    type="time"
                    className="board_write_input"
                    value={policy.workEnd}
                    onChange={e => setPolicy(p => ({ ...p, workEnd: e.target.value }))}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">유효시간(분)</label>
                  <input
                    type="number"
                    className="board_write_input"
                    min={1}
                    max={120}
                    value={policy.term}
                    onChange={e => setPolicy(p => ({ ...p, term: e.target.value }))}
                    required
                  />
                  <small style={{color: '#666', fontSize: '12px'}}>
                    출근/퇴근 기준 시간 전후 허용 범위 (분 단위, 예: 10분이면 08:50~09:10 출근 인정)
                  </small>
                </div>
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">저장</button>
                  <button type="button" className="board_btn board_btn_cancel" onClick={() => setEditPolicy(false)}>취소</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 근태 수정 모달 */}
        {editModal && (
          <div className="modal_overlay" onClick={() => setEditModal(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">근태 정보 수정</h3>
              <form onSubmit={handleEditSave} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">출근 시간</label>
                  <input
                    type="time"
                    className="board_write_input"
                    value={editRow?.start_time ?? ""}
                    onChange={e => setEditRow(r => ({ ...r, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">퇴근 시간</label>
                  <input
                    type="time"
                    className="board_write_input"
                    value={editRow?.end_time ?? ""}
                    onChange={e => setEditRow(r => ({ ...r, end_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">근태 상태</label>
                  <select
                    className="board_write_input"
                    value={editRow?.status ?? ""}
                    onChange={e => setEditRow(r => ({ ...r, status: e.target.value }))}
                  >
                    {attendanceStates.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">저장</button>
                  <button type="button" className="board_btn board_btn_cancel" onClick={() => setEditModal(false)}>취소</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      <AlertModal/>
      <Footer />
    </div>
  );
}
