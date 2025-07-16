'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import axios from "axios";

// JWT 토큰에서 사용자 ID 추출
function getUserIdFromToken() {
  const token = sessionStorage.getItem("token");
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || "";
  } catch {
    return "";
  }
}

const PAGE_SIZE = 3;

export default function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterTeam, setFilterTeam] = useState("전체");
  const [myOnly, setMyOnly] = useState(false);

  // 상세/수정/생성 UI 제어
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");

  // 멤버 모달
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [memberList, setMemberList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [fileInputs, setFileInputs] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : "";

  // 부서 리스트
  useEffect(() => {
    axios.post(`${apiUrl}/dept/list`)
      .then(res => setDeptList(res.data.list || []))
      .catch(() => {});
  }, []);

  // 멤버 리스트
  useEffect(() => {
    axios.post(`${apiUrl}/member/list`)
      .then(res => {
        setUsers(res.data.list || []);
        setMemberList(res.data.list || []);
      })
      .catch(() => {});
  }, [apiUrl]);

  // 로그인 사용자
  useEffect(() => {
    setUserId(getUserIdFromToken());
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${apiUrl}/project/list`);
      const me = users.find(u => u.user_id === userId);
      const plist = (res.data.list || []).map(p => ({
        ...p,
        id: p.project_idx,
        dept_idx: p.dept_idx || me?.dept_idx || "",
        start_date: p.start_date?.split("T")[0] || "",
        end_date: p.end_date?.split("T")[0] || "",
        progress: p.progress || 0,
        priority: p.priority ?? 1,
        members: (p.members || []).map(m => m.user_id),
        files: p.files || [],
        status: p.status || "진행중",
      }));
      setProjects(plist);
      setCurrentUser(me);
    } catch (err) {
      console.error("프로젝트 불러오기 실패:", err);
    }
  };

  // 프로젝트 목록
  useEffect(() => {
    if (userId && users.length > 0) {
      fetchProjects();
    }
  }, [userId, users]);

  if (!currentUser) return <div>사용자 정보를 불러오는 중입니다...</div>;

  // --------------------- 리스트/필터 ----------------------
  const filteredProjects = projects
    .filter(p => filterTeam === "전체" || p.dept_idx == filterTeam)
    .filter(p => !myOnly || p.members.includes(currentUser.user_id))
    .sort((a, b) => a.priority - b.priority);

  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const pagedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isNearDeadline = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = (end - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  // ------------------ 상세 ------------------
  const openDetail = async (project) => {
    try {
      const { data } = await axios.get(`${apiUrl}/project/detail/${project.id}`);
      setDetailData({
        ...project,
        ...data.project,
        members: data.users || [],
        files: data.files || []
      });
      setDetailOpen(true);
    } catch {
      setDetailData(project);
      setDetailOpen(true);
    }
  };
  const closeDetail = () => setDetailOpen(false);

  // ------------------ 생성/수정 ------------------
  const openModal = (project = null) => {
    if (project) {
      setModalData({ ...project });
      setSelectedMembers(project.members || []);
      setFileInputs(project.files || []);
    } else {
      setModalData({
        id: null,
        subject: "",
        content: "",
        start_date: "",
        end_date: "",
        priority: projects.length + 1,
        dept_idx: currentUser.dept_idx,
        members: [],
        progress: 0,
        status: "진행중",
        files: []
      });
      setSelectedMembers([]);
      setFileInputs([]);
    }
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false); setModalData(null); setSelectedMembers([]); setFileInputs([]);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData(prev => ({ ...prev, [name]: value }));
    if (name === "team") setSelectedMembers([]);
  };

  const handleFileInput = (e) => {
    setFileInputs(Array.from(e.target.files));
  };

  // 멤버 선택 모달
  const openMemberModal = () => {
    setMemberModalOpen(true);
    setSearchKeyword("");
    setFilteredMembers(memberList);
  };
  const closeMemberModal = () => setMemberModalOpen(false);
  const handleSearch = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    setFilteredMembers(
      memberList.filter(
        m =>
          m.user_id.includes(keyword) ||
          (m.name && m.name.includes(keyword)) ||
          (m.email && m.email.includes(keyword))
      )
    );
  };
  const handleSelectMember = (user_id) => {
    setSelectedMembers(prev =>
      prev.includes(user_id)
        ? prev.filter(id => id !== user_id)
        : [...prev, user_id]
    );
  };
  const handleMemberConfirm = () => {
    setModalData(prev => ({ ...prev, members: selectedMembers }));
    setMemberModalOpen(false);
  };

  const saveProject = async (e) => {
    e.preventDefault();

    if (!modalData.subject || !modalData.start_date || !modalData.end_date) {
      alert("필수 항목을 입력하세요.");
      return;
    }
    try {
      const isEdit = !!modalData.id;
      const url = isEdit ? `${apiUrl}/project/edit` : `${apiUrl}/project/create`;
      const method = isEdit ? 'put' : 'post';

      const formData = new FormData();
      formData.append("projectData", new Blob([JSON.stringify({
        proj: {
          project_idx: modalData.id,
          subject: modalData.subject,
          content: modalData.content,
          start_date: modalData.start_date,
          end_date: modalData.end_date,
          priority: modalData.priority,
          user_id: currentUser.user_id,
          status: modalData.status,
          progress: modalData.progress,
          dept_idx: parseInt(modalData.dept_idx, 10),
        },
        user_id: selectedMembers
      })], { type: "application/json" }));

      if (fileInputs && fileInputs.length > 0) {
        fileInputs.forEach(f => formData.append("files", f));
      }

      await axios({
        url,
        method,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": token
        }
      });

      alert(isEdit ? "수정 완료!" : "등록 완료!");
      closeModal();
      fetchProjects();
    } catch (err) {
      alert(`저장 실패: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  const fileDownloadUrl = (file) =>
    `${apiUrl}/project/download/${file.file_idx}`;

  const deleteProject = async (id) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const getDeptName = (dept_idx) => {
    const dept = deptList.find(d => d.dept_idx === dept_idx);
    return dept ? dept.dept_name : "알 수 없음";
  };

  const getUserNamesByIds = (ids = []) =>
    ids.map(id => users.find(u => u.user_id === id)?.name || id).join(", ");

  const handleMyOnlyChange = (e) => { setMyOnly(e.target.checked); setPage(1); };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box">
          <h2 className="card_title font_700 mb_30">프로젝트 관리</h2>
          {/* 팀 필터 */}
          <div className="board_search_wrap flex gap_10 mb_20">
            <label>팀 필터 &nbsp;</label>
            <select className="login_input" style={{ minWidth: "200px" }} value={filterTeam}
              onChange={e => { setFilterTeam(e.target.value); setPage(1); }}>
              <option value="전체">전체</option>
              {deptList.map(dept => (
                <option key={dept.dept_idx} value={dept.dept_idx}>{dept.dept_name}</option>
              ))}
            </select>
            <label className="my_checkbox_label">
              <input type="checkbox" className="my_checkbox_input"
                checked={myOnly} onChange={handleMyOnlyChange} />
              <span className="my_checkbox_box"></span>
              <span className="my_checkbox_text">내 프로젝트</span>
            </label>
            {(currentUser.lv_name === "사장" || currentUser.lv_idx <= 2) && (
              <button className="board_btn" style={{ marginLeft: 20 }} onClick={() => openModal()}>
                프로젝트 생성
              </button>
            )}
          </div>
          {/* 프로젝트 카드 리스트 */}
          <div className="project_card_list">
            {pagedProjects.length === 0 ? (
              <div className="board_card text_center" style={{ padding: "48px 0" }}>프로젝트가 없습니다.</div>
            ) : (
              pagedProjects.map(p => (
                <div key={p.id} className={`project_card board_card${isNearDeadline(p.end_date) ? " near_deadline" : ""}`}>
                  <div className="project_card_head">
                    <span className="project_priority">우선순위 {p.priority}</span>
                    <span className="project_status">{p.status}</span>
                    {isNearDeadline(p.end_date) && <span className="project_deadline_badge">마감일 임박</span>}
                  </div>
                  <div className="project_subject">{p.subject}</div>
                  <div className="project_content">{p.content}</div>
                  <div className="project_dates">
                    <span>시작일: {p.start_date}</span>
                    <span>마감일: {p.end_date}</span>
                  </div>
                  <div className="project_members">
                    <b>팀:</b> {getDeptName(p.dept_idx)}
                  </div>
                  <div className="project_members">
                    <b>멤버:</b>{" "}
                    {p.members.length > 0
                    ? getUserNamesByIds(p.members)
                    : <span style={{ color: "#bbb" }}>없음</span>}
                  </div>
                  <div className="project_files">
                    <b>파일:</b>{" "}
                    {p.files && p.files.length > 0
                      ? p.files.map((f, idx) =>
                        <a key={f.file_idx || idx}
                          href={fileDownloadUrl(f)}
                          className="file_link"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: 8 }}>
                          📎 {f.ori_filename || f.name}
                        </a>
                      )
                      : <span style={{ color: "#bbb" }}>없음</span>}
                  </div>
                  <div className="project_card_btns">
                    <button className="board_btn" onClick={() => openDetail(p)}>상세보기</button>
                    <button className="board_btn" onClick={() => openModal(p)}>수정</button>
                    <button className="board_btn board_btn_cancel" onClick={() => deleteProject(p.id)}>삭제</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          <div className="board_pagination">
            <button className="board_btn" onClick={() => setPage(page - 1)} disabled={page === 1}>이전</button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`board_btn board_page_btn${page === idx + 1 ? " active" : ""}`}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button className="board_btn" onClick={() => setPage(page + 1)} disabled={page === totalPages}>다음</button>
          </div>
        </div>

        {/* 상세 모달 */}
        {detailOpen && detailData && (
          <div className="modal_overlay" onClick={closeDetail}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">프로젝트 상세</h3>
              <div className="project_detail_row"><b>제목:</b> {detailData.subject}</div>
              <div className="project_detail_row"><b>내용:</b> {detailData.content}</div>
              <div className="project_detail_row"><b>팀:</b> {getDeptName(detailData.dept_idx)}</div>
              <div className="project_detail_row"><b>기간:</b> {detailData.start_date} ~ {detailData.end_date}</div>
              <div className="project_detail_row"><b>우선순위:</b> {detailData.priority}</div>
              <div className="project_detail_row"><b>진행률:</b> {detailData.progress}%</div>
              <div className="project_detail_row"><b>멤버:</b> {Array.isArray(detailData.members) && detailData.members.length > 0 ?
                detailData.members.map(id => users.find(u => u.user_id === id)?.name || id).join(", ")
                : <span style={{ color: "#bbb" }}>없음</span>}
              </div>
              <div className="project_detail_row"><b>파일:</b>{" "}
                {detailData.files && detailData.files.length > 0 ?
                  detailData.files.map((f, idx) =>
                    <a key={f.file_idx || idx}
                       href={fileDownloadUrl(f)}
                       className="file_link"
                       target="_blank"
                       rel="noopener noreferrer"
                       style={{ marginRight: 8 }}>
                      📎 {f.ori_filename || f.name}
                    </a>
                  ) : <span style={{ color: "#bbb" }}>없음</span>
                }
              </div>
              <div className="modal_buttons">
                <button className="board_btn" onClick={closeDetail}>닫기</button>
              </div>
            </div>
          </div>
        )}

        {/* 프로젝트 생성/수정 모달 + 멤버 선택 모달 */}
        {modalOpen && (
          <div className="modal_overlay" onClick={closeModal}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">{modalData.id ? "프로젝트 수정" : "프로젝트 생성"}</h3>
              <form className="flex flex_column gap_10" onSubmit={saveProject}>
                <div className="board_write_row">
                  <label className="board_write_label">제목</label>
                  <input className="board_write_input" name="subject" value={modalData.subject} onChange={handleModalChange} required />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">내용</label>
                  <textarea className="board_write_input" name="content" value={modalData.content} onChange={handleModalChange} required />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">우선순위</label>
                  <input type="number" name="priority" className="board_write_input" value={modalData.priority} onChange={handleModalChange} min={1} max={10} required />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">팀</label>
                    <select
                      className="board_write_input"
                      name="dept_idx"
                      value={modalData.dept_idx}
                      onChange={handleModalChange}
                    >
                      {deptList.map((dept) => (
                        <option key={dept.dept_idx} value={dept.dept_idx}>
                          {dept.dept_name}
                        </option>
                      ))}
                    </select>
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">시작일</label>
                  <input type="date" name="start_date" className="board_write_input" value={modalData.start_date} onChange={handleModalChange} required />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">마감일</label>
                  <input type="date" name="end_date" className="board_write_input" value={modalData.end_date} onChange={handleModalChange} required />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">진행률</label>
                  <input type="number" name="progress" className="board_write_input" value={modalData.progress} onChange={handleModalChange} min={0} max={100} required />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">팀 멤버</label>
                  <input
                    type="text"
                    className="board_write_input"
                    value={getUserNamesByIds(selectedMembers)} // ★ 이름 목록 출력
                    placeholder="팀 멤버 선택"
                    onClick={openMemberModal}
                    readOnly
                    style={{ background: "#f9f9f9", cursor: "pointer" }}
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">파일</label>
                  <input type="file" multiple onChange={handleFileInput} />
                  {fileInputs.length > 0 && (
                    <div className="project_files_preview">
                      {fileInputs.map((f, idx) => (
                        <span key={idx}>{f.name}{idx < fileInputs.length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                  )}
                  {/* 기존 파일 목록 (수정시) */}
                  {Array.isArray(modalData.files) && modalData.files.length > 0 && (
                    <div className="project_files_preview" style={{marginTop:8, color:'#333'}}>
                      <b style={{marginRight:4}}>기존파일:</b>
                      {modalData.files.map((f, idx) => (
                        <a key={f.file_idx || idx}
                           href={fileDownloadUrl(f)}
                           className="file_link"
                           target="_blank"
                           rel="noopener noreferrer"
                           style={{ marginRight: 8 }}>
                          📎 {f.ori_filename || f.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">{modalData.id ? "수정" : "등록"}</button>
                  <button type="button" className="board_btn board_btn_cancel" onClick={closeModal}>취소</button>
                </div>
              </form>
            </div>
            {/* ---- 팀 멤버 선택 모달 ---- */}
            {memberModalOpen && (
              <div className="modal_overlay" style={{
                position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
                background: "rgba(0,0,0,0.35)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div className="modal_content" onClick={e => e.stopPropagation()} style={{
                  background: "#fff", borderRadius: "12px", padding: "32px 24px", minWidth: 420, maxHeight: "70vh", overflowY: "auto"
                }}>
                  <div className="modal_header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="font_700" style={{ fontSize: "1.2rem" }}>팀 멤버 선택</div>
                    <button onClick={closeMemberModal} style={{ fontSize: "1.3rem", background: "none", border: "none", cursor: "pointer" }}>×</button>
                  </div>
                  <div className="modal_body" style={{ marginTop: 16 }}>
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={handleSearch}
                      placeholder="이름, 아이디, 이메일 검색"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", marginBottom: 14 }}
                    />
                    <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #eee", borderRadius: 6 }}>
                      {filteredMembers.length === 0 && (
                        <div style={{ padding: "16px", color: "#888" }}>검색 결과가 없습니다.</div>
                      )}
                      {filteredMembers.map(member => (
                        <div
                          key={member.user_id}
                          onClick={() => handleSelectMember(member.user_id)}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            background: selectedMembers.includes(member.user_id) ? "#e2f0ff" : "#fff",
                            borderBottom: "1px solid #f0f0f0"
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{member.name}</span>
                          <span style={{ color: "#888", marginLeft: 8 }}>{member.user_id}</span>
                          <span style={{ color: "#bbb", marginLeft: 8 }}>{member.email}</span>
                          {selectedMembers.includes(member.user_id) && (
                            <span style={{ marginLeft: "20px" }}>✔</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 18, textAlign: "right" }}>
                      <button className="board_btn" onClick={handleMemberConfirm} type="button">
                        선택완료
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
