'use client';

import React, { useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

const initialMembers = [
  { id: "hong123", name: "홍길동" },
  { id: "kim456", name: "김철수" },
  { id: "lee789", name: "이영희" },
];

const initialDepartments = [
  { id: 1, name: "백엔드팀", description: "서버 개발팀", manager_id: "hong123" },
  { id: 2, name: "프론트팀", description: "프론트엔드 개발팀", manager_id: "kim456" },
];

function getMemberName(id, members) {
  return members.find(m => m.id === id)?.name || "-";
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

export default function DepartmentManagePage() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [members] = useState(initialMembers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", description: "", manager_id: "" });

  // 등록/수정 폼 열기
  const openForm = (dept = null) => {
    if (dept) {
      setEditMode(true);
      setForm(dept);
    } else {
      setEditMode(false);
      setForm({ id: null, name: "", description: "", manager_id: "" });
    }
    setModalOpen(true);
  };

  // 등록/수정 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.manager_id) {
      alert("부서명과 팀장을 입력하세요.");
      return;
    }
    if (editMode) {
      setDepartments(prev =>
        prev.map(d => d.id === form.id ? { ...form } : d)
      );
    } else {
      setDepartments(prev => [
        ...prev,
        { ...form, id: Date.now() }
      ]);
    }
    setModalOpen(false);
  };

  // 삭제
  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setDepartments(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 department_manage_box">
          <div className="card_title font_700 mb_20">부서(팀) 관리</div>
          <div className="flex justify_between align_center mb_20">
            <span className="su_small_text">부서(팀)을 생성·수정하고, 팀장을 지정할 수 있습니다.</span>
            <button className="board_btn" onClick={() => openForm()}>+ 부서 등록</button>
          </div>
          <table className="department_table">
            <thead>
              <tr>
                <th style={{width: '20%'}}>부서명</th>
                <th style={{width: '45%'}}>설명</th>
                <th style={{width: '20%'}}>팀장</th>
                <th style={{width: '15%'}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 && (
                <tr>
                  <td colSpan={4} style={{textAlign: 'center', color: '#aaa'}}>등록된 부서가 없습니다.</td>
                </tr>
              )}
              {departments.map(d => (
                <tr key={d.id}>
                  <td><b>{d.name}</b></td>
                  <td>{d.description}</td>
                  <td>{getMemberName(d.manager_id, members)}</td>
                  <td>
                    <button className="board_btn board_btn_small" onClick={() => openForm(d)}>수정</button>
                    <button
                      className="board_btn board_btn_small board_btn_cancel"
                      style={{marginLeft: 8}}
                      onClick={() => handleDelete(d.id)}
                    >삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 등록/수정 모달 */}
        {modalOpen && (
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
            <h3 className="card_title font_700 mb_20">{editMode ? "부서 수정" : "부서 등록"}</h3>
            <form onSubmit={handleSubmit} className="flex flex_column gap_10">
              <div className="board_write_row">
                <label className="board_write_label">부서명</label>
                <input
                  type="text"
                  className="board_write_input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="board_write_row">
                <label className="board_write_label">설명</label>
                <input
                  type="text"
                  className="board_write_input"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="부서 설명(선택)"
                />
              </div>
              <div className="board_write_row">
                <label className="board_write_label">팀장 지정</label>
                <select
                  className="board_write_input"
                  value={form.manager_id}
                  onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}
                  required
                >
                  <option value="">팀장 선택</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal_buttons">
                <button type="submit" className="board_btn">{editMode ? "수정" : "등록"}</button>
                <button type="button" className="board_btn board_btn_cancel" onClick={() => setModalOpen(false)}>취소</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
      <Footer />
    </div>
  );
}
