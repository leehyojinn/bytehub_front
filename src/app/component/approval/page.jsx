'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState } from "react";

const ranks = ["이사", "부장", "차장", "과장", "대리", "주임", "사원"];

const approvers = [
  { id2: 1, name: "홍길동", rank: "이사" },
  { id2: 2, name: "김철수", rank: "부장" },
  { id2: 3, name: "이영희", rank: "대리" },
  { id2: 4, name: "박민수", rank: "과장" },
];

const approvals = [
  {
    appr_idx: 101,
    writer_id: "최지연",
    id2: 1,
    title: "연차 사용 신청",
    content: "2025-07-01 ~ 2025-07-03 연차 사용 요청드립니다.",
    appr_status: "기안",
    appr_date: "2025-06-25",
    appr_type: "연차",
    history: [],
  },
  {
    appr_idx: 102,
    writer_id: "이영희",
    id2: 2,
    title: "출장비 결재",
    content: "6월 부산출장 교통/숙박비 결재 요청",
    appr_status: "결재중",
    appr_date: "2025-06-24",
    appr_type: "일반",
    history: [
      { Key: 1, appr_idx: 102, approver: "홍길동", rank: "이사", appr_date: "2025-06-26", sign: "승인", sign_record: "홍길동 서명" },
      { Key: 2, appr_idx: 102, approver: "김철수", rank: "부장", appr_date: "2025-06-27", sign: "승인", sign_record: "김철수 서명" },
    ],
  },
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
  const sortedApprovers = [...approvers].sort((a, b) => rankSortKey(a) - rankSortKey(b));
  const [selectedDoc, setSelectedDoc] = useState(null);

  // 결재 기안 폼 상태
  const [approvalType, setApprovalType] = useState(""); // 결재 종류
  const [vacStart, setVacStart] = useState(""); // 연차 시작일
  const [vacEnd, setVacEnd] = useState(""); // 연차 종료일

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex flex_column gap_30 align_center justify_center position_rel">
          <h2 className="card_title font_700">결재 시스템</h2>

          {/* 결재 문서 기안 */}
          <div className="approval_section width_100">
            <h3 className="card_title font_600 mb_10">결재 문서 기안</h3>
            <form className="approval_form">
              <input className="approval_input" type="text" placeholder="제목" required />
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
              <textarea className="approval_input" rows={4} placeholder="내용" required />
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
                      <button className="approval_link" onClick={() => setSelectedDoc(doc)}>{doc.title}</button>
                    </td>
                    <td>{doc.writer_id}</td>
                    <td>
                      <span className={
                        "approval_status_badge " +
                        (doc.appr_status === "기안" ? "status_draft"
                        : doc.appr_status === "결재중" ? "status_progress"
                        : doc.appr_status === "승인" ? "status_approved"
                        : doc.appr_status === "반려" ? "status_rejected"
                        : doc.appr_status === "완료" ? "status_completed"
                        : "")
                      }>
                        {doc.appr_status}
                      </span>
                    </td>
                    <td>{doc.appr_type}</td>
                    <td>{doc.appr_date}</td>
                    <td>
                      {doc.history.length > 0
                        ? doc.history.map(h => (
                            <span key={h.Key} className="approval_approver_chip">
                              {h.approver}({h.rank}) <span className="approval_sign">{h.sign}</span>
                            </span>
                          ))
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 결재 상세/결재 처리 모달 */}
      <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)}>
        {selectedDoc && (
          <div>
            <h3 className="card_title font_600 mb_10">{selectedDoc.title}</h3>
            <div className="su_small_text mb_10">
              기안자: {selectedDoc.writer_id} | 종류: {selectedDoc.appr_type} | 상태: {selectedDoc.appr_status}
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
                {selectedDoc.history.length > 0
                  ? selectedDoc.history.map(h => (
                      <div key={h.Key} className="approval_history_row">
                        {h.approver}({h.rank}) | {h.appr_date} | <span className="approval_sign">{h.sign}</span>
                        {h.sign_record && <span className="approval_sign_record">({h.sign_record})</span>}
                      </div>
                    ))
                  : <span>진행 중</span>}
              </div>
            </div>
            <div className="approval_modal_footer">
              <button className="approval_btn">결재 승인</button>
              <button className="approval_btn approval_btn_reject">반려</button>
              <button className="approval_btn approval_btn_secondary" onClick={() => setSelectedDoc(null)}>닫기</button>
            </div>
          </div>
        )}
      </Modal>
      <Footer />
    </div>
  );
}
