'use client';

import React, { useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

const initialKeywords = [
  { id: 1, keyword: "인사", answer: "안녕하세요! 무엇을 도와드릴까요?", description: "기본 인삿말" },
  { id: 2, keyword: "연차", answer: "연차 신청은 근태 메뉴에서 가능합니다.", description: "연차 안내" },
];

export default function KeywordManagePage() {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, keyword: "", answer: "", description: "" });

  // 등록/수정 폼 열기
  const openForm = (kw = null) => {
    if (kw) {
      setEditMode(true);
      setForm(kw);
    } else {
      setEditMode(false);
      setForm({ id: null, keyword: "", answer: "", description: "" });
    }
    setModalOpen(true);
  };

  // 등록/수정 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.answer.trim()) {
      alert("키워드와 답변을 입력하세요.");
      return;
    }
    if (editMode) {
      setKeywords(prev =>
        prev.map(k => k.id === form.id ? { ...form } : k)
      );
    } else {
      setKeywords(prev => [
        ...prev,
        { ...form, id: Date.now() }
      ]);
    }
    setModalOpen(false);
  };

  // 삭제
  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setKeywords(prev => prev.filter(k => k.id !== id));
    }
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 keyword_manage_box">
          <div className="card_title font_700 mb_20">챗봇 키워드 관리</div>
          <div className="flex justify_between align_center mb_20">
            <span className="su_small_text">챗봇에서 사용하는 키워드를 등록·수정·삭제할 수 있습니다.</span>
            <button className="board_btn" onClick={() => openForm()}>+ 키워드 등록</button>
          </div>
          <table className="keyword_table">
            <thead>
              <tr>
                <th style={{width: '18%'}}>키워드</th>
                <th style={{width: '40%'}}>답변</th>
                <th style={{width: '25%'}}>설명</th>
                <th style={{width: '17%'}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {keywords.length === 0 && (
                <tr>
                  <td colSpan={4} style={{textAlign: 'center', color: '#aaa'}}>등록된 키워드가 없습니다.</td>
                </tr>
              )}
              {keywords.map(kw => (
                <tr key={kw.id}>
                  <td><b>{kw.keyword}</b></td>
                  <td>{kw.answer}</td>
                  <td>{kw.description}</td>
                  <td>
                    <button className="board_btn board_btn_small" onClick={() => openForm(kw)}>수정</button>
                    <button className="board_btn board_btn_small board_btn_cancel" style={{marginLeft: 8}} onClick={() => handleDelete(kw.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 등록/수정 모달 */}
        {modalOpen && (
          <div className="modal_overlay" onClick={() => setModalOpen(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">{editMode ? "키워드 수정" : "키워드 등록"}</h3>
              <form onSubmit={handleSubmit} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">키워드</label>
                  <input
                    type="text"
                    className="board_write_input"
                    value={form.keyword}
                    onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">답변</label>
                  <textarea
                    className="board_write_input"
                    value={form.answer}
                    onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                    required
                    rows={3}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">설명</label>
                  <input
                    type="text"
                    className="board_write_input"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="키워드 설명(선택)"
                  />
                </div>
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">{editMode ? "수정" : "등록"}</button>
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
