'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const ranks = ["이사", "부장", "차장", "과장", "대리", "주임", "사원"];
const approvers = [
  { id2: 1, name: "홍길동", rank: "이사" },
  { id2: 2, name: "김철수", rank: "부장" },
  { id2: 3, name: "이영희", rank: "대리" },
  { id2: 4, name: "박민수", rank: "과장" },
];

function rankSortKey(approver) {
  const idx = ranks.indexOf(approver.rank);
  return idx === -1 ? ranks.length : idx;
}

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

const TAB_LABELS = [
  "기안작성",
  "내 결재",
  "결재 처리 리스트",
  "결재 목록 리스트"
];

export default function ApprovalSystem() {
  let userId = "";
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.id;
      } catch (e) {
        console.error("토큰 파싱 실패", e);
      }
    }
  }

  const [activeTab, setActiveTab] = useState(0);
  const [writerId, setWriterId] = useState(userId);
  const sortedApprovers = [...approvers].sort((a, b) => rankSortKey(a) - rankSortKey(b));
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [toApproveList, setToApproveList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allApprovals, setAllApprovals] = useState([]); // 전체 결재 목록용

  // 기안 폼 상태
  const [approvalType, setApprovalType] = useState("");
  const [vacStart, setVacStart] = useState("");
  const [vacEnd, setVacEnd] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // 파일 첨부 상태


  // 결재 문서 조회
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost/appr/my?writer_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (error) {
      console.error('결재 문서 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchToApproveList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost/appr/toapprove?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setToApproveList(data.data);
      }
    } catch (error) {
      console.error('내가 결재할 문서 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 결재 문서 상세 보기
  const fetchApprovalDetail = async (appr_idx) => {
    try {
      const response = await fetch(`http://localhost/appr/detail/${appr_idx}`);
      const data = await response.json();
      if (data.success) {
        let doc = data.data;
        const historyResponse = await fetch(`http://localhost/appr/history/${appr_idx}`);
        const historyData = await historyResponse.json();
        if (historyData.success) {
          doc = { ...doc, history: historyData.data };
        }
        setSelectedDoc(doc);
      }
    } catch (error) {
      console.error('결재 문서 상세 조회 실패:', error);
    }
  };

  // 파일 input 변경 핸들러
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // 결재 문서 생성 (파일 업로드 포함)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("writer_id", writerId);
      formData.append("subject", title);
      formData.append("content", content);
      formData.append("appr_type", approvalType);
      if (approvalType === "연차") {
        formData.append("vac_start", vacStart);
        formData.append("vac_end", vacEnd);
      }
      files.forEach((file, idx) => {
        formData.append("files", file);
      });

      const response = await fetch('http://localhost/appr/create', {
        method: 'POST',
        body: formData
      });

      // 결재 처리
      const data = await response.json();
      if (data.success) {
        alert('결재 문서가 등록되었습니다.');
        setTitle("");
        setContent("");
        setApprovalType("");
        setVacStart("");
        setVacEnd("");
        setFiles([]);
        fetchApprovals();
      } else {
        alert('등록 실패: ' + data.msg);
      }
    } catch (error) {
      console.error('결재 문서 등록 실패:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleApproval = async (appr_his_idx, status, reason = "") => {
    try {
      const response = await fetch('http://localhost/appr/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appr_his_idx: appr_his_idx,
          status: status,
          reason: reason
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(status === '승인' ? '승인 처리되었습니다.' : '반려 처리되었습니다.');
        setSelectedDoc(null);
        fetchApprovals();
        fetchToApproveList();
      } else {
        alert('처리 실패: ' + data.msg);
      }
    } catch (error) {
      console.error('결재 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 전체 결재 목록 보기
  const fetchAllApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost/appr/all`);
      const data = await response.json();
      if (data.success) {
        setAllApprovals(data.data);
      }
    } catch (error) {
      console.error('전체 결재 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    fetchToApproveList();
    fetchAllApprovals();
  }, [userId]);

  const getStatusDisplay = (final_status) => {
    switch (final_status) {
      case '반려': return '반려';
      case '승인완료': return '승인';
      case '대기중': return '결재중';
      default: return '기안';
    }
  };

  const getStatusBadgeClass = (final_status) => {
    switch (final_status) {
      case '반려': return 'status_rejected';
      case '승인완료': return 'status_approved';
      case '대기중': return 'status_progress';
      default: return 'status_draft';
    }
  };

  const myApprovals = approvals.filter(doc => doc.writer_id === userId);

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex flex_column gap_30 align_center justify_center position_rel">
          <h2 className="card_title font_700">결재 시스템</h2>
          <div className="approval_tabs flex gap_10 mb_20">
            {TAB_LABELS.map((label, idx) => (
              <button
                key={label}
                className={`tab_btn${activeTab === idx ? " active" : ""}`}
                onClick={() => setActiveTab(idx)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 결재 올리는 페이지 */}
          {activeTab === 0 && (
            <div className="approval_section width_100">
              <h3 className="card_title font_600 mb_10">결재 문서 기안</h3>
              <form className="approval_form" onSubmit={handleSubmit} encType="multipart/form-data">
                <input
                  className="approval_input"
                  type="text"
                  placeholder="제목"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <select
                  className="approval_input"
                  required
                  value={approvalType}
                  onChange={e => setApprovalType(e.target.value)}
                >
                  <option value="">결재 종류 선택</option>
                  <option value="연차">연차</option>
                  <option value="지출">지출</option>
                  <option value="일반">일반</option>
                </select>
                {approvalType === "연차" && (
                  <div className="flex gap_10">
                    <input
                      type="date"
                      className="approval_input"
                      value={vacStart}
                      onChange={e => setVacStart(e.target.value)}
                      required
                      style={{ flex: 1 }}
                      placeholder="시작일"
                    />
                    <span style={{ alignSelf: "center" }}>~</span>
                    <input
                      type="date"
                      className="approval_input"
                      value={vacEnd}
                      onChange={e => setVacEnd(e.target.value)}
                      required
                      style={{ flex: 1 }}
                      placeholder="종료일"
                    />
                  </div>
                )}
                <textarea
                  className="approval_input"
                  rows={4}
                  placeholder="내용"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                {/* 파일 첨부 input */}
                <div className="mb_10">
                  <label className="font_600 small_text">파일 첨부: </label>
                  <label htmlFor="imageUpload" className="board_file_label">
                    파일 선택
                  </label>
                  <input
                    id="imageUpload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="board_write_file"
                    style={{ display: "none" }}
                  />
                  {files.length > 0 && (
                    <div className="mt_5">
                      {files.map((file, idx) => (
                        <span key={idx} style={{ marginRight: 8 }}>{file.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="approval_approvers_list">
                  <span className="font_600 small_text">결재권자 : </span>
                  {sortedApprovers.map(a => (
                    <span key={a.id2} className="approval_approver_chip">{a.name} <span className="approval_rank">{a.rank}</span></span>
                  ))}
                </div>
                <button type="submit" className="approval_btn">기안 등록</button>
              </form>
            </div>
          )}

          {activeTab === 1 && (
            // 내가 올린 결재 페이지
            <div className="approval_section width_100">
              <h3 className="card_title font_600 mb_10">내 결재</h3>
              <div className="approval_status_legend mb_16 flex gap_10">
                <span className="approval_status_badge status_rejected">반려</span>
                <span className="approval_status_badge status_draft">기안</span>
                <span className="approval_status_badge status_progress">결재중</span>
                <span className="approval_status_badge status_approved">승인</span>
              </div>
              {loading ? (
                <div>로딩 중...</div>
              ) : (
                <table className="approval_table">
                  <thead>
                    <tr>
                      <th>결재번호</th>
                      <th>제목</th>
                      <th>기안자</th>
                      <th>상태</th>
                      <th>종류</th>
                      <th>기안일</th>
                      <th>결재내역</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myApprovals.map(doc => (
                      <tr key={doc.appr_idx}>
                        <td>{doc.appr_idx}</td>
                        <td>
                          <button
                            className="approval_link"
                            onClick={() => fetchApprovalDetail(doc.appr_idx)}
                          >
                            {doc.subject}
                          </button>
                        </td>
                        <td>{doc.writer_id}</td>
                        <td>
                          <span className={`approval_status_badge ${getStatusBadgeClass(doc.final_status)}`}>
                            {getStatusDisplay(doc.final_status)}
                          </span>
                        </td>
                        <td>{doc.appr_type}</td>
                        <td>{doc.appr_date ? new Date(doc.appr_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <span>-</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 2 && (
            // 내가 결재할 결재 페이지
            <div className="approval_section width_100">
              <h3 className="card_title font_600 mb_10">결재 처리 리스트</h3>
              <div className="approval_status_legend mb_16 flex gap_10">
                <span className="approval_status_badge status_rejected">반려</span>
                <span className="approval_status_badge status_draft">기안</span>
                <span className="approval_status_badge status_progress">결재중</span>
                <span className="approval_status_badge status_approved">승인</span>
              </div>
              {loading ? (
                <div>로딩 중...</div>
              ) : (
                <table className="approval_table">
                  <thead>
                    <tr>
                      <th>결재번호</th>
                      <th>제목</th>
                      <th>기안자</th>
                      <th>상태</th>
                      <th>종류</th>
                      <th>기안일</th>
                      <th>결재내역</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toApproveList.length === 0 && (
                      <tr>
                        <td colSpan={7}>결재할 문서가 없습니다.</td>
                      </tr>
                    )}
                    {toApproveList.map(doc => (
                      <tr key={doc.appr_idx}>
                        <td>{doc.appr_idx}</td>
                        <td>
                          <button
                            className="approval_link"
                            onClick={() => fetchApprovalDetail(doc.appr_idx)}
                          >
                            {doc.subject}
                          </button>
                        </td>
                        <td>{doc.writer_id}</td>
                        <td>
                          <span className={`approval_status_badge ${getStatusBadgeClass(doc.final_status)}`}>
                            {getStatusDisplay(doc.final_status)}
                          </span>
                        </td>
                        <td>{doc.appr_type}</td>
                        <td>{doc.appr_date ? new Date(doc.appr_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <span>-</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 3 && (
              // 결재목록 리스트 (전체)
              <div className="approval_section width_100">
                <h3 className="card_title font_600 mb_10">결재목록 리스트</h3>
                <div className="approval_status_legend mb_16 flex gap_10">
                  <span className="approval_status_badge status_rejected">반려</span>
                  <span className="approval_status_badge status_draft">기안</span>
                  <span className="approval_status_badge status_progress">결재중</span>
                  <span className="approval_status_badge status_approved">승인</span>
                </div>
                {loading ? (
                    <div>로딩 중...</div>
                ) : (
                    <table className="approval_table">
                      <thead>
                      <tr>
                        <th>결재번호</th>
                        <th>제목</th>
                        <th>기안자</th>
                        <th>상태</th>
                        <th>종류</th>
                        <th>기안일</th>
                        <th>결재내역</th>
                      </tr>
                      </thead>
                      <tbody>
                      {allApprovals.length === 0 && (
                          <tr>
                            <td colSpan={7}>결재 문서가 없습니다.</td>
                          </tr>
                      )}
                      {allApprovals.map(doc => (
                          <tr key={doc.appr_idx}>
                            <td>{doc.appr_idx}</td>
                            <td>
                              <button
                                  className="approval_link"
                                  onClick={() => fetchApprovalDetail(doc.appr_idx)}
                              >
                                {doc.subject}
                              </button>
                            </td>
                            <td>{doc.writer_id}</td>
                            <td>
                <span className={`approval_status_badge ${getStatusBadgeClass(doc.final_status)}`}>
                  {getStatusDisplay(doc.final_status)}
                </span>
                            </td>
                            <td>{doc.appr_type}</td>
                            <td>{doc.appr_date ? new Date(doc.appr_date).toLocaleDateString() : '-'}</td>
                            <td>
                              <span>-</span>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                )}
              </div>
          )}

          {/* 결재 상세/결재 처리 모달 */}
          <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)}>
            {selectedDoc && (
              <div>
                <h3 className="card_title font_600 mb_10">{selectedDoc.subject}</h3>
                <div className="su_small_text mb_10">
                  기안자: {selectedDoc.writer_id} | 종류: {selectedDoc.appr_type} | 상태: {getStatusDisplay(selectedDoc.final_status)}
                </div>
                <div className="approval_modal_content">
                  <div className="mb_10">
                    <b>결재권자:</b>
                    {sortedApprovers.map(a => (
                      <span key={a.id2} className="approval_approver_chip">{a.name} <span className="approval_rank">{a.rank}</span></span>
                    ))}
                  </div>
                  <div className="mb_10">
                    <b>결재 내용:</b>
                    <div className="approval_content_box">
                      {selectedDoc.content}
                    </div>
                  </div>
                  <div>
                    <b>결재 내역:</b>
                    {selectedDoc.history && selectedDoc.history.length > 0 ? (
                      <div className="approval_history_list">
                        {selectedDoc.history.map((history, index) => (
                          <div key={index} className="approval_history_item">
                            <span className="approval_step">Step {history.step}</span>
                            <span className="approval_checker">{history.checker_name} ({history.level_name})</span>
                            <span className={`approval_status ${history.status === '승인' ? 'status_approved' :
                              history.status === '반려' ? 'status_rejected' : 'status_progress'}`}>
                              {history.status}
                            </span>
                            {history.reason && <span className="approval_reason">사유: {history.reason}</span>}
                            {history.check_time && <span className="approval_time">
                              {new Date(history.check_time).toLocaleString()}
                            </span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>결재 내역이 없습니다.</span>
                    )}
                  </div>
                </div>
                <div className="approval_modal_footer">
                  <button
                    className="approval_btn"
                    onClick={() => handleApproval(selectedDoc.appr_his_idx, '승인')}
                  >
                    결재 승인
                  </button>
                  <button
                    className="approval_btn approval_btn_reject"
                    onClick={() => handleApproval(selectedDoc.appr_his_idx, '반려')}
                  >
                    반려
                  </button>
                  <button
                    className="approval_btn approval_btn_secondary"
                    onClick={() => setSelectedDoc(null)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
      <Footer />
    </div>
  );
}
