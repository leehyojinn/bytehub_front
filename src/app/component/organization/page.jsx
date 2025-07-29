'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { checkAuthStore } from "@/app/zustand/store";

// 상세정보 모달
function MemberModal({ user, dept, onClose }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!user) return null;
  return (
    <div className="modal_overlay" onClick={onClose}>
      <div className="modal_content" onClick={(e) => e.stopPropagation()}>
        <button className="modal_close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="modal_title font_700">{user.name}</div>
        <div className="modal_body">
          <div className="modal_row">
            <b>직책</b> : {user.position}
          </div>
          <div className="modal_row">
            <b>성별</b> : {user.gender === "M" ? "남" : "여"}
          </div>
          {dept && (
            <div className="modal_row">
              <b>소속팀</b> : {dept.name}
            </div>
          )}
          <div className="modal_row">
            <b>입사일</b> : {user.hire_date}
          </div>
          <div className="modal_row">
            <b>이메일</b> : {user.email}
          </div>
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

  const TEMP_DEPT_ID = -1;
  const TEMP_DEPT_NAME = "임시팀";

  // 부서 찾기
  const getDept = (user) => {
    if (!user?.dept_id) return null;
    if (user.dept_id === TEMP_DEPT_ID) {
      return { id: TEMP_DEPT_ID, name: TEMP_DEPT_NAME };
    }
    return departments.find((d) => d.id === user.dept_id);
  };

  // 부서 리스트 로드 및 활성화 필터링
  const fetchDepartments = async () => {
    try {
      const { data } = await axios.post(`${api_url}/dept/list`);
      const activeDepts = data.list
        .filter((d) => d.status === false)
        .map((d) => ({
          ...d,
          id: Number(d.dept_idx),
          name: d.dept_name,
          status: d.status,
        }));
      setDepartments(activeDepts);
    } catch (e) {
      alert("부서 목록을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (departments.length === 0) return;

    const fetchMembers = async () => {
      try {
        // 임원 우선순위 (대표, 사장, 회장, 이사)
        const executiveOrder = ["대표", "사장", "회장", "이사"];

        const { data } = await axios.post(`${api_url}/member/list`);

        const activeDeptIds = new Set(departments.map((d) => d.id));
        const deptIdToName = departments.reduce((acc, cur) => {
          acc[cur.id] = cur.name;
          return acc;
        }, {});

        // 멤버 매핑
        const mappedUsers = data.list.map((user, idx) => {
          const isExecutive = executiveOrder.includes(user.lv_name);
          const userDeptId = Number(user.dept_idx);
          const hasValidDept = userDeptId && activeDeptIds.has(userDeptId);

          return {
            id: idx + 1,
            user_id: user.user_id,
            name: user.name,
            position: user.lv_name,
            dept_id: isExecutive ? null : hasValidDept ? userDeptId : TEMP_DEPT_ID,
            dept_name: isExecutive
              ? null
              : hasValidDept
              ? deptIdToName[userDeptId]
              : TEMP_DEPT_NAME,
            hire_date: user.hire_date ? user.hire_date.slice(0, 10) : "",
            email: user.email,
            gender: user.gender,
            isExecutive,
          };
        });

        // 임원들 필터링 후 우선순위로 정렬
        const executives = mappedUsers
          .filter((u) => u.isExecutive)
          .sort(
            (a, b) =>
              executiveOrder.indexOf(a.position) - executiveOrder.indexOf(b.position)
          );

        // 일반 멤버
        const normalUsers = mappedUsers.filter((u) => !u.isExecutive);

        setUsers([...executives, ...normalUsers]);
      } catch (e) {
        alert("조직원 정보를 불러오지 못했습니다.");
      }
    };

    fetchMembers();
  }, [departments, api_url]);

  // 임원만 필터링 (임원 우선순위는 이미 정렬됨)
  const executives = users.filter((u) =>
    ["대표", "사장", "회장", "이사"].includes(u.position)
  );

  const allTeams = [
    ...departments,
    { id: TEMP_DEPT_ID, name: TEMP_DEPT_NAME, status: false },
  ];

  const teams = allTeams.map((dept) => ({
    ...dept,
    leaders: users.filter(
      (u) =>
        u.dept_id === dept.id &&
        ["부장", "차장", "팀장", "과장"].includes(u.position)
    ),
    members: users.filter(
      (u) =>
        u.dept_id === dept.id &&
        ["사원", "주임", "대리"].includes(u.position)
    ),
  }));

  return (
    <div>
      <Header />
      <div className="wrap" style={{ padding: "60px 0", minHeight: "80vh" }}>
        <h2 className="card_title font_700 mb_30">조직도</h2>

        {/* 대표 */}
        <div className="org_level_ceo width_fit margin_auto">
          {executives
            .filter((e) => e.position === "대표")
            .map((exe) => (
              <div
                key={exe.id}
                className="org_card org_ceo_card"
                tabIndex={0}
                onClick={() => setModalUser(exe)}
                style={{ cursor: "pointer" }}
              >
                <div className="org_card_title">{exe.name}</div>
              </div>
            ))}
        </div>

        {/* 사장 */}
        <div className="org_level_presidents width_fit margin_auto">
          {executives
            .filter((e) => e.position === "사장")
            .map((exe) => (
              <div
                key={exe.id}
                className="org_card org_exec_card"
                tabIndex={0}
                onClick={() => setModalUser(exe)}
                style={{ cursor: "pointer" }}
              >
                <div className="org_card_title">{exe.name}</div>
              </div>
            ))}
        </div>

        {/* 회장 */}
        <div className="org_level_chairman width_fit margin_auto">
          {executives
            .filter((e) => e.position === "회장")
            .map((exe) => (
              <div
                key={exe.id}
                className="org_card org_exec_card"
                tabIndex={0}
                onClick={() => setModalUser(exe)}
                style={{ cursor: "pointer" }}
              >
                <div className="org_card_title">{exe.name}</div>
              </div>
            ))}
        </div>

        {/* 이사 */}
        <div className="org_level_directors width_fit margin_auto">
          {executives
            .filter((e) => e.position === "이사")
            .map((exe) => (
              <div
                key={exe.id}
                className="org_card org_exec_card"
                tabIndex={0}
                onClick={() => setModalUser(exe)}
                style={{ cursor: "pointer" }}
              >
                <div className="org_card_title">{exe.name}</div>
              </div>
            ))}
        </div>

        {/* 부서별 팀 */}
        <div className="org_level_teams">
          {teams.map((team, idx) => (
            <div
              key={team.id}
              className="org_team_group"
            >
              <div
                className="org_card org_team_card org_fadein_right"
                style={{ animationDelay: `${0.35 + idx * 0.16}s` }}
              >
                <div className="org_card_title">{team.name}</div>

                <div className="org_team_leaders">
                  {team.leaders.map((leader, lIdx) => (
                    <div
                      key={leader.id}
                      className="org_card org_leader_card org_fadein_left"
                      tabIndex={0}
                      onClick={() => setModalUser(leader)}
                      style={{
                        cursor: "pointer",
                        animationDelay: `${0.5 + idx * 0.16 + lIdx * 0.07}s`,
                      }}
                    >
                      <div className="org_card_title">{leader.name}</div>
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
                      animationDelay: `${0.7 + idx * 0.16 + mIdx * 0.09}s`,
                    }}
                  >
                    <div className="org_card_title">{member.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MemberModal
        user={modalUser}
        dept={modalUser && getDept(modalUser)}
        onClose={() => setModalUser(null)}
      />

      <Footer />
    </div>
  );
}
