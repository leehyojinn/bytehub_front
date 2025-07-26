'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import {checkAuthStore, useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "@/app/component/alertmodal/page";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ id: null, name: "" });
  const blockId = checkAuthStore();

  const api_url = process.env.NEXT_PUBLIC_API_URL;
  const alertModal = useAlertModalStore();

  // 부서 목록 불러오기
  async function deptList() {
    try {
      const { data } = await axios.post(`${api_url}/dept/list`);
      setDepartments(
        data.list.map(d => ({
          id: d.dept_idx,
          name: d.dept_name,
          status: d.status,
        }))
      );
    } catch (e) {
      alert("부서 목록을 불러오지 못했습니다.");
    }
  }

  // 등록
  async function deptInsert() {
    const payload = {
      dept_name: form.name,
    };
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
      });
    } else {
      setEditMode(false);
      setForm({ id: null, name: "" });
    }
    setModalOpen(true);
  };

  // 등록/수정 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("부서명을 입력하세요.");
      return;
    }
    if (editMode) {
      await deptUpdate();
    } else {
      await deptInsert();
    }
  };

  useEffect(() => {
    blockId.redirect({session:sessionStorage, alert:alertModal});
    deptList();
  }, []);

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 department_manage_box">
          <div className="card_title font_700 mb_20">부서(팀) 관리</div>
          <div className="flex justify_between align_center mb_20">
            <span className="su_small_text">부서(팀)을 생성·수정할 수 있습니다.</span>
            <button className="board_btn" onClick={() => openForm()}>+ 부서 등록</button>
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="department_table">
              <thead>
                <tr>
                  <th style={{ width: '70%' }}>부서명</th>
                  <th style={{ width: '30%' }}>관리</th>
                </tr>
              </thead>
              <tbody>
              {departments.filter(d => d.status !== true).length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', color: '#aaa' }}>등록된 부서가 없습니다.</td>
                </tr>
              )}
              {departments
                .filter(d => d.status !== true)
                .map(d => (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td className="keyword_manage_actions">
                      <button className="board_btn board_btn_small" onClick={() => openForm(d)}>수정</button>
                      <button
                        className="board_btn board_btn_small board_btn_cancel"
                        onClick={() => deptDelete(d.id)}
                      >삭제</button>
                    </td>
                  </tr>
                ))}
            </tbody>
            </table>
          </div>
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
              <div className="modal_buttons">
                <button type="submit" className="board_btn">{editMode ? "수정" : "등록"}</button>
                <button type="button" className="board_btn board_btn_cancel" onClick={() => setModalOpen(false)}>취소</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
      <AlertModal/>
      <Footer />
    </div>
  );
}
