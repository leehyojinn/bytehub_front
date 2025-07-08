'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import {jwtDecode} from "jwt-decode";

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

export default function ApprovalSystem() {

  // 1. 토큰에서 user_id 추출
  let userId = "";
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.id;
      } catch (e) {
        console.error("토큰 파싱 실패", e);
      }
    }
  }

  // 2. useState로 writerId 선언 (초기값: userId)
  const [writerId, setWriterId] = useState(userId);
  const sortedApprovers = [...approvers].sort((a, b) => rankSortKey(a) - rankSortKey(b));
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  // 결재 기안 폼 상태
  const [approvalType, setApprovalType] = useState(""); // 결재 종류
  const [vacStart, setVacStart] = useState(""); // 연차 시작일
  const [vacEnd, setVacEnd] = useState(""); // 연차 종료일
  const [title, setTitle] = useState(""); // 제목
  const [content, setContent] = useState(""); // 내용

  // 결재 문서 목록 조회
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/appr/list');
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

  // 결재 문서 상세 조회
  const fetchApprovalDetail = async (appr_idx) => {
    try {
      const response = await fetch(`http://localhost/appr/detail/${appr_idx}`);
      const data = await response.json();
      if (data.success) {
        setSelectedDoc(data.data);
      }
    } catch (error) {
      console.error('결재 문서 상세 조회 실패:', error);
    }
  };

  // 결재 문서 생성
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const approvalData = {
        writer_id: writerId,
        subject: title,
        content: content,
        appr_type: approvalType
      };

      const response = await fetch('http://localhost/appr/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData)
      });

      const data = await response.json();
      if (data.success) {
        alert('결재 문서가 등록되었습니다.');
        // 폼 초기화
        setTitle("");
        setContent("");
        setApprovalType("");
        setVacStart("");
        setVacEnd("");
        // 목록 새로고침
        fetchApprovals();
      } else {
        alert('등록 실패: ' + data.msg);
      }
    } catch (error) {
      console.error('결재 문서 등록 실패:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  // 결재 승인/반려 처리
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
      } else {
        alert('처리 실패: ' + data.msg);
      }
    } catch (error) {
      console.error('결재 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 결재 문서 목록 조회
  useEffect(() => {
    fetchApprovals();
  }, []);

  // 상태 표시 함수
  const getStatusDisplay = (final_status) => {
    switch (final_status) {
      case '반려': return '반려';
      case '승인완료': return '승인';
      case '대기중': return '결재중';
      default: return '기안';
    }
  };

  // 상태 배지 클래스
  const getStatusBadgeClass = (final_status) => {
    switch (final_status) {
      case '반려': return 'status_rejected';
      case '승인완료': return 'status_approved';
      case '대기중': return 'status_progress';
      default: return 'status_draft';
    }
  };

  return (
      <div>
        <Header />
        <div className="wrap padding_60_0">
          <div className="main_box flex flex_column gap_30 align_center justify_center position_rel">
            <h2 className="card_title font_700">결재 시스템</h2>

            {/* 결재 문서 기안 */}
            <div className="approval_section width_100">
              <h3 className="card_title font_600 mb_10">결재 문서 기안</h3>
              <form className="approval_form" onSubmit={handleSubmit}>
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
                {/* 연차 선택 시 날짜 인풋 노출 */}
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
                <div className="approval_approvers_list">
                  <span className="font_600 small_text">결재권자 : </span>
                  {sortedApprovers.map(a => (
                      <span key={a.id2} className="approval_approver_chip">{a.name} <span className="approval_rank">{a.rank}</span></span>
                  ))}
                </div>
                <button type="submit" className="approval_btn">기안 등록</button>
              </form>
            </div>

            {/* 결재 문서 목록/조회 */}
            <div className="approval_section mt_40 width_100">
              <h3 className="card_title font_600 mb_10">결재 문서 목록</h3>
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
                    {approvals.map(doc => (
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
                            {/* 결재 내역은 상세 조회에서 확인 */}
                            <span>-</span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
              )}
            </div>
          </div>
        </div>

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
                    <span>진행 중</span>
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
        <Footer />
      </div>
  );
}