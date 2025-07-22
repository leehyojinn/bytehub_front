'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import {checkAuthStore} from "@/app/zustand/store";

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
  const [levels, setLevels] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", description: "" });

  const api_url = process.env.NEXT_PUBLIC_API_URL;
  const blockId = checkAuthStore();

  // 목록 불러오기
  async function lvList() {
    try {
      const { data } = await axios.post(`${api_url}/level/list`);
      setLevels(
        data.list
          .filter(l => l.status !== true) // status=1(삭제) 제외
          .map(l => ({
            id: l.lv_idx,
            name: l.lv_name,
            description: l.description || "",
            status: l.status,
          }))
      );
    } catch (e) {
      alert("직급 목록을 불러오지 못했습니다.");
    }
  }

  // 등록
  async function lvInsert() {
    const payload = {
      lv_name: form.name,
      description: form.description,
    };
    const { data } = await axios.post(`${api_url}/level/insert`, payload);
    if (data.suc) {
      lvList();
      setModalOpen(false);
    } else {
      alert("등록 실패!");
    }
  }

  // 수정
  async function lvUpdate() {
    const payload = {
      lv_idx: form.id,
      lv_name: form.name,
      description: form.description,
    };
    const { data } = await axios.post(`${api_url}/level/update`, payload);
    if (data.suc) {
      lvList();
      setModalOpen(false);
    } else {
      alert("수정 실패!");
    }
  }

  // 삭제 (status=1로 soft delete)
  async function lvDelete(id) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const payload = { lv_idx: id };
    const { data } = await axios.post(`${api_url}/level/delete`, payload);
    if (data.suc) {
      lvList();
    } else {
      alert("삭제 실패!");
    }
  }

  // 폼 열기
  const openForm = (level = null) => {
    if (level) {
      setEditMode(true);
      setForm({
        id: level.id,
        name: level.name,
        description: level.description,
      });
    } else {
      setEditMode(false);
      setForm({ id: null, name: "", description: "" });
    }
    setModalOpen(true);
  };

  // 등록/수정 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("직급명을 입력하세요.");
      return;
    }
    if (editMode) {
      await lvUpdate();
    } else {
      await lvInsert();
    }
  };

  useEffect(() => {
    blockId.redirect({session:sessionStorage});
    lvList();
  }, []);

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
                      onClick={() => lvDelete(l.id)}
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
