'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import Link from "next/link";
import React, { useState } from "react";

// 회의록 더미 데이터
export const meetingMinutes = [
  {
    id: 1,
    title: "6월 정기 팀 회의록",
    writer: "홍길동",
    date: "2025-06-27",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "홍길동, 이영희, 김철수",
    summary: "프로젝트 일정 점검 및 이슈 공유",
    views: 41,
  },
  {
    id: 2,
    title: "신규 서비스 기획 회의",
    writer: "이영희",
    date: "2025-06-26",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "이영희, 박민수, 최지연",
    summary: "신규 서비스 아이디어 브레인스토밍",
    views: 35,
  },
  {
    id: 3,
    title: "업무 프로세스 개선 회의",
    writer: "김철수",
    date: "2025-06-25",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "김철수, 관리자, 인사팀",
    summary: "프로세스 개선안 논의",
    views: 59,
  },
  {
    id: 4,
    title: "7월 워크샵 준비 회의",
    writer: "최지연",
    date: "2025-06-24",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "최지연, 총무팀",
    summary: "워크샵 일정 및 장소 확정",
    views: 22,
  },
  {
    id: 5,
    title: "보안 정책 점검 회의",
    writer: "보안팀",
    date: "2025-06-23",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "보안팀, 전사",
    summary: "보안 정책 및 교육 일정 안내",
    views: 18,
  },
  {
    id: 6,
    title: "고객사 미팅 결과 공유",
    writer: "관리자",
    date: "2025-06-22",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "관리자, 마케팅팀",
    summary: "고객사 피드백 및 후속 조치",
    views: 30,
  },
  {
    id: 7,
    title: "4분기 실적 발표 회의",
    writer: "인사팀",
    date: "2025-06-21",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "인사팀, 전사",
    summary: "실적 발표 및 인센티브 안내",
    views: 44,
  },
  {
    id: 8,
    title: "사내 보안 교육 회의",
    writer: "보안팀",
    date: "2025-06-20",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "보안팀, 전사",
    summary: "보안 교육 및 정책 안내",
    views: 27,
  },
  {
    id: 9,
    title: "회의실 예약 정책 회의",
    writer: "관리자",
    date: "2025-06-19",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "관리자, 총무팀",
    summary: "회의실 예약 시스템 개선",
    views: 19,
  },
  {
    id: 10,
    title: "점심시간 조정 회의",
    writer: "총무팀",
    date: "2025-06-18",
    content : '회의록 내용은 여기에 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다.',
    participants: "총무팀, 전사",
    summary: "점심시간 변경 및 안내",
    views: 25,
  },
];

const POSTS_PER_PAGE = 5;

export default function Board() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // 제목, 작성자, 참가자, 요약으로 검색
  const filteredPosts = meetingMinutes.filter(
    post =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.writer.toLowerCase().includes(search.toLowerCase()) ||
      post.participants.toLowerCase().includes(search.toLowerCase()) ||
      post.summary.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const startIdx = (page - 1) * POSTS_PER_PAGE;
  const endIdx = startIdx + POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIdx, endIdx);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // 검색어 입력 시 1페이지로 이동
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card padding_60_0">
          <div className="card_title font_700 text_center">회의록</div>
          {/* 검색창 */}
          <div className="board_search_wrap">
            <input
              className="board_search_input"
              type="text"
              placeholder="제목, 작성자, 참가자, 요약 검색"
              value={search}
              onChange={handleSearchChange}
            />
            <button className="board_search_btn" tabIndex={-1}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#433878" strokeWidth="2"/>
                <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#433878" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <table className="board_table">
            <thead>
              <tr>
                <th className="small_text">제목</th>
                <th className="small_text">작성자</th>
                <th className="small_text">참가자</th>
                <th className="small_text">요약</th>
                <th className="small_text">등록일</th>
                <th className="small_text">조회수</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "#aaa", padding: "32px 0" }}>검색 결과가 없습니다.</td>
                </tr>
              ) : (
                currentPosts.map((post) => (

                    
                  <tr key={post.id}>
                    <td className="board_title">
                      <Link href={`/component/meeting/meeting_detail/${post.id}`}>
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.writer}</td>
                    <td>{post.participants}</td>
                    <td>{post.summary}</td>
                    <td>{post.date}</td>
                    <td>{post.views}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* 페이지네이션 */}
          <div className="board_pagination">
            <button
              className="board_btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              이전
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                className={`board_btn board_page_btn${page === idx + 1 ? " active" : ""}`}
                onClick={() => handlePageChange(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="board_btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              다음
            </button>
          </div>
          <div className="board_footer">
            <Link href="/component/meeting/meeting_write">
              <button className="board_btn">회의록 작성</button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
