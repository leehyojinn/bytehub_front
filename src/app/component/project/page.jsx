'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState } from "react";

const users = [
    {
        id: 1,
        name: "홍길동",
        team: "개발팀",
        position: "팀장",
        grade: 1
    }, {
        id: 2,
        name: "김철수",
        team: "개발팀",
        position: "사원",
        grade: 4
    }, {
        id: 3,
        name: "이영희",
        team: "디자인팀",
        position: "팀장",
        grade: 1
    }, {
        id: 4,
        name: "박민수",
        team: "디자인팀",
        position: "사원",
        grade: 4
    }
];

const initialProjects = [
    {
        id: 1,
        subject: "프로젝트 A",
        content: "내용 A",
        start_date: "2025-07-01",
        end_date: "2025-07-07",
        priority: 1,
        team: "개발팀",
        members: [
            1, 2
        ],
        progress: 40,
        status: "진행중",
        files: []
    }, {
        id: 2,
        subject: "프로젝트 B",
        content: "내용 B",
        start_date: "2025-07-10",
        end_date: "2025-07-15",
        priority: 2,
        team: "디자인팀",
        members: [
            3, 4
        ],
        progress: 90,
        status: "진행중",
        files: []
    }, {
        id: 3,
        subject: "프로젝트 C",
        content: "내용 C",
        start_date: "2025-06-01",
        end_date: "2025-06-30",
        priority: 3,
        team: "개발팀",
        members: [1],
        progress: 100,
        status: "완료",
        files: []
    },
    {
        id: 4,
        subject: "프로젝트 C",
        content: "내용 C",
        start_date: "2025-06-01",
        end_date: "2025-06-30",
        priority: 5,
        team: "개발팀",
        members: [1],
        progress: 100,
        status: "완료",
        files: []
    },
    {
        id: 5,
        subject: "프로젝트 C",
        content: "내용 C",
        start_date: "2025-06-01",
        end_date: "2025-06-30",
        priority: 1,
        team: "개발팀",
        members: [1],
        progress: 100,
        status: "완료",
        files: []
    }
];

const currentUser = users[0]; // 홍길동
const PAGE_SIZE = 3;

