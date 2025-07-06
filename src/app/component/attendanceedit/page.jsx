'use client';

import React, { useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

const departments = [
  { id: 1, name: "개발팀" },
  { id: 2, name: "경영지원팀" },
  { id: 3, name: "디자인팀" },
];
const attendanceStates = [
  { value: "출근", label: "출근" },
  { value: "지각", label: "지각" },
  { value: "조퇴", label: "조퇴" },
  { value: "결석", label: "결석" },
];

const initialPolicy = {
  workStart: "09:00",
  workEnd: "18:00",
};

const initialMembers = [
  { id: "hong123", name: "홍길동", dept_id: 1 },
  { id: "kim456", name: "김철수", dept_id: 2 },
];

const initialAttendance = [
  {
    id: 1,
    member_id: "hong123",
    name: "홍길동",
    dept_id: 1,
    date: "2025-07-05",
    start_time: "09:02",
    end_time: "18:01",
    status: "지각",
  },
  {
    id: 2,
    member_id: "kim456",
    name: "김철수",
    dept_id: 2,
    date: "2025-07-05",
    start_time: "09:00",
    end_time: "17:58",
    status: "출근",
  },
];

function getDeptName(id) {
  return departments.find(d => d.id === id)?.name || "-";
}

export default function AttendanceManagePage() {
  const [policy, setPolicy] = useState(initialPolicy);
  const [editPolicy, setEditPolicy] = useState(false);

  const [attendance, setAttendance] = useState(initialAttendance);
  const [search, setSearch] = useState({ name: "", id: "", dept: "", date: "" });

  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);

  // 근태 수정 모달 열기
  const openEditModal = (row) => {
    setEditRow({ ...row });
    setEditModal(true);
  };
  const handleEditSave = (e) => {
    e.preventDefault();
    setAttendance(prev =>
      prev.map(a => a.id === editRow.id ? { ...editRow } : a)
    );
    setEditModal(false);
  };

  // 출근/퇴근 설정 저장
  const handlePolicySave = (e) => {
    e.preventDefault();
    setPolicy({ ...policy });
    setEditPolicy(false);
  };

  // 검색 필터
  const filtered = attendance.filter(a =>
    (search.name === "" || a.name.includes(search.name)) &&
    (search.id === "" || a.member_id.includes(search.id)) &&
    (search.dept === "" || getDeptName(a.dept_id).includes(search.dept)) &&
    (search.date === "" || a.date === search.date)
  );

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 attendance_manage_box">
          <div className="card_title font_700 mb_20">직원 근태 정보 조회/수정</div>
          <div className="flex justify_between align_center mb_20">
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
            <button className="board_btn" onClick={() => setEditPolicy(true)}>출근/퇴근 설정</button>
          </div>
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
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.member_id}</td>
                  <td>{getDeptName(row.dept_id)}</td>
                  <td>{row.date}</td>
                  <td>{row.start_time}</td>
                  <td>{row.end_time}</td>
                  <td>{row.status}</td>
                  <td>
                    <button className="board_btn board_btn_small" onClick={() => openEditModal(row)}>수정</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    value={editRow.start_time}
                    onChange={e => setEditRow(r => ({ ...r, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">퇴근 시간</label>
                  <input
                    type="time"
                    className="board_write_input"
                    value={editRow.end_time}
                    onChange={e => setEditRow(r => ({ ...r, end_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">근태 상태</label>
                  <select
                    className="board_write_input"
                    value={editRow.status}
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
      <Footer />
    </div>
  );
}
