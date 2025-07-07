'use client';

import React, { useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

// 예시: 직급 데이터 (실제 서비스라면 DB/API 연동)
const initialLevels = [
  { id: 1, name: "사원", description: "초급 직원" },
  { id: 2, name: "주임", description: "경력 직원" },
  { id: 3, name: "대리", description: "중간 관리자" },
  { id: 4, name: "과장", description: "관리자" },
];

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

export default function LevelManagePage() {
  const [levels, setLevels] = useState(initialLevels);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", description: "" });

  // 등록/수정 폼 열기
  const openForm = (level = null) => {
    if (level) {
      setEditMode(true);
      setForm(level);
    } else {
      setEditMode(false);
      setForm({ id: null, name: "", description: "" });
    }
    setModalOpen(true);
  };

  // 등록/수정 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("직급명을 입력하세요.");
      return;
    }
    if (editMode) {
      setLevels(prev =>
        prev.map(l => l.id === form.id ? { ...form } : l)
      );
    } else {
      setLevels(prev => [
        ...prev,
        { ...form, id: Date.now() }
      ]);
    }
    setModalOpen(false);
  };

  // 삭제
  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setLevels(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 level_manage_box">
          <div className="card_title font_700 mb_20">직급 관리</div>
          <div className="flex justify_between align_center mb_20">
            <span className="su_small_text">직급(레벨)을 생성·수정·삭제할 수 있습니다.</span>
            <button className="board_btn" onClick={() => openForm()}>+ 직급 등록</button>
          </div>
          <table className="level_table">
            <thead>
              <tr>
                <th style={{width: '30%'}}>직급명</th>
                <th style={{width: '50%'}}>설명</th>
                <th style={{width: '20%'}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {levels.length === 0 && (
                <tr>
                  <td colSpan={3} style={{textAlign: 'center', color: '#aaa'}}>등록된 직급이 없습니다.</td>
                </tr>
              )}
              {levels.map(l => (
                <tr key={l.id}>
                  <td><b>{l.name}</b></td>
                  <td>{l.description}</td>
                  <td>
                    <button className="board_btn board_btn_small" onClick={() => openForm(l)}>수정</button>
                    <button
                      className="board_btn board_btn_small board_btn_cancel"
                      style={{marginLeft: 8}}
                      onClick={() => handleDelete(l.id)}
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
            <h3 className="card_title font_700 mb_20">{editMode ? "직급 수정" : "직급 등록"}</h3>
            <form onSubmit={handleSubmit} className="flex flex_column gap_10">
              <div className="board_write_row">
                <label className="board_write_label">직급명</label>
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
                  placeholder="직급 설명(선택)"
                />
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
