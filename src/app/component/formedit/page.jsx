'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState } from "react";

const initialForms = [
  { id: 1, name: "연차", description: "연차 사용 신청 양식", blind: false },
  { id: 2, name: "지출", description: "지출 결재 양식", blind: false },
  { id: 3, name: "일반", description: "일반 결재 양식", blind: false }
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

export default function ApprovalFormManage() {
  const [forms, setForms] = useState(initialForms);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", description: "" });

  // 등록/수정 폼 열기
  const openForm = (f = null) => {
    if (f) {
      setEditMode(true);
      setForm(f);
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
      alert("양식명을 입력하세요.");
      return;
    }
    if (editMode) {
      setForms(prev =>
        prev.map(f => f.id === form.id ? { ...form } : f)
      );
    } else {
      setForms(prev => [
        ...prev,
        { ...form, id: Date.now(), blind: false }
      ]);
    }
    setModalOpen(false);
  };

  // 삭제
  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setForms(prev => prev.filter(f => f.id !== id));
    }
  };

  // 블라인드(숨김)
  const handleBlind = (id) => {
    setForms(prev =>
      prev.map(f => f.id === id ? { ...f, blind: true } : f)
    );
  };

  // 블라인드 해제
  const handleBlindRelease = (id) => {
    setForms(prev =>
      prev.map(f => f.id === id ? { ...f, blind: false } : f)
    );
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 approval_form_box">
          <div className="card_title font_700 mb_20">결재 양식 관리</div>
          <div className="flex justify_between align_center mb_20">
            <span className="su_small_text">결재 종류(양식)를 추가, 수정, 블라인드(숨김/해제), 삭제할 수 있습니다.</span>
            <button className="board_btn" onClick={() => openForm()}>+ 양식 등록</button>
          </div>
          <table className="approval_form_table">
            <thead>
              <tr>
                <th style={{width: '20%'}}>양식명</th>
                <th style={{width: '50%'}}>설명</th>
                <th style={{width: '10%'}}>상태</th>
                <th style={{width: '20%'}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {forms.length === 0 && (
                <tr>
                  <td colSpan={4} style={{textAlign: 'center', color: '#aaa'}}>등록된 결재 양식이 없습니다.</td>
                </tr>
              )}
              {forms.map(f => (
                <tr key={f.id} className={f.blind ? "blind_row" : ""}>
                  <td><b>{f.name}</b></td>
                  <td>{f.description}</td>
                  <td>
                    {f.blind
                      ? <span className="approval_form_blind">블라인드</span>
                      : <span className="approval_form_active">사용중</span>
                    }
                  </td>
                  <td>
                    <button className="board_btn board_btn_small" onClick={() => openForm(f)}>수정</button>
                    <button
                      className="board_btn board_btn_small board_btn_cancel"
                      style={{marginLeft: 8}}
                      onClick={() => handleDelete(f.id)}
                    >삭제</button>
                    {f.blind ? (
                      <button
                        className="board_btn board_btn_small"
                        style={{marginLeft: 8}}
                        onClick={() => handleBlindRelease(f.id)}
                      >해제</button>
                    ) : (
                      <button
                        className="board_btn board_btn_small"
                        style={{marginLeft: 8}}
                        onClick={() => handleBlind(f.id)}
                      >블라인드</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 등록/수정 모달 */}
        {modalOpen && (
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
            <h3 className="card_title font_700 mb_20">{editMode ? "양식 수정" : "양식 등록"}</h3>
            <form onSubmit={handleSubmit} className="flex flex_column gap_10">
              <div className="board_write_row">
                <label className="board_write_label">양식명</label>
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
                  placeholder="양식 설명(선택)"
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
