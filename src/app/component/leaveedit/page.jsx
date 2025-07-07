'use client';

import React, { useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

const initialPolicy = {
  year: 2025,
  annual: 15,
  monthly: 12,
  sick: 15,
  annualStartMonth: 1,
  sickStartMonth: 1,
  monthlyStartMonth: 1,
};

const initialMembers = [
  {
    id: "hong123",
    name: "홍길동",
    join_date: "2022-01-01",
    annual_used: 3,
    monthly_used: 2,
    sick_used: 0,
  },
  {
    id: "kim456",
    name: "김철수",
    join_date: "2023-06-15",
    annual_used: 1,
    monthly_used: 1,
    sick_used: 0,
  },
];

// 연차 자동 계산 함수 (입사일 기준, 1년 만근 15개, 3년차 15개, 1달 1개 등)
function calcAnnualTotal(join_date, now = new Date(), base = 15) {
  if (!join_date) return 0;
  const join = new Date(join_date);
  const years = now.getFullYear() - join.getFullYear();
  if (years < 1) {
    const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    return Math.min(months, 11);
  } else if (years === 1) {
    return 15;
  } else if (years >= 3) {
    return 15;
  } else {
    return 15;
  }
}
function calcMonthlyTotal(join_date, now = new Date(), base = 12) {
  if (!join_date) return 0;
  const join = new Date(join_date);
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  return Math.min(months + 1, base);
}
function calcSickTotal(policy) {
  return policy.sick;
}

export default function VacationEditPage() {
  const [policy, setPolicy] = useState(initialPolicy);
  const [members, setMembers] = useState(initialMembers);
  const [editPolicy, setEditPolicy] = useState(false);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editMember, setEditMember] = useState(null);

  // 정책 저장
  const handlePolicySave = (e) => {
    e.preventDefault();
    setPolicy(prev => ({
      ...prev,
      annual: Number(policy.annual),
      monthly: Number(policy.monthly),
      sick: Number(policy.sick),
      annualStartMonth: Number(policy.annualStartMonth),
      sickStartMonth: Number(policy.sickStartMonth),
      monthlyStartMonth: Number(policy.monthlyStartMonth),
    }));
    setEditPolicy(false);
  };

  // 연차/월차/병가 사용(1일 차감)
  const handleUse = (id, type) => {
    setMembers(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, [`${type}_used`]: m[`${type}_used`] + 1 }
          : m
      )
    );
  };

  // 연차/월차/병가 직접 수정 모달
  const openEditModal = (m) => {
    setEditMember({ ...m });
    setEditModal(true);
  };
  const handleEditSave = (e) => {
    e.preventDefault();
    setMembers(prev =>
      prev.map(m => m.id === editMember.id ? { ...editMember } : m)
    );
    setEditModal(false);
  };

  // 검색 필터
  const filtered = members.filter(m =>
    m.id.includes(search) || m.name.includes(search)
  );

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 vacation_policy_box">
          <div className="card_title font_700 mb_20">연차/월차/병가 수정</div>
          <div className="flex justify_between align_center mb_20">
            <form onSubmit={e => e.preventDefault()} className="flex gap_10">
              <input
                className="board_write_input"
                style={{width: 220}}
                placeholder="이름/아이디 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>
            <button className="board_btn" onClick={() => setEditPolicy(true)}>정책 수정</button>
          </div>
          <table className="vacation_policy_table">
            <thead>
              <tr>
                <th>년도</th>
                <th>연차(개)</th>
                <th>월차(개)</th>
                <th>병가(개)</th>
                <th>연차 시작월</th>
                <th>월차 시작월</th>
                <th>병가 시작월</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{policy.year}</td>
                <td>{policy.annual}</td>
                <td>{policy.monthly}</td>
                <td>{policy.sick}</td>
                <td>{policy.annualStartMonth}월</td>
                <td>{policy.monthlyStartMonth}월</td>
                <td>{policy.sickStartMonth}월</td>
              </tr>
            </tbody>
          </table>
          <div className="card_title font_700 mt_30 mb_10">사원별 연차/월차/병가 현황</div>
          <table className="vacation_member_table">
            <thead>
              <tr>
                <th>이름</th>
                <th>아이디</th>
                <th>입사일</th>
                <th>연차(잔여/총)</th>
                <th>월차(잔여/총)</th>
                <th>병가(잔여/총)</th>
                <th>수정/사용</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{textAlign: 'center', color: '#aaa'}}>검색 결과가 없습니다.</td>
                </tr>
              )}
              {filtered.map(m => {
                const annualTotal = calcAnnualTotal(m.join_date, new Date(), policy.annual);
                const monthlyTotal = calcMonthlyTotal(m.join_date, new Date(), policy.monthly);
                const sickTotal = calcSickTotal(policy);
                return (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.id}</td>
                    <td>{m.join_date}</td>
                    <td>
                      <b>{annualTotal - m.annual_used}</b> / {annualTotal}
                    </td>
                    <td>
                      <b>{monthlyTotal - m.monthly_used}</b> / {monthlyTotal}
                    </td>
                    <td>
                      <b>{sickTotal - m.sick_used}</b> / {sickTotal}
                    </td>
                    <td>
                      <button className="board_btn board_btn_small" onClick={() => openEditModal(m)}>직접수정</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 정책 수정 모달 */}
        {editPolicy && (
          <div className="modal_overlay" onClick={() => setEditPolicy(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">정책 수정</h3>
              <form onSubmit={handlePolicySave} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">연차(개)</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={policy.annual}
                    min={1}
                    max={30}
                    onChange={e => setPolicy(p => ({ ...p, annual: e.target.value }))}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">월차(개)</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={policy.monthly}
                    min={1}
                    max={12}
                    onChange={e => setPolicy(p => ({ ...p, monthly: e.target.value }))}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">병가(개)</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={policy.sick}
                    min={1}
                    max={30}
                    onChange={e => setPolicy(p => ({ ...p, sick: e.target.value }))}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">연차 시작월</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={policy.annualStartMonth}
                    min={1}
                    max={12}
                    onChange={e => setPolicy(p => ({ ...p, annualStartMonth: e.target.value }))}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">월차 시작월</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={policy.monthlyStartMonth}
                    min={1}
                    max={12}
                    onChange={e => setPolicy(p => ({ ...p, monthlyStartMonth: e.target.value }))}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">병가 시작월</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={policy.sickStartMonth}
                    min={1}
                    max={12}
                    onChange={e => setPolicy(p => ({ ...p, sickStartMonth: e.target.value }))}
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

        {/* 연차/월차/병가 직접 수정 모달 */}
        {editModal && (
          <div className="modal_overlay" onClick={() => setEditModal(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">연차/월차/병가 직접 수정</h3>
              <form onSubmit={handleEditSave} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">연차 사용</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={editMember.annual_used}
                    min={0}
                    max={calcAnnualTotal(editMember.join_date, new Date(), policy.annual)}
                    onChange={e => setEditMember(m => ({ ...m, annual_used: Number(e.target.value) }))}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">월차 사용</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={editMember.monthly_used}
                    min={0}
                    max={calcMonthlyTotal(editMember.join_date, new Date(), policy.monthly)}
                    onChange={e => setEditMember(m => ({ ...m, monthly_used: Number(e.target.value) }))}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">병가 사용</label>
                  <input
                    type="number"
                    className="board_write_input"
                    value={editMember.sick_used}
                    min={0}
                    max={calcSickTotal(policy)}
                    onChange={e => setEditMember(m => ({ ...m, sick_used: Number(e.target.value) }))}
                  />
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
