'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

// 팀장 이름 매핑 함수
function getMemberName(id, members) {
  return members.find(m => m.id === id)?.name || "-";
}

// 모달 컴포넌트
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
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // description 필드 제거
  const [form, setForm] = useState({ id: null, name: "", user_id: "" });

  const api_url = process.env.NEXT_PUBLIC_API_URL;

  console.log(departments);

  // 부서/멤버 목록 불러오기
  async function deptList() {
    try {
      const { data } = await axios.post(`${api_url}/dept/list`);
      setDepartments(
        data.list.map(d => ({
          id: d.dept_idx,
          name: d.dept_name,
          status: d.status,
          user_id: d.user_id || "",
        }))
      );
      setMembers(
        data.member.map(m => ({
          id: m.user_id,
          name: m.name,
        }))
      );
    } catch (e) {
      alert("부서/멤버 목록을 불러오지 못했습니다.");
    }
  }

  // 등록
  async function deptInsert() {
    const payload = {
      dept_name: form.name,
      user_id: form.user_id,
    };
    console.log(payload);
    const { data } = await axios.post(`${api_url}/dept/insert`, payload);
    if (data.suc) {
      deptList();
      setModalOpen(false);
    } else {
      alert("등록 실패!");
    }
  }

  // 수정
  async function deptUpdate() {
    const payload = {
      dept_idx: form.id,
      dept_name: form.name,
      user_id: form.user_id,
    };
    const { data } = await axios.post(`${api_url}/dept/update`, payload);
    if (data.suc) {
      deptList();
      setModalOpen(false);
    } else {
      alert("수정 실패!");
    }
  }

  // 삭제
  async function deptDelete(id) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const payload = { dept_idx: id };
    const { data } = await axios.post(`${api_url}/dept/delete`, payload);
    if (data.suc) {
      deptList();
    } else {
      alert("삭제 실패!");
    }
  }

  // 폼 열기
  const openForm = (dept = null) => {
    if (dept) {
      setEditMode(true);
      setForm({
        id: dept.id,
        name: dept.name,
        user_id: dept.user_id,
      });
    } else {
      setEditMode(false);
      setForm({ id: null, name: "", user_id: "" });
    }
    setModalOpen(true);
  };

  // 등록/수정 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.user_id) {
      alert("부서명과 팀장을 입력하세요.");
      return;
    }
    if (editMode) {
      await deptUpdate();
    } else {
      await deptInsert();
    }
  };

  useEffect(() => {
    deptList();
  }, []);

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
                <th style={{ width: '35%' }}>부서명</th>
                <th style={{ width: '35%' }}>팀장</th>
                <th style={{ width: '30%' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {departments.filter(d => d.status !== true).length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#aaa' }}>등록된 부서가 없습니다.</td>
                </tr>
              )}
              {departments
                .filter(d => d.status !== true)
                .map(d => (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td>{getMemberName(d.user_id, members)}</td>
                    <td>
                      <button className="board_btn board_btn_small" onClick={() => openForm(d)}>수정</button>
                      <button
                        className="board_btn board_btn_small board_btn_cancel"
                        style={{ marginLeft: 8 }}
                        onClick={() => deptDelete(d.id)}
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
                <label className="board_write_label">팀장 지정</label>
                <select
                  className="board_write_input"
                  value={form.user_id}
                  onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
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
