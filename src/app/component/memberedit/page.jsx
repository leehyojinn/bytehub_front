'use client';

import React, { useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

const departments = [
  { id: 1, name: "개발팀" },
  { id: 2, name: "경영지원팀" },
  { id: 3, name: "디자인팀" },
];
const levels = [
  { id: 1, name: "사원" },
  { id: 2, name: "대리" },
  { id: 3, name: "과장" },
  { id: 4, name: "팀장" },
];
const initialMembers = [
  {
    id: "hong123",
    name: "홍길동",
    phone: "010-1234-5678",
    email: "hong@bytehub.com",
    dept_id: 1,
    join_date: "2022-01-01",
    leave_date: "",
    level: 4,
    position: "팀장",
    status: "재직",
    blind: false,
    duty: "백엔드 개발"
  },
  {
    id: "kim456",
    name: "김철수",
    phone: "010-2222-3333",
    email: "kim@bytehub.com",
    dept_id: 2,
    join_date: "2021-03-15",
    leave_date: "2024-06-30",
    level: 2,
    position: "대리",
    status: "퇴사",
    blind: true,
    duty: "회계"
  }
];

function getDeptName(id) {
  return departments.find(d => d.id === id)?.name || "-";
}
function getLevelName(id) {
  return levels.find(l => l.id === id)?.name || "-";
}
function getWorkPeriod(join, leave) {
  if (!join) return "-";
  const start = new Date(join);
  const end = leave ? new Date(leave) : new Date();
  const diff = end.getFullYear() - start.getFullYear();
  return `${diff}년`;
}

export default function MemberManagePage() {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);

  // 검색 필터
  const filtered = members.filter(m =>
    m.id.includes(search) || m.name.includes(search)
  );

  // 수정 모달 열기
  const openEdit = (m) => {
    setEditMember({ ...m });
    setModalOpen(true);
  };

  // 수정 저장
  const handleSave = (e) => {
    e.preventDefault();
    setMembers(prev =>
      prev.map(m => m.id === editMember.id ? { ...editMember } : m)
    );
    setModalOpen(false);
  };

  // 퇴사처리(블라인드)
  const handleBlind = (id) => {
    if (window.confirm("정말 퇴사처리(블라인드) 하시겠습니까?")) {
      setMembers(prev =>
        prev.map(m => m.id === id ? { ...m, status: "퇴사", blind: true, leave_date: new Date().toISOString().slice(0,10) } : m)
      );
    }
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 member_manage_box">
          <div className="card_title font_700 mb_20">직원 정보 관리</div>
          <div className="flex justify_between align_center mb_20">
            <form onSubmit={e => e.preventDefault()} className="flex gap_10">
              <input
                className="board_write_input"
                style={{width: 220}}
                placeholder="아이디/이름 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>
            <span className="su_small_text">회원 리스트에서 정보 확인, 수정, 퇴사처리가 가능합니다.</span>
          </div>
          <table className="member_table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>이름</th>
                <th>연락처</th>
                <th>이메일</th>
                <th>부서</th>
                <th>부서 근무기간</th>
                <th>직급</th>
                <th>입사일</th>
                <th>퇴사일</th>
                <th>재직상태</th>
                <th>직무</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{textAlign: 'center', color: '#aaa'}}>검색 결과가 없습니다.</td>
                </tr>
              )}
              {filtered.map(m => (
                <tr key={m.id} className={m.blind ? "blind_row" : ""}>
                  <td>{m.blind ? "블라인드" : m.id}</td>
                  <td>{m.name}</td>
                  <td>{m.phone}</td>
                  <td>{m.email}</td>
                  <td>{getDeptName(m.dept_id)}</td>
                  <td>{getWorkPeriod(m.join_date, m.leave_date)}</td>
                  <td>{getLevelName(m.level)}</td>
                  <td>{m.join_date}</td>
                  <td>{m.leave_date || "-"}</td>
                  <td>{m.status}</td>
                  <td>{m.duty}</td>
                  <td>
                    <button className="board_btn board_btn_small" onClick={() => openEdit(m)}>수정</button>
                    {m.status !== "퇴사" && (
                      <button
                        className="board_btn board_btn_small board_btn_cancel"
                        style={{marginLeft: 8}}
                        onClick={() => handleBlind(m.id)}
                      >퇴사처리</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 수정 모달 */}
        {modalOpen && (
          <div className="modal_overlay" onClick={() => setModalOpen(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">직원 정보 수정</h3>
              <form onSubmit={handleSave} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">직급</label>
                  <select
                    className="board_write_input"
                    value={editMember.level}
                    onChange={e => setEditMember(m => ({ ...m, level: Number(e.target.value) }))}
                  >
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">부서</label>
                  <select
                    className="board_write_input"
                    value={editMember.level}
                    onChange={e => setEditMember(m => ({ ...m, level: Number(e.target.value) }))}
                  >
                    {departments.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">재직상태</label>
                  <select
                    className="board_write_input"
                    value={editMember.status}
                    onChange={e => setEditMember(m => ({ ...m, status: e.target.value }))}
                  >
                    <option value="재직">재직</option>
                    <option value="퇴사">퇴사</option>
                  </select>
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">직무</label>
                  <input
                    className="board_write_input"
                    value={editMember.duty}
                    onChange={e => setEditMember(m => ({ ...m, duty: e.target.value }))}
                  />
                </div>
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">저장</button>
                  <button type="button" className="board_btn board_btn_cancel" onClick={() => setModalOpen(false)}>취소</button>
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
