'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import axios from "axios";
import React, {useState, useEffect, useCallback, useRef} from "react";
import {checkAuthStore} from "@/app/zustand/store";

// 부서명 → 부서ID 매핑 함수
function getDeptId(deptName, deptMap) {
  if (!deptMap[deptName]) {
    deptMap[deptName] = Object.keys(deptMap).length + 1;
  }
  return deptMap[deptName];
}

// 상세정보 모달
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
          <div className="modal_row"><b>성별</b> : {user.gender === "M" ? "남" : "여"}</div>
          {dept && <div className="modal_row"><b>소속팀</b> : {dept.name}</div>}
          <div className="modal_row"><b>입사일</b> : {user.hire_date}</div>
          <div className="modal_row"><b>이메일</b> : {user.email}</div>
        </div>
      </div>
    </div>
  );
}


export default function OrgChartHierarchy() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalUser, setModalUser] = useState(null);

  const api_url = process.env.NEXT_PUBLIC_API_URL;
  const block = checkAuthStore();
  const userLevelRef=useRef(0); //현재유저레벨

  // 부서 찾기
  const getDept = (user) => {
    if (!user?.dept_id) return null;
    return departments.find(d => d.id === user.dept_id);
  };


  useEffect(() => {
    async function fetchMembers() {
      try {
        callUserInfo();
        const { data } = await axios.post(`${api_url}/member/list`);
        // 1. 부서 정보 추출
        const deptMap = {};
        const departments = [];
        data.list.forEach(user => {
          const dept_id = getDeptId(user.dept_name, deptMap);
          if (!departments.find(d => d.id === dept_id)) {
            departments.push({ id: dept_id, name: user.dept_name });
          }
        });
        // 2. 사용자 정보 변환
        const users = data.list.map((user, idx) => ({
          id: idx + 1,
          user_id: user.user_id,
          name: user.name,
          position: user.lv_name,
          dept_id: getDeptId(user.dept_name, deptMap),
          hire_date: user.hire_date.slice(0, 10),
          email: user.email,
          gender: user.gender
        }));
        console.log(users);
        setUsers(users);
        setDepartments(departments);
      } catch (e) {
        alert("조직원 정보를 불러오지 못했습니다.");
      }
    }
    fetchMembers();
  }, [api_url]);

  const callUserInfo = async () => {
    let {data} = await axios.get(`${api_url}/mypage/info`, {headers: {Authorization: sessionStorage.getItem('token')}});
    userLevelRef.current = data.data.lv_idx;
  }

  // 계층 분류
  const ceo = users.find(u => u.position === "대표");

  //임직원 추가할거 있으면 여기 추가해야함
  const top_executives = users.filter(u => ["이사","본부장","부장","회장"].includes(u.position) && u.position !== "대표");

  const executives = users.filter(u =>
    ["이사", "부장", "차장", "팀장", "과장"].includes(u.position) && u.position !== "대표"
  );
  const teams = departments.map(dep => ({
    ...dep,
    leaders: executives.filter(u => u.dept_id === dep.id && ["부장", "차장", "팀장", "과장"].includes(u.position)),
    members: users.filter(u =>
      u.dept_id === dep.id &&
      ["사원", "주임", "대리"].includes(u.position)
    ),
  }));

  return (
    <div>
      <Header />
      <div className="wrap" style={{ padding: "60px 0", minHeight: "80vh" }}>
        <h2 className="card_title font_700 mb_30">조직도</h2>
        <div className="org_hierarchy_root">
          {/* 최고 직급 */}
          {ceo && (
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
          )}
          {/* 하위 직급(이사) */}
          <div className="org_level_executives">
            {top_executives.filter(u => u.dept_id).map((exec, idx) => (
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
                        <div className="org_card_sub">{leader.position}</div>
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
                      <div className="org_card_sub">{member.position}</div>
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