export default function ProjectManagement() {
    const [projects, setProjects] = useState(initialProjects);
    const [filterTeam, setFilterTeam] = useState("전체");
    const [myOnly, setMyOnly] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [page, setPage] = useState(1);

    // 필터링
    let filteredProjects = projects
        .filter(
            p => filterTeam === "전체" || p.team === filterTeam
        )
        .filter(p => !myOnly || p.members.includes(currentUser.id))
        .sort((a, b) => a.priority - b.priority);

    const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
    const pagedProjects = filteredProjects.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    // 마감일 7일 이내 강조
    const isNearDeadline = (endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = (end - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
    };

    // 프로젝트 생성/수정 모달
    const openModal = (project = null) => {
        if (project) {
            setModalData({
                ...project
            });
        } else {
            setModalData({
                id: null,
                subject: "",
                content: "",
                start_date: "",
                end_date: "",
                priority: projects.length + 1,
                team: currentUser.team,
                members: [currentUser.id],
                progress: 0,
                status: "진행중",
                files: []
            });
        }
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setModalData(null);
    };

    // 프로젝트 상세 모달
    const openDetail = (project) => {
        setDetailData(project);
        setDetailOpen(true);
    };
    const closeDetail = () => {
        setDetailOpen(false);
        setDetailData(null);
    };

    const handleModalChange = (e) => {
        const {name, value} = e.target;
        setModalData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 파일 추가 인풋 (생성/수정 모달에서만)
    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        setModalData(prev => ({
            ...prev,
            files: files.map(f => ({name: f.name}))
        }));
    };

    const saveProject = (e) => {
        e.preventDefault();
        if (!modalData.subject || !modalData.start_date || !modalData.end_date) {
            alert("필수 항목을 입력하세요.");
            return;
        }
        if (modalData.id) {
            setProjects(prev => prev.map(
                p => p.id === modalData.id
                    ? modalData
                    : p
            ));
        } else {
            setProjects(prev => [
                ...prev, {
                    ...modalData,
                    id: Date.now()
                }
            ]);
        }
        closeModal();
    };

    const deleteProject = (id) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            setProjects(prev => prev.filter(p => p.id !== id));
        }
    };

    // 체크박스 변경 시 페이지 1로
    const handleMyOnlyChange = (e) => {
        setMyOnly(e.target.checked);
        setPage(1);
    };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box">
          <h2 className="card_title font_700 mb_30">프로젝트 관리</h2>

          {/* 팀 필터 */}
          <div className="board_search_wrap flex gap_10 mb_20">
            <label>팀 필터 &nbsp;&nbsp;</label>
            <select className="login_input" style={{minWidth:"200px"}} value={filterTeam} onChange={e => { setFilterTeam(e.target.value); setPage(1); }}>
              <option value="전체">전체</option>
              {[...new Set(users.map(u => u.team))].map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            {/* 내 프로젝트만 보기 체크박스 */}
            <label className="my_checkbox_label">
              <input
                type="checkbox"
                name="myfilter"
                className="my_checkbox_input"
                checked={myOnly}
                onChange={handleMyOnlyChange}
              />
              <span className="my_checkbox_box"></span>
              <span className="my_checkbox_text">내 프로젝트</span>
            </label>
            {currentUser.position === "팀장" || currentUser.grade <= 2 ? (
              <button className="board_btn" style={{ marginLeft: 20 }} onClick={() => openModal()}>
                프로젝트 생성
              </button>
            ) : null}
          </div>

          {/* 프로젝트 카드 리스트 */}
          <div className="project_card_list">
            {pagedProjects.length === 0 && (
              <div className="board_card text_center" style={{padding:"48px 0"}}>프로젝트가 없습니다.</div>
            )}
            {pagedProjects.map(p => (
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
                <div className="project_progress_wrap">
                  <div className="progress_bar">
                    <div className="progress_fill" style={{ width: `${p.progress}%` }} />
                    <span>{p.progress}%</span>
                  </div>
                </div>
                <div className="project_members">
                  <b>멤버:</b> {p.members.map(id => users.find(u => u.id === id)?.name).join(", ")}
                </div>
                <div className="project_files">
                  <b>파일:</b>{" "}
                  {p.files && p.files.length > 0
                    ? p.files.map((f, idx) => <span key={idx}>{f.name}{idx < p.files.length-1 ? ", " : ""}</span>)
                    : <span style={{color:"#bbb"}}>없음</span>
                  }
                </div>
                <div className="project_card_btns">
                  <button className="board_btn" onClick={() => openDetail(p)}>상세보기</button>
                  {(currentUser.position === "팀장" || p.members.includes(currentUser.id)) && (
                    <>
                      <button className="board_btn" onClick={() => openModal(p)}>수정</button>
                      <button className="board_btn board_btn_cancel" onClick={() => deleteProject(p.id)}>삭제</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="board_pagination">
            <button
              className="board_btn"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              이전
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                className={`board_btn board_page_btn${page === idx + 1 ? " active" : ""}`}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="board_btn"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              다음
            </button>
          </div>
        </div>

        {/* 상세보기 모달 */}
        {detailOpen && detailData && (
          <div className="modal_overlay" onClick={closeDetail}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">프로젝트 상세</h3>
              <div className="project_detail_row"><b>제목:</b> {detailData.subject}</div>
              <div className="project_detail_row"><b>내용:</b> {detailData.content}</div>
              <div className="project_detail_row"><b>우선순위:</b> {detailData.priority}</div>
              <div className="project_detail_row"><b>팀:</b> {detailData.team}</div>
              <div className="project_detail_row"><b>기간:</b> {detailData.start_date} ~ {detailData.end_date}</div>
              <div className="project_detail_row"><b>진행률:</b> {detailData.progress}%</div>
              <div className="project_detail_row"><b>멤버:</b> {detailData.members.map(id => users.find(u => u.id === id)?.name).join(", ")}</div>
              <div className="project_detail_row"><b>파일:</b> {detailData.files && detailData.files.length > 0
                ? detailData.files.map((f, idx) => <span key={idx}>{f.name}{idx < detailData.files.length-1 ? ", " : ""}</span>)
                : <span style={{color:"#bbb"}}>없음</span>}
              </div>
              <div className="modal_buttons">
                <button className="board_btn" onClick={closeDetail}>닫기</button>
              </div>
            </div>
          </div>
        )}

        {/* 프로젝트 생성/수정 모달 */}
        {modalOpen && (
          <div className="modal_overlay" onClick={closeModal}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">{modalData.id ? "프로젝트 수정" : "프로젝트 생성"}</h3>
              <form className="flex flex_column gap_10" onSubmit={saveProject}>
                <div className="board_write_row">
                  <label htmlFor="subject" className="board_write_label">제목</label>
                  <input
                    id="subject"
                    name="subject"
                    className="board_write_input"
                    type="text"
                    value={modalData.subject}
                    onChange={handleModalChange}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label htmlFor="content" className="board_write_label">내용</label>
                  <textarea
                    id="content"
                    name="content"
                    className="board_write_textarea"
                    rows={4}
                    value={modalData.content}
                    onChange={handleModalChange}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label htmlFor="priority" className="board_write_label">우선순위</label>
                  <input
                    id="priority"
                    name="priority"
                    className="board_write_input"
                    type="number"
                    min={1}
                    max={10}
                    value={modalData.priority}
                    onChange={handleModalChange}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label htmlFor="team" className="board_write_label">팀</label>
                  <input
                    id="team"
                    name="team"
                    className="board_write_input"
                    type="text"
                    value={modalData.team}
                    readOnly
                  />
                </div>
                <div className="board_write_row">
                  <label htmlFor="start_date" className="board_write_label">시작일</label>
                  <input
                    id="start_date"
                    name="start_date"
                    className="board_write_input"
                    type="date"
                    value={modalData.start_date}
                    onChange={handleModalChange}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label htmlFor="end_date" className="board_write_label">마감일</label>
                  <input
                    id="end_date"
                    name="end_date"
                    className="board_write_input"
                    type="date"
                    value={modalData.end_date}
                    onChange={handleModalChange}
                    required
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">멤버 할당</label>
                  <div className="member_checkbox_group">
                    {users.filter(u => u.team === modalData.team).map(user => (
                      <label key={user.id} className="member_checkbox_label">
                        <input
                          type="checkbox"
                          checked={modalData.members.includes(user.id)}
                          onChange={() => {
                            const newMembers = modalData.members.includes(user.id)
                              ? modalData.members.filter(id => id !== user.id)
                              : [...modalData.members, user.id];
                            setModalData(prev => ({ ...prev, members: newMembers }));
                          }}
                        />
                        {user.name} ({user.position})
                      </label>
                    ))}
                  </div>
                </div>
                <div className="board_write_row">
                  <label htmlFor="progress" className="board_write_label">진행률 (%)</label>
                  <input
                    id="progress"
                    name="progress"
                    className="board_write_input"
                    type="number"
                    min={0}
                    max={100}
                    value={modalData.progress}
                    onChange={handleModalChange}
                    required
                  />
                </div>
                {/* 파일 추가 인풋 */}
                <div className="board_write_row">
                  <label htmlFor="imageUpload" className="board_file_label">파일 추가</label>
                  <input
                    id="imageUpload"
                    type="file"
                    multiple
                    style={{display:"none"}}
                    onChange={handleFileInput}
                  />
                  {modalData.files && modalData.files.length > 0 && (
                    <div className="project_files_preview" style={{marginTop:8}}>
                      {modalData.files.map((f, idx) => (
                        <span key={idx}>{f.name}{idx < modalData.files.length-1 ? ", " : ""}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">저장</button>
                  <button type="button" className="board_btn board_btn_cancel" onClick={closeModal}>취소</button>
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
