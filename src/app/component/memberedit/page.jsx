'use client';

import React, { useEffect, useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import axios from "axios";
import {checkAuthStore, useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "@/app/component/alertmodal/page";


function getWorkPeriod(join, leave) {
  if (!join) return "-";
  const start = new Date(join);
  const end = leave ? new Date(leave) : new Date();
  const diff = end.getFullYear() - start.getFullYear();
  return `${diff}년`;
}

function formatDate(dateStr, locale){

  let date = new Date(dateStr);
  return date.toLocaleDateString(locale);
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function MemberManagePage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const blockId = checkAuthStore();
  const alertModal = useAlertModalStore();

  async function memberList() {
    let {data} = await axios.post(`${apiUrl}/member/list`);
    setMembers(data.list);
  }

  async function lvList() {
    try {
      const { data } = await axios.post(`${apiUrl}/level/list`);
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

  async function deptList() {
    try {
      const { data } = await axios.post(`${apiUrl}/dept/list`);
      console.log('dept',data);
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

  useEffect(()=>{
    blockId.redirect({session:sessionStorage, alert:alertModal});
    memberList();
    deptList();
    lvList();
  },[])

  // 검색 필터
  const filtered = members.filter(m =>
    m.user_id.includes(search) || m.name.includes(search)
  );

  // 수정 모달 열기
  const openEdit = (m) => {
 if(departments.filter(d => d.status === false).length === 1) {
    const singleDept = departments.find(d => d.status === false);
    setEditMember({ ...m, dept_idx: singleDept?.id || m.dept_idx });
  } else {
    setEditMember({ ...m });
  }
  setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
      console.log('저장 전 editMember:', editMember);  // <--- 이거 추가
    let { data } = await axios.post(
      `${apiUrl}/member/list/update`,
      { ...editMember, hire_end_date: null }
    );
    if (data && data.suc) {
      setMembers(prev =>
        prev.map(m => m.user_id === editMember.user_id ? { ...editMember, hire_end_date: null } : m)
      );
      setModalOpen(false);
      await memberList();
    } else {
      alert('수정실패');
    }
  };

  const handleBlind = async (user_id) => {
    if (window.confirm("정말 퇴사처리(블라인드) 하시겠습니까?")) {
      const { data } = await axios.post(`${apiUrl}/member/list/delete`, { user_id });
      if (data && data.suc) {
        setMembers(prev =>
          prev.map(m =>
            m.user_id === user_id
              ? { ...m, status: "퇴사"}
              : m
          )
        );
        await memberList();
      } else {
        alert("퇴사처리에 실패했습니다.");
      }
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
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="member_table">
              <thead>
                <tr>
                  <th>아이디</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>성별</th>
                  <th>부서</th>
                  <th>부서 근무기간</th>
                  <th>직급</th>
                  <th>입사일</th>
                  <th>퇴사일</th>
                  <th>재직상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{textAlign: 'center', color: '#aaa'}}>검색 결과가 없습니다.</td>
                </tr>
              )}
              {filtered.map((m,index) => (
                <tr key={index} className={m.status == "퇴사" ? "blind_row" : ""}>
                  <td>{m.blind ? "블라인드" : m.user_id}</td>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.gender == 'M' ? "남자" : "여자"}</td>
                  <td>{m.dept_name}</td>
                  <td>{getWorkPeriod(m.hire_date)}</td>
                  <td>{m.lv_name}</td>
                  <td>{formatDate(m.hire_date,"ko-KR")}</td>
                  <td>{m.hire_end_date == null ? "-" : formatDate(m.hire_end_date,"ko-KR")}</td>
                  <td>{m.status}</td>
                  <td className="keyword_manage_actions">
                    <button className="board_btn board_btn_small" onClick={() => openEdit(m)}>수정</button>
                    {m.status !== "퇴사" && (
                      <button
                        className="board_btn board_btn_small board_btn_cancel"
                        onClick={() => handleBlind(m.user_id)}
                      >퇴사처리</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        {/* 수정 모달 */}
        {modalOpen && (
          <div className="modal_overlay" onClick={() => setModalOpen(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">직원 정보 수정</h3>
              <form onSubmit={handleSave} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">아이디</label>
                  <input
                    className="board_write_input"
                    value={editMember.user_id}
                    readOnly
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">직급</label>
                  <select
                    className="board_write_input"
                    value={editMember.lv_idx}
                    onChange={e => setEditMember(m => ({ ...m, lv_idx: Number(e.target.value) }))}
                  >
                    {levels
                      .filter(d => d.status === false)
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">부서</label>
                   {departments.filter(d => d.status === false).length > 1 ? (
                    <select
                      className="board_write_input"
                      value={editMember.dept_idx}
                      onChange={e => {
                        const val = Number(e.target.value);
                        console.log("onChange dept_idx 값 변경:", val);
                        setEditMember(m => ({ ...m, dept_idx: val }));
                      }}
                    >
                      {departments
                        .filter(d => d.status === false)
                        .map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))
                      }
                    </select>
                  ) : (
                    // 부서가 1개일 때는 해당 부서명 텍스트로 보여줌
                    <input
                      className="board_write_input"
                      type="text"
                      readOnly
                      value={
                        // departments가 있고, editMember.dept_idx에 해당하는 부서명 표시
                        departments.length === 1
                          ? departments[0].name
                          : departments.find(d => d.id === editMember.dept_idx)?.name || ""
                      }
                    />
                  )}
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
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">저장</button>
                  <button type="button" className="board_btn board_btn_cancel" onClick={() => setModalOpen(false)}>취소</button>
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
