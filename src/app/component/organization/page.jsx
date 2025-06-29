'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import React, { useState, useEffect, useCallback } from "react";

const users = [
  { id: 1, name: "홍대표", position: "대표", grade: "S", dept_id: null, hire_date: "2017-01-01", phone: "010-1111-1111", email: "ceo@bytehub.com" },
  { id: 2, name: "이이사", position: "이사", grade: "A", dept_id: null, hire_date: "2018-03-10", phone: "010-2222-2222", email: "director@bytehub.com" },
  { id: 3, name: "김부장", position: "부장", grade: "A", dept_id: 1, hire_date: "2019-05-15", phone: "010-3333-3333", email: "manager@bytehub.com" },
  { id: 4, name: "최차장", position: "차장", grade: "B", dept_id: 2, hire_date: "2020-09-21", phone: "010-4444-4444", email: "submanager@bytehub.com" },
  { id: 5, name: "박팀장", position: "팀장", grade: "A", dept_id: 1, hire_date: "2021-02-05", phone: "010-5555-5555", email: "leader@bytehub.com" },
  { id: 6, name: "이주임", position: "주임", grade: "B", dept_id: 1, hire_date: "2022-06-12", phone: "010-6666-6666", email: "junior@bytehub.com" },
  { id: 7, name: "정사원", position: "사원", grade: "C", dept_id: 2, hire_date: "2023-01-10", phone: "010-7777-7777", email: "staff@bytehub.com" },
  { id: 8, name: "유대리", position: "대리", grade: "B", dept_id: 2, hire_date: "2023-05-20", phone: "010-8888-8888", email: "assistant@bytehub.com" },
];

const departments = [
  { id: 1, name: "프론트엔드" },
  { id: 2, name: "백엔드" },
  { id: 3, name: "디자인팀" },
];

// 계층 분류
const ceo = users.find(u => u.position === "대표");
const executives = users.filter(u => ["이사", "부장", "차장", "팀장"].includes(u.position) && u.position !== "대표");
const teams = departments.map(dep => ({
  ...dep,
  leaders: executives.filter(u => u.dept_id === dep.id && ["부장", "차장", "팀장"].includes(u.position)),
  members: users.filter(u =>
    u.dept_id === dep.id &&
    ["사원", "주임", "대리"].includes(u.position)
  ),
}));

function MemberModal({ user, dept, onClose }) {
  const handleKeyDown = useCallback(e => {
    if (e.key === "Escape") onClose();
  }, [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!user) return null;
  return (
    <div className="modal_overlay" onClick={onClose}>
      <div className="modal_content" onClick={e => e.stopPropagation()}>
        <button className="modal_close" onClick={onClose} aria-label="닫기">×</button>
        <div className="modal_title font_700">{user.name}</div>
        <div className="modal_body">
          <div className="modal_row"><b>직책</b> : {user.position}</div>
          <div className="modal_row"><b>직급</b> : {user.grade}</div>
          {dept && <div className="modal_row"><b>소속팀</b> : {dept.name}</div>}
          <div className="modal_row"><b>입사일</b> : {user.hire_date}</div>
          <div className="modal_row"><b>연락처</b> : {user.phone}</div>
          <div className="modal_row"><b>이메일</b> : {user.email}</div>
        </div>
      </div>
    </div>
  );
}

export default function OrgChartHierarchy() {
  const [modalUser, setModalUser] = useState(null);

  // 부서 찾기
  const getDept = (user) => {
    if (!user.dept_id) return null;
    return departments.find(d => d.id === user.dept_id);
  };

  return (
    <div>
      <Header />
      <div className="wrap" style={{ padding: "60px 0", minHeight: "80vh" }}>
        <h2 className="card_title font_700 mb_30">조직도</h2>
        <div className="org_hierarchy_root">
          {/* 최고 직급 */}
          <div className="org_level_ceo">
            <div
              className="org_card org_ceo_card org_fadein_top"
              tabIndex={0}
              onClick={() => setModalUser(ceo)}
              style={{ cursor: "pointer", animationDelay: "0.05s" }}
            >
              <div className="org_card_title">{ceo.name}</div>
              <div className="org_card_sub">{ceo.position}</div>
            </div>
          </div>
          {/* 하위 직급(이사/부장/차장/팀장) */}
          <div className="org_level_executives">
            {executives.filter(u => !u.dept_id).map((exec, idx) => (
              <div
                key={exec.id}
                className="org_card org_exec_card org_fadein_left"
                tabIndex={0}
                onClick={() => setModalUser(exec)}
                style={{
                  cursor: "pointer",
                  animationDelay: `${0.15 + idx * 0.12}s`
                }}
              >
                <div className="org_card_title">{exec.name}</div>
                <div className="org_card_sub">{exec.position}</div>
              </div>
            ))}
          </div>
          {/* 팀(부서) 및 팀원 */}
          <div className="org_level_teams">
            {teams.map((team, tIdx) => (
              <div key={team.id} className="org_team_group">
                <div
                  className="org_card org_team_card org_fadein_right"
                  style={{ animationDelay: `${0.35 + tIdx * 0.16}s` }}
                >
                  <div className="org_card_title">{team.name}</div>
                  <div className="org_card_sub">팀 ID: {team.id}</div>
                  <div className="org_team_leaders">
                    {team.leaders.map((leader, lIdx) => (
                      <div
                        key={leader.id}
                        className="org_card org_leader_card org_fadein_left"
                        tabIndex={0}
                        onClick={() => setModalUser(leader)}
                        style={{
                          cursor: "pointer",
                          animationDelay: `${0.5 + tIdx * 0.16 + lIdx * 0.07}s`
                        }}
                      >
                        <div className="org_card_title">{leader.name}</div>
                        <div className="org_card_sub">{leader.position} / {leader.grade}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="org_team_members">
                  {team.members.map((member, mIdx) => (
                    <div
                      key={member.id}
                      className="org_card org_member_card org_fadein_right"
                      tabIndex={0}
                      onClick={() => setModalUser(member)}
                      style={{
                        cursor: "pointer",
                        animationDelay: `${0.7 + tIdx * 0.16 + mIdx * 0.09}s`
                      }}
                    >
                      <div className="org_card_title">{member.name}</div>
                      <div className="org_card_sub">{member.position} / {member.grade}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 상세정보 모달 */}
      <MemberModal
        user={modalUser}
        dept={modalUser && getDept(modalUser)}
        onClose={() => setModalUser(null)}
      />
      <Footer />
    </div>
  );
}
